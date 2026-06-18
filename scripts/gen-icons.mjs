import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const GREEN = "#2f9e57";
const CAP = ["M22 10v6M2 10l10-5 10 5-10 5z", "M6 12v5c3 3 9 3 12 0v-5"];

function svg(size, { maskable = false } = {}) {
  const radius = maskable ? 0 : size * 0.22;
  const scale = maskable ? (size / 24) * 0.5 : (size / 24) * 0.58;
  const inner = 24 * scale;
  const off = (size - inner) / 2;
  const paths = CAP.map(
    (d) => `<path d="${d}" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="${GREEN}"/>
  <g transform="translate(${off} ${off}) scale(${scale})">${paths}</g>
</svg>`;
}

await mkdir(new URL("../public/icons", import.meta.url), { recursive: true });

const targets = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  const buf = Buffer.from(svg(t.size, { maskable: t.maskable }));
  await sharp(buf).png().toFile(new URL(`../public/icons/${t.name}`, import.meta.url).pathname);
  console.log("wrote", t.name);
}

await writeFile(new URL("../public/icon.svg", import.meta.url), svg(64));
console.log("wrote icon.svg");
