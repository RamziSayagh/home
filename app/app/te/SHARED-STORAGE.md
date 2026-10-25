# Shared electrical configuration on Vercel

The editor supports one public, shared configuration, without accounts or passwords. Every visitor can read and modify it. The application server keeps database credentials private; no credentials are shipped to the browser.

## Activation

1. Connect the **Neon** database to this Vercel project and the Production environment.
2. Confirm that it provides `DATABASE_URL` (the integration can also provide `POSTGRES_URL` as a fallback). Keep these server-only variables: do not use a `NEXT_PUBLIC_` prefix.
3. Deploy this application version again so its server functions receive the variables.
4. Open `/te` first in the browser holding your latest configuration. An empty shared database is initialized from that browser's local project. Alternatively, import your latest JSON there. Wait for **À jour · sauvegarde partagée** before switching devices.

If a shared configuration already exists, it takes priority over older browser copies. Import JSON explicitly if you want to replace it. The repository export is not automatically published: a browser may hold a newer configuration.

Official setup instructions: [Vercel Marketplace storage](https://vercel.com/docs/marketplace-storage) and [Neon on Vercel](https://vercel.com/marketplace/neon/neon).

## Behavior

- `GET /api/te/project` reads the shared project; `PUT` validates the existing project schema before writing.
- The `maison1973_shared_electrical_project` table holds one row (`id = 1`) with the project JSON, revision and update time. Use separate preview/development databases from production to avoid test edits changing the real project.
- Writes are debounced by 500 ms. Visible pages check for updates every five seconds and on focus, visibility changes and network reconnection. Hidden pages stop polling. This is periodic synchronization, not live collaborative editing.
- A PostgreSQL UPSERT updates the project only when its revision matches the browser's revision. A stale writer loads the accepted server version and retains its conflicting local project for **Exporter ma copie précédente**. This backup is also retained across browser reloads when local storage works.
- Local changes are saved immediately to browser storage. Failed network writes retry automatically. Pending changes can resume after reopening when the shared baseline is unchanged; concurrent remote changes retain a local exportable copy. JSON import/export remains available.
- Without configured storage, the API returns `503 not_configured` and the editor explicitly reports local-only saving. It never claims to be synchronized when a request fails.
- The status **À jour · sauvegarde partagée** means the last synchronization succeeded. Closing the page before an in-flight save completes can leave a pending local change; reopening that browser resumes synchronization.

The purchasing page is unaffected. No local server file or Vercel function memory is used as durable shared storage.
