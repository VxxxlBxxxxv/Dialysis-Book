// Инкремент счётчика сборки в constants/build.ts. Запускать перед gradle assemble.
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "constants", "build.ts");
const src = fs.readFileSync(file, "utf8");
const match = src.match(/export const BUILD_NUMBER = (\d+);/);
if (!match) {
  console.error("BUILD_NUMBER не найден в constants/build.ts");
  process.exit(1);
}
const next = Number(match[1]) + 1;
fs.writeFileSync(
  file,
  src.replace(/export const BUILD_NUMBER = \d+;/, `export const BUILD_NUMBER = ${next};`)
);
console.log(`BUILD_NUMBER -> ${next}`);
