import { readFile, writeFile } from "node:fs/promises";

const checkedAt = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedAt ?? "")) throw new Error("Usage: node scripts/update-elecdirect-prices.mjs YYYY-MM-DD");
const directory = new URL("../app/te/data/", import.meta.url);
const { references, sources } = JSON.parse(await readFile(new URL("elecdirect-sources.json", directory), "utf8"));
const entries = [];
for (let start = 0; start < references.length; start += 4) {
  entries.push(...await Promise.all(references.slice(start, start + 4).map(async reference => {
    const source = sources[reference];
    if (!source) return [reference, { unitPriceCents: null, source: null, status: "not-found" }];
    if (new URL(source).origin !== "https://www.elecdirect.fr") throw new Error(`Unexpected supplier for ${reference}`);
    const response = await fetch(source, { signal: AbortSignal.timeout(25_000) });
    if (!response.ok) throw new Error(`${reference}: HTTP ${response.status}`);
    const html = await response.text();
    const attribute = html.match(/data-product="([^"]+)"/)?.[1];
    if (!attribute) throw new Error(`${reference}: product data missing`);
    const product = JSON.parse(attribute.replaceAll("&quot;", '"').replaceAll("&#039;", "'").replaceAll("&amp;", "&"));
    const structured = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      .flatMap(match => { try { return [JSON.parse(match[1])]; } catch { return []; } })
      .find(value => value["@type"] === "Product" && value.sku === `SCH${reference}`);
    const gross = Number(product.price_amount);
    const net = Number(product.price_tax_exc);
    if (product.reference !== `SCH${reference}` || product.pack || !structured || structured.offers?.priceCurrency !== "EUR") throw new Error(`${reference}: product identity/currency mismatch`);
    if (!Number.isFinite(gross) || gross <= 0 || !Number.isFinite(net) || Number(product.rate) !== 20 || Math.abs(gross - net * 1.2) > 0.02 || Math.abs(gross - Number(structured.offers.price)) > 0.01) throw new Error(`${reference}: gross-price verification failed`);
    console.log(`${reference}: ${gross.toFixed(2)} EUR TTC`);
    return [reference, { unitPriceCents: Math.round(gross * 100), source, status: "verified" }];
  })));
}
// Publish a snapshot only after all configured product pages pass verification.
await writeFile(new URL("elecdirect-prices.json", directory), JSON.stringify({ supplier: "Elecdirect", currency: "EUR", tax: "TTC", checkedAt, items: Object.fromEntries(entries) }, null, 2) + "\n");
console.log(`${entries.filter(([, item]) => item.status === "verified").length}/${entries.length} references priced.`);
