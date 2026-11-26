// Generates the files the upload matrix sends. Usage: node scripts/make-fixtures.mjs <output-dir>
// Nothing here is committed: the big and "bomb" files are generated on demand.
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createRequire } from "node:module";

const sharp = createRequire(process.cwd() + "/")("sharp");
const out = process.argv[2] ?? "fixtures";
mkdirSync(out, { recursive: true });

const scene = (w, h) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7a1f1f"/><stop offset="1" stop-color="#e8a33d"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${w * 0.3}" cy="${h * 0.55}" r="${h * 0.22}" fill="#f4ead2"/><circle cx="${w * 0.7}" cy="${h * 0.45}" r="${h * 0.16}" fill="#3b5d2a"/>
  <rect x="${w * 0.1}" y="${h * 0.78}" width="${w * 0.8}" height="${h * 0.06}" fill="#2b1a10"/></svg>`);

// 1. a real photograph-shaped JPEG that carries an EXIF block WITH a GPS position (the privacy leak a phone photo has)
await sharp(scene(1600, 1200)).jpeg({ quality: 90 })
  .withExif({ IFD0: { Make: "TestPhone", Copyright: "Yod Abyssinia" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "9/1 1/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "38/1 45/1 0/1" } })
  .toFile(join(out, "yod.jpg"));
// 2. a real PNG
await sharp(scene(800, 600)).png().toFile(join(out, "logo.png"));
// 3. a JPEG over 2 MB (noise does not compress)
await sharp({ create: { width: 2400, height: 2400, channels: 3, background: "#888", noise: { type: "gaussian", mean: 128, sigma: 60 } } }).jpeg({ quality: 95 }).toFile(join(out, "big.jpg"));
// 4 and 5. not images at all, renamed .jpg
writeFileSync(join(out, "fake-pdf.jpg"), "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n");
writeFileSync(join(out, "shell.jpg"), "<?php system($_GET['c']); ?>\n");
// 6. a pixel bomb: a valid PNG that is small on disk and 64 million pixels when decoded
await sharp({ create: { width: 8000, height: 8000, channels: 3, background: "#123456" } }).png({ compressionLevel: 9 }).toFile(join(out, "bomb.png"));

for (const f of ["yod.jpg", "logo.png", "big.jpg", "fake-pdf.jpg", "shell.jpg", "bomb.png"]) console.log(f.padEnd(14), String(statSync(join(out, f)).size).padStart(9), "bytes");
