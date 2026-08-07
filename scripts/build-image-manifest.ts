/**
 * Build a manifest of intrinsic image dimensions for everything under
 * public/img, written to src/lib/generated/image-manifest.json.
 *
 * Why: content images are plain <img> tags (next/image can't help — the sources
 * have arbitrary, unknown aspect ratios). Without width/height the browser
 * reserves no space, so every doc page shifted as its images arrived; and
 * without an intrinsic cap a 400px diagram was stretched across the full
 * ~950px column and went soft. Both are fixed by knowing the real size at
 * build time.
 *
 * Dimensions are parsed straight from the file headers — PNG IHDR, JPEG SOFn,
 * SVG width/height or viewBox — so this needs no image dependency.
 */
import fs from "node:fs";
import path from "node:path";

const PUBLIC_IMG = path.join(process.cwd(), "public", "img");
const GENERATED = path.join(process.cwd(), "src", "lib", "generated");

export type ImageMeta = {
  width: number;
  height: number;
};

function readPng(buf: Buffer): ImageMeta | null {
  if (buf.length < 26) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  // IHDR: width @16, height @20.
  return {
    width: buf.readUInt32BE(16),
    height: buf.readUInt32BE(20),
  };
}

function readJpeg(buf: Buffer): ImageMeta | null {
  if (buf.length < 4 || buf.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf.readUInt8(offset) !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf.readUInt8(offset + 1);
    // SOF0-SOF15 carry the frame header; C4/C8/CC are not frame markers.
    if (
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      return {
        height: buf.readUInt16BE(offset + 5),
        width: buf.readUInt16BE(offset + 7),
      };
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd9)) {
      offset += 2;
      continue;
    }
    offset += 2 + buf.readUInt16BE(offset + 2);
  }
  return null;
}

function readSvg(text: string): ImageMeta | null {
  const num = (s: string | undefined) =>
    s ? Number.parseFloat(s.replace(/[^0-9.]/g, "")) : NaN;
  const w = num(/\bwidth\s*=\s*["']([^"']+)["']/.exec(text)?.[1]);
  const h = num(/\bheight\s*=\s*["']([^"']+)["']/.exec(text)?.[1]);
  if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
    return { width: Math.round(w), height: Math.round(h) };
  }
  const vb = /\bviewBox\s*=\s*["']([^"']+)["']/.exec(text)?.[1];
  if (vb) {
    const p = vb.trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p[2] > 0 && p[3] > 0) {
      return { width: Math.round(p[2]), height: Math.round(p[3]) };
    }
  }
  return null;
}

/**
 * Sniff the format from the file's magic bytes rather than its extension —
 * public/img/Rebalancer.png is really a JPEG, and trusting the name silently
 * dropped it from the manifest.
 */
function measure(file: string): ImageMeta | null {
  const buf = fs.readFileSync(file);
  if (buf.length >= 8 && buf.readUInt32BE(0) === 0x89504e47) return readPng(buf);
  if (buf.length >= 2 && buf.readUInt16BE(0) === 0xffd8) return readJpeg(buf);
  if (path.extname(file).toLowerCase() === ".svg") return readSvg(buf.toString("utf8"));
  return null;
}

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(png|jpe?g|svg)$/i.test(entry.name)) out.push(full);
  }
  return out;
}

function build() {
  const manifest: Record<string, ImageMeta> = {};
  let missed = 0;

  for (const file of walk(PUBLIC_IMG)) {
    const meta = measure(file);
    const key = `/${path.relative(path.join(process.cwd(), "public"), file).split(path.sep).join("/")}`;
    if (meta) manifest[key] = meta;
    else {
      missed++;
      console.warn(`[images] could not measure ${key}`);
    }
  }

  fs.mkdirSync(GENERATED, { recursive: true });
  fs.writeFileSync(
    path.join(GENERATED, "image-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    `images: ${Object.keys(manifest).length} measured${missed ? `, ${missed} skipped` : ""}`,
  );
}

build();
