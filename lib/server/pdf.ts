/**
 * Dependency-free minimal PDF writer (spec §42).
 *
 * Supports the small subset of PDF needed to render our report exports:
 * multiple A4 pages, WinAnsi text with a regular/bold Helvetica font pair,
 * straight lines and filled rectangles (used for table rules and header bars).
 *
 * All coordinates are given in points with a TOP-LEFT origin; the builder
 * converts them to PDF's native bottom-left origin internally.
 *
 * No external packages (and no font embedding) are used — only the 14
 * standard PDF base fonts are referenced by name.
 */

export const A4_WIDTH = 595.28;
export const A4_HEIGHT = 841.89;

export type PdfColor = [number, number, number]; // each channel 0..1

const BLACK: PdfColor = [0, 0, 0];

export interface PdfDocumentOptions {
  width?: number;
  height?: number;
}

export interface PdfTextOptions {
  size?: number;
  bold?: boolean;
  color?: PdfColor;
}

export interface PdfLineOptions {
  width?: number;
  color?: PdfColor;
}

interface ContentEntry {
  kind: "text" | "line" | "rect";
  // Text
  x?: number;
  y?: number;
  text?: string;
  size?: number;
  bold?: boolean;
  color?: PdfColor;
  // Line
  x2?: number;
  y2?: number;
  lineWidth?: number;
  // Rect
  w?: number;
  h?: number;
  fill?: PdfColor;
}

/**
 * Maps a Unicode code point to a WinAnsiEncoding byte (0..255).
 * Latin-1 range passes through directly; a handful of common typographic
 * characters are mapped to their WinAnsi code points. Anything unmappable
 * becomes "?".
 */
const WINANSI_SPECIAL: Record<string, number> = {
  "\u20AC": 0x80, // €
  "\u201A": 0x82,
  "\u0192": 0x83,
  "\u201E": 0x84,
  "\u2026": 0x85, // …
  "\u2020": 0x86,
  "\u2021": 0x87,
  "\u02C6": 0x88,
  "\u2030": 0x89,
  "\u0160": 0x8a,
  "\u2039": 0x8b,
  "\u0152": 0x8c,
  "\u017D": 0x8e,
  "\u2018": 0x91, // ‘
  "\u2019": 0x92, // ’
  "\u201C": 0x93, // “
  "\u201D": 0x94, // ”
  "\u2022": 0x95, // •
  "\u2013": 0x96, // –
  "\u2014": 0x97, // —
  "\u02DC": 0x98,
  "\u2122": 0x99, // ™
  "\u0161": 0x9a,
  "\u203A": 0x9b,
  "\u0153": 0x9c,
  "\u017E": 0x9e,
  "\u0178": 0x9f,
};

function encodeWinAnsi(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0)!;
    if (code > 255) {
      out += String.fromCharCode(WINANSI_SPECIAL[ch] ?? 0x3f); // "?"
    } else {
      out += String.fromCharCode(code);
    }
  }
  return out;
}

function escapePdfString(input: string): string {
  let out = "";
  for (const ch of input) {
    const code = ch.charCodeAt(0);
    if (ch === "\\") out += "\\\\";
    else if (ch === "(") out += "\\(";
    else if (ch === ")") out += "\\)";
    else if (code === 10) out += "\\n";
    else if (code === 13) out += "\\r";
    else if (code === 9) out += "\\t";
    else out += ch;
  }
  return out;
}

function fmt(n: number): string {
  // Trim to 2 decimals, drop trailing zeros.
  return (Math.round(n * 100) / 100).toString();
}

export class PdfDocument {
  readonly width: number;
  readonly height: number;

  private pages: ContentEntry[][] = [];
  private current: ContentEntry[] | null = null;

  constructor(options: PdfDocumentOptions = {}) {
    this.width = options.width ?? A4_WIDTH;
    this.height = options.height ?? A4_HEIGHT;
  }

  get pageCount(): number {
    return this.pages.length;
  }

  addPage(): void {
    this.current = [];
    this.pages.push(this.current);
  }

  private ensurePage(): ContentEntry[] {
    if (!this.current) this.addPage();
    return this.current!;
  }

  text(x: number, y: number, text: string, options: PdfTextOptions = {}): void {
    const page = this.ensurePage();
    page.push({
      kind: "text",
      x,
      y,
      text,
      size: options.size ?? 10,
      bold: options.bold ?? false,
      color: options.color ?? BLACK,
    });
  }

  /** Adds text to an already-created page (used for footers/page numbers). */
  textOnPage(
    pageIndex: number,
    x: number,
    y: number,
    text: string,
    options: PdfTextOptions = {}
  ): void {
    const page = this.pages[pageIndex];
    if (!page) return;
    page.push({
      kind: "text",
      x,
      y,
      text,
      size: options.size ?? 10,
      bold: options.bold ?? false,
      color: options.color ?? BLACK,
    });
  }

  line(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: PdfLineOptions = {}
  ): void {
    const page = this.ensurePage();
    page.push({
      kind: "line",
      x: x1,
      y: y1,
      x2,
      y2,
      lineWidth: options.width ?? 0.5,
      color: options.color ?? BLACK,
    });
  }

  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    options: { fill?: PdfColor } = {}
  ): void {
    if (!options.fill) return;
    const page = this.ensurePage();
    page.push({
      kind: "rect",
      x,
      y,
      w,
      h,
      fill: options.fill,
    });
  }

  private contentStream(entries: ContentEntry[]): string {
    const ops: string[] = [];
    for (const e of entries) {
      if (e.kind === "text") {
        const size = e.size ?? 10;
        const color = e.color ?? BLACK;
        const font = e.bold ? "/F2" : "/F1";
        const baseline = this.height - (e.y! + size * 0.8);
        ops.push(`${fmt(color[0])} ${fmt(color[1])} ${fmt(color[2])} rg`);
        ops.push(
          `BT ${font} ${fmt(size)} Tf ${fmt(e.x!)} ${fmt(baseline)} Td (${escapePdfString(
            encodeWinAnsi(e.text ?? "")
          )}) Tj ET`
        );
      } else if (e.kind === "line") {
        const color = e.color ?? BLACK;
        ops.push(
          `${fmt(color[0])} ${fmt(color[1])} ${fmt(color[2])} RG ${fmt(
            e.lineWidth ?? 0.5
          )} w`
        );
        ops.push(
          `${fmt(e.x!)} ${fmt(this.height - e.y!)} m ${fmt(e.x2!)} ${fmt(
            this.height - e.y2!
          )} l S`
        );
      } else if (e.kind === "rect") {
        const fill = e.fill ?? BLACK;
        ops.push(`${fmt(fill[0])} ${fmt(fill[1])} ${fmt(fill[2])} rg`);
        ops.push(
          `${fmt(e.x!)} ${fmt(this.height - e.y! - e.h!)} ${fmt(e.w!)} ${fmt(
            e.h!
          )} re f`
        );
      }
    }
    return ops.join("\n");
  }

  build(): Buffer {
    if (this.pages.length === 0) this.addPage();

    // Object numbering:
    // 1 = Catalog, 2 = Pages, 3 = Font F1, 4 = Font F2,
    // then per page: (5 + i*2) = Page, (6 + i*2) = Contents.
    const pageCount = this.pages.length;
    const totalObjects = 4 + pageCount * 2;
    const objects: string[] = new Array(totalObjects);

    const kidIds: string[] = [];
    for (let i = 0; i < pageCount; i++) {
      const pageId = 5 + i * 2;
      const contentId = 6 + i * 2;
      kidIds.push(`${pageId} 0 R`);

      const stream = this.contentStream(this.pages[i]);
      const streamBytes = Buffer.from(stream, "latin1").length;

      objects[pageId - 1] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(this.width)} ${fmt(
          this.height
        )}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`;

      objects[contentId - 1] =
        `<< /Length ${streamBytes} >>\nstream\n${stream}\nendstream`;
    }

    objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;
    objects[1] = `<< /Type /Pages /Count ${pageCount} /Kids [${kidIds.join(
      " "
    )}] >>`;
    objects[2] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
    objects[3] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

    const chunks: Buffer[] = [];
    let offset = 0;
    const push = (s: string) => {
      const b = Buffer.from(s, "latin1");
      chunks.push(b);
      offset += b.length;
    };

    push("%PDF-1.4\n");
    // Binary comment marks the file as binary for transfer agents.
    push("%\u00E2\u00E3\u00CF\u00D3\n");

    const offsets: number[] = new Array(totalObjects + 1).fill(0);
    for (let i = 1; i <= totalObjects; i++) {
      offsets[i] = offset;
      push(`${i} 0 obj\n${objects[i - 1]}\nendobj\n`);
    }

    const xrefOffset = offset;
    push(`xref\n0 ${totalObjects + 1}\n`);
    push(`0000000000 65535 f \n`);
    for (let i = 1; i <= totalObjects; i++) {
      push(`${String(offsets[i]).padStart(10, "0")} 00000 n \n`);
    }

    push(
      `trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`
    );

    return Buffer.concat(chunks);
  }
}

/**
 * Approximate advance width of a string in points for the Helvetica family.
 * Based on per-character width classes; good enough for wrapping/truncation.
 */
export function measureText(text: string, size: number, bold = false): number {
  let em = 0;
  for (const ch of text) {
    if ("ilj.,;:!|'`[]() ".includes(ch)) em += 0.28;
    else if ("mwMW".includes(ch)) em += 0.85;
    else if (ch >= "A" && ch <= "Z") em += bold ? 0.72 : 0.68;
    else if (ch >= "0" && ch <= "9") em += 0.56;
    else em += bold ? 0.56 : 0.52;
  }
  return em * size;
}

/** Truncates a string (appending an ellipsis) so it fits within maxWidth. */
export function truncateToWidth(
  text: string,
  maxWidth: number,
  size: number,
  bold = false
): string {
  if (measureText(text, size, bold) <= maxWidth) return text;
  const ellipsis = "\u2026";
  let out = "";
  for (const ch of text) {
    if (measureText(out + ch + ellipsis, size, bold) > maxWidth) break;
    out += ch;
  }
  return out + ellipsis;
}

/** Wraps text into lines no wider than maxWidth. Returns at least one line. */
export function wrapText(
  text: string,
  maxWidth: number,
  size: number,
  bold = false
): string[] {
  const paragraphs = text.split(/\r?\n/);
  const lines: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (measureText(candidate, size, bold) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length > 0 ? lines : [""];
}
