# Maison 1973

A French-language house renovation website migrated from the repository's original static HTML page to Next.js App Router.

## Development

Use the Node version in the root .nvmrc. Run these commands from this directory:

```sh
npm ci
npm run dev
```

Open http://localhost:3000.

## Validation and production

```sh
npm run lint
npm run build
npm start
```

## Source layout

- app/page.tsx: server-rendered renovation content and gallery photo list.
- app/renovation-interactions.tsx: photo gallery and collapsible room menu.
- app/globals.css: original responsive design.
- app/layout.tsx: French document language and page metadata.
- app/te/: local electrical panel editor; see its README for catalog sources, behavior, and tests.
- public/assets/: original plans and room photographs.

The legacy root index.html and duplicate assets directory were removed after verifying the migrated content and images. Update the Next.js sources for future changes. The root CNAME preserves the domain home.sayagh.fr; domain and hosting configuration have not been migrated.

## Electrical panel editor

Open `/te` or use the home navigation. Compose a Schneider Resi9 XE panel using drag and drop or explicit placement controls, create circuits, assign upstream protection, and export the project or material list. Data is saved only in the current browser. The editor supports planning; it does not certify the assembly or electrical compliance.

After building, install the test browser once with `npx playwright install chromium`, then run `npm test`. The suite starts its own production server on port 3197. Use `npm run test:model` or `npm run test:e2e` to select a suite.
