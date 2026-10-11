import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ApiError } from "./http";

// ============================================================================
// File storage layer (spec §22, §23, §55, §56, §97, §98, §146).
//
// The database keeps file *metadata*; the filesystem keeps file *contents*.
// Raw storage paths are never exposed to clients — files are always served
// through authorized API routes. Storage keys are relative POSIX-style paths
// rooted under STORAGE_DIR and are validated against path traversal.
// ============================================================================

export interface StoredFile {
  /** Relative, POSIX-style key rooted under the storage dir. */
  storageKey: string;
  storedName: string;
  sizeBytes: number;
  mimeType: string;
}

/** Acceptable upload categories (spec §22). Extension → canonical mime. */
const EXTENSION_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".md": "text/markdown",
  ".json": "application/json",
  ".xml": "application/xml",
  ".zip": "application/zip",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".c": "text/x-c",
  ".h": "text/x-c",
  ".cpp": "text/x-c++",
  ".hpp": "text/x-c++",
  ".java": "text/x-java",
  ".py": "text/x-python",
  ".js": "text/javascript",
  ".ts": "text/typescript",
  ".sql": "application/sql",
  ".r": "text/x-r",
  ".rb": "text/x-ruby",
  ".go": "text/x-go",
  ".rs": "text/x-rust",
  ".sh": "text/x-sh",
};

const EXTENSION_KIND: Record<string, "pdf" | "zip" | "ole" | "png" | "jpeg" | "gif" | "text"> = {
  ".pdf": "pdf",
  ".doc": "ole",
  ".docx": "zip",
  ".ppt": "ole",
  ".pptx": "zip",
  ".xls": "ole",
  ".xlsx": "zip",
  ".zip": "zip",
  ".png": "png",
  ".jpg": "jpeg",
  ".jpeg": "jpeg",
  ".gif": "gif",
  ".txt": "text",
  ".csv": "text",
  ".md": "text",
  ".json": "text",
  ".xml": "text",
  ".c": "text",
  ".h": "text",
  ".cpp": "text",
  ".hpp": "text",
  ".java": "text",
  ".py": "text",
  ".js": "text",
  ".ts": "text",
  ".sql": "text",
  ".r": "text",
  ".rb": "text",
  ".go": "text",
  ".rs": "text",
  ".sh": "text",
};

export const ALLOWED_EXTENSIONS = Object.keys(EXTENSION_KIND);

export function mimeForExtension(ext: string): string {
  return EXTENSION_MIME[ext.toLowerCase()] ?? "application/octet-stream";
}

function storageRoot(): string {
  return path.resolve(process.env.STORAGE_DIR ?? "./storage/uploads");
}

export function maxFileSizeMb(defaultMb = 25): number {
  const raw = Number(process.env.MAX_FILE_SIZE_MB);
  return Number.isFinite(raw) && raw > 0 ? raw : defaultMb;
}

/** Strip directory components and control characters from a user-supplied name. */
export function sanitizeFileName(input: string): string {
  const base = path.basename(input).replace(/[\u0000-\u001f\u007f]/g, "").trim();
  const cleaned = base.replace(/[\\/]/g, "_");
  return cleaned.length > 0 ? cleaned.slice(0, 200) : "file";
}

export function fileExtension(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx < 0) return "";
  return name.slice(idx).toLowerCase();
}

/**
 * Resolve a storage key to an absolute path, refusing anything that escapes the
 * storage root (spec §55: prevent path traversal).
 */
export function resolveStoragePath(storageKey: string): string {
  const root = storageRoot();
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");
  const abs = path.resolve(root, normalized);
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep;
  if (abs !== root && !abs.startsWith(rootWithSep)) {
    throw new ApiError("Invalid file reference.", 400, "INVALID_FILE");
  }
  return abs;
}

/** Detect the true content kind from magic bytes (never trust the extension). */
function detectKind(buffer: Buffer): "pdf" | "zip" | "ole" | "png" | "jpeg" | "gif" | "text" | "binary" {
  if (buffer.length >= 4 && buffer.subarray(0, 4).toString("latin1") === "%PDF") return "pdf";
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) return "zip";
  if (buffer.length >= 8 && buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) return "ole";
  if (buffer.length >= 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer.length >= 6 && buffer.subarray(0, 6).toString("latin1") === "GIF87a") return "gif";
  if (buffer.length >= 6 && buffer.subarray(0, 6).toString("latin1") === "GIF89a") return "gif";

  // Heuristic for text: no NUL bytes and mostly printable characters.
  const sample = buffer.subarray(0, 8192);
  if (sample.includes(0)) return "binary";
  let printable = 0;
  for (const byte of sample) {
    if (byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte !== 127)) printable++;
  }
  if (sample.length === 0 || printable / sample.length > 0.9) return "text";
  return "binary";
}

function kindMatchesExtension(kind: string, ext: string): boolean {
  const expected = EXTENSION_KIND[ext];
  if (!expected) return false;
  if (expected === "text") return kind === "text";
  return kind === expected;
}

export interface ValidatedFile {
  buffer: Buffer;
  originalName: string;
  extension: string;
  mimeType: string;
  sizeBytes: number;
}

/**
 * Validate an uploaded file by size, extension and *actual* content signature
 * (spec §22: never trust only the file extension).
 */
export async function validateUpload(
  file: File,
  opts: { allowedExtensions?: string[]; maxSizeMb?: number } = {}
): Promise<ValidatedFile> {
  const allowed = (opts.allowedExtensions && opts.allowedExtensions.length > 0
    ? opts.allowedExtensions
    : ALLOWED_EXTENSIONS
  ).map((e) => (e.startsWith(".") ? e.toLowerCase() : `.${e.toLowerCase()}`));

  const maxBytes = (opts.maxSizeMb ?? maxFileSizeMb()) * 1024 * 1024;

  if (file.size === 0) {
    throw new ApiError("The uploaded file is empty.", 400, "INVALID_FILE");
  }
  if (file.size > maxBytes) {
    throw new ApiError(
      `File "${file.name}" exceeds the ${Math.round(maxBytes / (1024 * 1024))} MB limit.`,
      413,
      "FILE_TOO_LARGE"
    );
  }

  const originalName = sanitizeFileName(file.name);
  const ext = fileExtension(originalName);
  if (!ext || !allowed.includes(ext)) {
    throw new ApiError(
      `"${originalName}" has an unsupported file type. Allowed: ${allowed.join(", ")}.`,
      400,
      "INVALID_FILE"
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = detectKind(buffer);
  if (!kindMatchesExtension(kind, ext)) {
    throw new ApiError(
      `"${originalName}" does not look like a valid ${ext.slice(1).toUpperCase()} file.`,
      400,
      "INVALID_FILE"
    );
  }

  return {
    buffer,
    originalName,
    extension: ext,
    mimeType: file.type && file.type !== "application/octet-stream" ? file.type : mimeForExtension(ext),
    sizeBytes: buffer.length,
  };
}

/** Persist a validated file under `dir` (relative to the storage root). */
export async function persistFile(dir: string, file: ValidatedFile): Promise<StoredFile> {
  const safeDir = dir.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  const storedName = `${crypto.randomUUID()}${file.extension}`;
  const storageKey = safeDir ? `${safeDir}/${storedName}` : storedName;
  const abs = resolveStoragePath(storageKey);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, file.buffer);
  return {
    storageKey,
    storedName,
    sizeBytes: file.sizeBytes,
    mimeType: file.mimeType,
  };
}

export async function deleteStoredFile(storageKey: string): Promise<void> {
  try {
    const abs = resolveStoragePath(storageKey);
    await fs.unlink(abs);
  } catch (err) {
    // Deleting a file that is already gone must not fail the request.
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("[uploads] failed to delete", storageKey, err);
    }
  }
}

export async function readStoredFile(storageKey: string): Promise<Buffer> {
  const abs = resolveStoragePath(storageKey);
  try {
    return await fs.readFile(abs);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ApiError("The stored file could not be found.", 404, "NOT_FOUND");
    }
    throw err;
  }
}

/** Sanitize a filename for use inside a Content-Disposition header. */
export function contentDisposition(originalName: string, inline = false): string {
  const safe = originalName.replace(/[\r\n"]/g, "").replace(/[^\x20-\x7e]/g, "_");
  return `${inline ? "inline" : "attachment"}; filename="${safe}"`;
}
