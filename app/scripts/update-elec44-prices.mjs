import { readFile, writeFile } from "node:fs/promises";

const checkedAt = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedAt ?? "")) throw new Error("Usage: node scripts/update-elec44-prices.mjs YYYY-MM-DD");
const directory = new URL("../app/te/data/", import.meta.url);
const { references, sources } = JSON.parse(await readFile(new URL("elec44-sources.json", directory), "utf8"));
const entries = [];
for (let start = 0; start < references.length; start += 4) {
  const batch = await Promise.all(references.slice(start, start + 4).map(async reference => {
    const source = sources[reference];
    if (!source) return [reference, { unitPriceCents: null, source: null, status: "not-found" }];
    if (new URL(source).origin !== "https://elec44.fr") throw new Error(`Unexpected supplier for ${reference}`);
    const response = await fetch(source, { signal: AbortSignal.timeout(25_000) });
    if (!response.ok) throw new Error(`${reference}: HTTP ${response.status}`);
    const html = await response.text();
    const attribute = html.match(/data-product="([^"]+)"/)?.[1];
    if (!attribute) throw new Error(`${reference}: product data missing`);
    const product = JSON.parse(attribute.replaceAll("&quot;", '"').replaceAll("&#039;", "'").replaceAll("&amp;", "&"));
    const structured = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
      // Retailer review text can contain malformed escapes; discard that trailing block before parsing prices.
      .map(match => JSON.parse(match[1].replace(/,\s*"review"\s*:[\s\S]*$/, "}"))).find(value => value["@type"] === "Product" && value.sku === `SCH${reference}`);
    const gross = Number(product.price_amount);
    const net = Number(product.price_tax_exc);
    const tax = Number(product.rate);
    if (product.reference !== `SCH${reference}` || product.pack || !structured || structured.offers?.priceCurrency !== "EUR") throw new Error(`${reference}: product identity/currency mismatch`);
    // Search excerpts can display net amounts with a TTC label: check gross against net + VAT and the Offer.
    if (!Number.isFinite(gross) || gross <= 0 || !Number.isFinite(net) || tax !== 20 || Math.abs(gross - net * (1 + tax / 100)) > 0.02 || Math.abs(gross - Number(structured.offers.price)) > 0.01) throw new Error(`${reference}: gross-price verification failed`);
    const item = { unitPriceCents: Math.round(gross * 100), source, status: "verified" };
    console.log(`${reference}: ${gross.toFixed(2)} EUR TTC`);
    return [reference, item];
  }));
  entries.push(...batch);
}
// Write only after every configured source passed verification. Missing references stay explicitly unpriced.
await writeFile(new URL("elec44-prices.json", directory), JSON.stringify({ supplier: "Elec44", currency: "EUR", tax: "TTC", checkedAt, items: Object.fromEntries(entries) }, null, 2) + "\n");
console.log(`${entries.filter(([, item]) => item.status === "verified").length}/${entries.length} references priced.`);
