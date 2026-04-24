const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const candidates = [
  path.join(projectRoot, ".next"),
  path.join(projectRoot, "app", ".next"),
];

for (const target of candidates) {
  try {
    fs.rmSync(target, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

console.log("Cleaned Next cache folders.");
