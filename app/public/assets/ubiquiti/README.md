# Ubiquiti illustration references

These original manufacturer PNGs were downloaded from the official European Ubiquiti store on 2026-10-27. `sources.json` records each product page and CDN URL. Copyright remains with Ubiquiti.

Run `node scripts/download-ubiquiti-images.mjs` from `app/` to refresh the references. The script selects the first non-video product gallery image and checks the asset host and content type.

`app/baie/ubiquiti-front.tsx` contains the original SVG front elevations drawn from these references. They preserve the recognizable front layouts: single/dual drive bays, stacked versus single-row Ethernet ports, the legacy switch indicator, blank keystone apertures and the shelf. Finish, tiny labels and LEDs are simplified for display; LED colors are decorative, not live status. The shelf uses a shallow perspective to keep its otherwise edge-on surface recognizable. Rack ears are illustrative. These are not dimensioned installation drawings.

The four NAS reference images also inform the illustrated layouts of their 4, 7, 8 and 16 drive bays, with 1U, 2U and 3U proportions.

The catalogue links to each unmodified official reference image for comparison. Both the catalogue and placed equipment use the same SVG component; existing saved configuration data is unchanged.
