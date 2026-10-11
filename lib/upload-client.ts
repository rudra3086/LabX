// Browser-side upload helper (spec §127). Uses XHR so we can surface real
// upload progress; `fetch` cannot report upload progress.

export type ApiEnvelope<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: { code?: string; message?: string } };

export interface UploadResult<T = unknown> {
  ok: boolean;
  status: number;
  body: ApiEnvelope<T> | null;
}

export function uploadWithProgress<T = unknown>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<UploadResult<T>> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.responseType = "text";

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.min(100, Math.round((e.loaded / e.total) * 100)));
        }
      };
    }

    xhr.onload = () => {
      let body: UploadResult<T>["body"] = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        body = null;
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, status: xhr.status, body });
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(formData);
  });
}

export function describeUploadError(body: UploadResult["body"], fallback = "Upload failed."): string {
  return body && body.success === false ? body.error.message ?? fallback : fallback;
}

/** Validate a file against an extension allow-list and a size limit, client-side. */
export function clientValidateFile(
  file: File,
  opts: { allowedExtensions?: string[]; maxSizeMb?: number }
): string | null {
  const maxBytes = (opts.maxSizeMb ?? 25) * 1024 * 1024;
  if (file.size === 0) return "This file is empty.";
  if (file.size > maxBytes) return `File exceeds the ${Math.round(maxBytes / (1024 * 1024))} MB limit.`;
  if (opts.allowedExtensions && opts.allowedExtensions.length > 0) {
    const dot = file.name.lastIndexOf(".");
    const ext = dot >= 0 ? file.name.slice(dot).toLowerCase() : "";
    const allowed = opts.allowedExtensions.map((e) => (e.startsWith(".") ? e.toLowerCase() : `.${e.toLowerCase()}`));
    if (!ext || !allowed.includes(ext)) {
      return `Unsupported file type. Allowed: ${allowed.join(", ")}.`;
    }
  }
  return null;
}
