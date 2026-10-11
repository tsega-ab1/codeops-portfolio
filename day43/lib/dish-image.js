// Server-only helpers. Picks /public/dishes/<slug>.(jpg|jpeg|webp|png) if it exists,
// otherwise a placeholder, so the page never shows a broken image.
import fs from "node:fs";
import path from "node:path";

export function publicFileExists(urlPath) {
  return fs.existsSync(path.join(process.cwd(), "public", urlPath));
}

export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function dishImageSrc(dish) {
  if (dish.image) return dish.image;
  const slug = slugify(dish.name);
  for (const ext of ["jpg", "jpeg", "webp", "png"]) {
    const file = `/dishes/${slug}.${ext}`;
    if (publicFileExists(file)) return file;
  }
  return "/dishes/placeholder.svg";
}
