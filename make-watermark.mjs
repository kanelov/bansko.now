import sharp from "sharp";
import fs from "node:fs";

// Pre-rendered so the serverless runtime never has to find a font.
const text = "© Lubo Kanelov";
const width = 1000;
const height = 150;
const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <text x="${width - 46}" y="${height - 46}" text-anchor="end"
    font-family="Georgia, 'Times New Roman', serif" font-size="58"
    fill="#ffffff" fill-opacity="0.85"
    stroke="#000000" stroke-opacity="0.35" stroke-width="1.4">${text}</text>
</svg>`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
fs.writeFileSync(process.argv[2], png);
console.log("png bytes", png.length);
