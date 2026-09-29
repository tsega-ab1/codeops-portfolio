const fs = require("fs");
const path = require("path");

const manifestPath = path.join(__dirname, ".next", "app-build-manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

const files = manifest.pages["/menu/page"] || [];
let totalBytes = 0;

console.log("JS files for /menu:");
for (const file of files) {
  const filePath = path.join(__dirname, ".next", file);
  if (fs.existsSync(filePath) && file.endsWith(".js")) {
    const size = fs.statSync(filePath).size;
    totalBytes += size;
    console.log(`  ${file} — ${(size / 1024).toFixed(1)} KB`);
  }
}

console.log(`\nTotal JS for /menu: ${(totalBytes / 1024).toFixed(1)} KB`);
