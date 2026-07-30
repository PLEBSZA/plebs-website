import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceDir = path.join(root, "assets", "source", "plebs");
const publicImagesDir = path.join(root, "public", "images");
const brandDir = path.join(publicImagesDir, "brand");
const productDir = path.join(
  publicImagesDir,
  "products",
  "cotton-corduroy-dungarees",
);
const socialDir = path.join(publicImagesDir, "social");
const emailDir = path.join(publicImagesDir, "email");

await Promise.all(
  [brandDir, productDir, socialDir, emailDir].map((directory) =>
    mkdir(directory, { recursive: true }),
  ),
);

const sourceSvg = await readFile(
  path.join(sourceDir, "2 (1) SVG LOGO.txt"),
  "utf8",
);

if (
  !sourceSvg.startsWith("<svg") ||
  /<script|on\w+\s*=|foreignObject|(?:href|src)\s*=\s*["']https?:/i.test(
    sourceSvg,
  )
) {
  throw new Error("The supplied logo SVG failed the safety check.");
}

const suppliedPaths = [...sourceSvg.matchAll(/<path\b[^>]*\/>/g)].map(
  ([value]) => value.replaceAll('fill="#1B3D1B"', 'fill="#17382A"'),
);

if (suppliedPaths.length !== 5) {
  throw new Error(`Expected five supplied logo paths, found ${suppliedPaths.length}.`);
}

// The supplied artwork spells PLEB. This S extends the approved geometric
// wordmark without changing any of the supplied path geometry.
const sPath =
  '<path d="M496 44.68C489.53 39.96 481.76 37.6 472.69 37.6C454.56 37.6 443.34 47.04 443.34 61.2C443.34 74.416 452.84 81.968 471.83 87.16C489.09 91.88 496.86 97.544 496.86 109.344C496.86 121.144 487.37 127.28 472.69 127.28C462.33 127.28 452.84 124.448 444.2 118.784V124.448C452.84 129.64 462.33 132 472.69 132C490.82 132 501.18 122.56 501.18 108.872C501.18 95.184 491.69 87.632 472.69 82.44C455.43 77.72 447.66 72.056 447.66 60.728C447.66 49.4 457.15 42.32 472.69 42.32C481.33 42.32 489.09 44.68 496 49.4V44.68Z" fill="#17382A"/>';

const fullLogo = `<svg width="606" height="188" viewBox="0 0 606 188" fill="none" xmlns="http://www.w3.org/2000/svg">
${suppliedPaths.slice(0, 4).join("\n")}
${sPath}
${suppliedPaths[4]}
</svg>
`;

const wordmark = `<svg width="606" height="132" viewBox="0 0 606 132" fill="none" xmlns="http://www.w3.org/2000/svg">
${suppliedPaths.slice(0, 4).join("\n")}
${sPath}
</svg>
`;

await Promise.all([
  writeFile(path.join(brandDir, "plebs-logo.svg"), fullLogo),
  writeFile(path.join(brandDir, "plebs-wordmark.svg"), wordmark),
]);

const campaignSource = path.join(sourceDir, "PLEB.webp");
const picnicSource = path.join(sourceDir, "PLEB_2.webp");
const sharingSource = path.join(sourceDir, "PLEB_3.webp");

await Promise.all([
  sharp(campaignSource)
    .extract({ left: 0, top: 300, width: 1587, height: 1710 })
    .webp({ quality: 82, smartSubsample: true })
    .toFile(path.join(productDir, "plebs-campaign-editorial.webp")),
  sharp(picnicSource)
    .webp({ quality: 82, smartSubsample: true })
    .toFile(path.join(productDir, "plebs-picnic-lifestyle.webp")),
  sharp(sharingSource)
    .webp({ quality: 82, smartSubsample: true })
    .toFile(path.join(productDir, "plebs-picnic-sharing.webp")),
]);

const detailsSourceDir = path.join(sourceDir, "details");
const lifestyleSourceDir = path.join(sourceDir, "lifestyle");

await Promise.all([
  sharp(Buffer.from(fullLogo))
    .resize({ width: 360, withoutEnlargement: true })
    .png({ compressionLevel: 9 })
    .toFile(path.join(emailDir, "plebs-logo-email.png")),
  sharp(path.join(detailsSourceDir, "texture_2.jpg"))
    .rotate()
    .resize({ width: 1200, withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(emailDir, "plebs-corduroy-detail-email.jpg")),
  sharp(campaignSource)
    .extract({ left: 0, top: 300, width: 1587, height: 1710 })
    .resize({ width: 900, withoutEnlargement: true })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(path.join(emailDir, "plebs-dungarees-email.jpg")),
]);

async function writePortraitWebp(inputPath, outputName, { width = 1200, height = 1500 } = {}) {
  const metadata = await sharp(inputPath).metadata();
  const pipeline = sharp(inputPath).rotate();

  await pipeline
    .resize(width, height, {
      fit: "cover",
      position: metadata.width >= metadata.height ? "centre" : "attention",
    })
    .webp({ quality: 80, smartSubsample: true })
    .toFile(path.join(productDir, outputName));
}

async function writeLifestyleWebp(inputPath, outputName, maxEdge = 1600) {
  await sharp(inputPath)
    .rotate()
    .resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82, smartSubsample: true })
    .toFile(path.join(productDir, outputName));
}

await Promise.all([
  writePortraitWebp(
    path.join(detailsSourceDir, "texture.jpg"),
    "plebs-detail-pocket-hand.webp",
  ),
  writePortraitWebp(
    path.join(detailsSourceDir, "texture_2.jpg"),
    "plebs-detail-folded-label.webp",
  ),
  writeLifestyleWebp(
    path.join(detailsSourceDir, "texture_2.jpg"),
    "plebs-detail-folded-label-wide.webp",
    1800,
  ),
  writePortraitWebp(
    path.join(detailsSourceDir, "texture_3.jpg"),
    "plebs-detail-bib-label.webp",
  ),
  writePortraitWebp(
    path.join(detailsSourceDir, "texture_4.jpg"),
    "plebs-detail-side-pocket.webp",
  ),
  writePortraitWebp(
    path.join(detailsSourceDir, "texture_behind.jpg"),
    "plebs-detail-bib-buttons.webp",
  ),
  writeLifestyleWebp(
    path.join(lifestyleSourceDir, "IMG_9057-Enhanced-NR.jpg"),
    "plebs-lifestyle-duo-window.webp",
  ),
  writeLifestyleWebp(
    path.join(lifestyleSourceDir, "IMG_9070.jpg"),
    "plebs-lifestyle-strap-ties.webp",
  ),
  writeLifestyleWebp(
    path.join(lifestyleSourceDir, "IMG_9100.jpg"),
    "plebs-lifestyle-tapestry.webp",
  ),
  writeLifestyleWebp(
    path.join(lifestyleSourceDir, "IMG_9198.jpg"),
    "plebs-lifestyle-green-tiles.webp",
  ),
  writeLifestyleWebp(
    path.join(lifestyleSourceDir, "IMG_9495.jpg"),
    "plebs-lifestyle-sofa.webp",
  ),
]);

// Remove oversized unoptimized dumps if present.
for (const stale of [
  "texture.webp",
  "texture_3.webp",
  "texture_4.webp",
  "texture_behind.webp",
]) {
  try {
    await unlink(path.join(productDir, stale));
  } catch {
    // ignore missing
  }
}

const socialText = (title, subtitle) =>
  Buffer.from(`<svg width="540" height="330" viewBox="0 0 540 330" xmlns="http://www.w3.org/2000/svg">
    <style>
      .title { fill: #17382A; font: 600 52px Georgia, serif; }
      .subtitle { fill: #4D4238; font: 26px Arial, sans-serif; }
    </style>
    <text x="0" y="72" class="title">${title}</text>
    <text x="0" y="138" class="title">Corduroy</text>
    <text x="0" y="204" class="title">Dungarees</text>
    <text x="0" y="286" class="subtitle">${subtitle}</text>
  </svg>`);

async function createSocialCard({ image, output, title, subtitle }) {
  const photo = await sharp(image)
    .resize(600, 630, { fit: "cover", position: "attention" })
    .toBuffer();
  const logo = await sharp(Buffer.from(wordmark))
    .resize({ width: 250 })
    .toBuffer();

  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: "#FBF8F1",
    },
  })
    .composite([
      { input: photo, left: 600, top: 0 },
      { input: logo, left: 60, top: 52 },
      {
        input: socialText(title, subtitle),
        left: 60,
        top: 180,
      },
    ])
    .webp({ quality: 84, smartSubsample: true })
    .toFile(output);
}

await Promise.all([
  createSocialCard({
    image: picnicSource,
    output: path.join(socialDir, "plebs-og-default.webp"),
    title: "100% Cotton",
    subtitle: "Made by PLEBS. Worn your way.",
  }),
  createSocialCard({
    image: campaignSource,
    output: path.join(socialDir, "plebs-og-product.webp"),
    title: "100% Cotton",
    subtitle: "The PLEBS original.",
  }),
]);

const iconSvg = `<svg width="64" height="64" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="12" fill="#17382A"/>
  <path d="M20 14V50H23V34H31C38.5 34 44 29.5 44 24C44 18.5 38.5 14 31 14H20ZM23 17H31C36.8 17 41 20 41 24C41 28 36.8 31 31 31H23V17Z" fill="#F7F2E8"/>
</svg>
`;

await writeFile(path.join(root, "src", "app", "icon.svg"), iconSvg);
await sharp(Buffer.from(iconSvg))
  .resize(180, 180)
  .png()
  .toFile(path.join(root, "src", "app", "apple-icon.png"));

console.log("PLEBS production media prepared.");
