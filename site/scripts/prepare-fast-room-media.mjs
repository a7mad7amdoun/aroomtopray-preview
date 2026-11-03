import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Make delivery sizes from the existing originals. Keep their full framing;
// attribution stays in the existing setting/photo data alongside the originals.
// Run from any directory: node site/scripts/prepare-fast-room-media.mjs
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const scenes = ['airport', 'campus', 'hospital'];
const jobs = scenes.flatMap((scene) => [
  ...[384, 768].map((width) => ({
    source: `art/room-threshold/${scene}-1086.webp`,
    previous: `art/room-threshold/${scene}-${width === 384 ? 720 : 1086}.webp`,
    destination: `art/room-threshold/${scene}-fast-${width}.webp`,
    width,
  })),
  {
    source: `photos/settings/${scene}-2160.webp`,
    previous: `photos/settings/${scene}-720.webp`,
    destination: `photos/settings/${scene}-360.webp`,
    width: 360,
  },
]);

const results = [];
for (const job of jobs) {
  const source = path.join(publicDir, job.source);
  const destination = path.join(publicDir, job.destination);
  const original = await sharp(source).metadata();
  await sharp(source)
    .resize({ width: job.width, withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
    .webp({ quality: 82, effort: 6, smartSubsample: true })
    .toFile(destination);

  // Decode the output, not only its header, to catch corrupt or incomplete files.
  const { info } = await sharp(destination).raw().toBuffer({ resolveWithObject: true });
  const expectedHeight = Math.round(original.height * job.width / original.width);
  if (info.width !== job.width || info.height !== expectedHeight) {
    throw new Error(`Unexpected dimensions for ${job.destination}: ${info.width}×${info.height}`);
  }
  const [current, previous] = await Promise.all([
    stat(destination),
    stat(path.join(publicDir, job.previous)),
  ]);
  results.push({
    file: job.destination,
    width: info.width,
    height: info.height,
    bytes: current.size,
    comparedWith: job.previous,
    previousBytes: previous.size,
    reductionPercent: Number(((1 - current.size / previous.size) * 100).toFixed(1)),
    decoded: true,
  });
}

console.log(JSON.stringify(results, null, 2));
