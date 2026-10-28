import { mkdir, writeFile } from 'node:fs/promises';

const slugs = ['shelly-pro-1', 'shelly-pro-1pm', 'shelly-pro-2', 'shelly-pro-2pm', 'shelly-pro-3', 'shelly-pro-4pm', 'shelly-pro-dimmer-1pm', 'shelly-pro-dimmer-2pm', 'shelly-pro-dimmer-0-1-10v-pm', 'shelly-pro-rgbww-pm', 'shelly-pro-dual-cover-shutter-pm', 'shelly-pro-em-50', 'shelly-lan-switch'];
const directory = new URL('../public/assets/shelly/', import.meta.url);
await mkdir(directory, { recursive: true });
for (const slug of slugs) {
  const response = await fetch(`https://www.shelly.com/products/${slug}.js`);
  if (!response.ok) throw new Error(`${slug}: ${response.status}`);
  const product = await response.json();
  const url = new URL(product.images[0], 'https://www.shelly.com');
  if (url.hostname !== 'cdn.shopify.com') throw new Error('Unexpected asset host');
  url.searchParams.set('width', '400');
  const asset = await fetch(url);
  if (!asset.ok || !asset.headers.get('content-type')?.includes('image/png')) throw new Error(`${slug}: invalid PNG response`);
  await writeFile(new URL(`${slug}.png`, directory), Buffer.from(await asset.arrayBuffer()));
  console.log(`${slug}: ${url}`);
}
