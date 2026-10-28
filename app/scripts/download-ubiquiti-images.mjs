import { mkdir, readFile, writeFile } from 'node:fs/promises';

const source = await readFile(new URL('../app/baie/rack.tsx', import.meta.url), 'utf8');
const products = JSON.parse(source.match(/const catalogue = (\[[\s\S]*?\]);/)[1]);
const directory = new URL('../public/assets/ubiquiti/', import.meta.url);
await mkdir(directory, { recursive: true });
const manifest = [];
for (const product of products) {
  const response = await fetch(product.url);
  if (!response.ok) throw new Error(`${product.reference}: ${response.status}`);
  const html = await response.text();
  const tags = [...html.matchAll(/<img[^>]+>/g)].map(match => match[0]);
  const gallery = tags.filter(tag => tag.includes('width="80"') && !tag.includes('alt="Video"'));
  const urls = [...new Set(gallery.map(tag => new URL(tag.match(/ src="([^"]+)"/)[1].replaceAll('&amp;', '&')).searchParams.get('u')))];
  const images = [];
  for (const [index, url] of urls.slice(0, 1).entries()) {
    if (new URL(url).hostname !== 'cdn.ecomm.ui.com') throw new Error('Unexpected asset host');
    const asset = await fetch(url);
    if (!asset.ok || !asset.headers.get('content-type')?.includes('image/')) throw new Error(`${product.reference}: invalid image`);
    const file = `${product.reference.toLowerCase()}-${index}.png`;
    await writeFile(new URL(file, directory), Buffer.from(await asset.arrayBuffer()));
    images.push({ file, url });
  }
  if (!images.length) throw new Error(`${product.reference}: missing gallery`);
  manifest.push({ reference: product.reference, page: product.url, images });
  console.log(`${product.reference}: ${images.length} images`);
}
await writeFile(new URL('sources.json', directory), JSON.stringify(manifest, null, 2) + '\n');
