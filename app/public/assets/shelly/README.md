# Shelly product images

Official transparent PNG product renders downloaded on 2026-10-26 from Shelly Europe's Shopify CDN, at 400 pixels wide. These manufacturer assets identify the corresponding products; they are not original project artwork. Copyright remains with the respective owner.

Each filename matches the product page slug at `https://www.shelly.com/products/{slug}`. The download script `app/scripts/download-shelly-images.mjs` retrieves the first official product image from that page's public `.js` endpoint and validates the CDN host and PNG response. It covers the 13 retained catalogue products, excluding Pro 3EM and Pro 3EM-400.

The UI uses these local assets in the catalogue, placed equipment, inspector and drag preview. Images are decorative alongside accessible product names. CSS preserves aspect ratio and the existing DIN grid occupancy.
