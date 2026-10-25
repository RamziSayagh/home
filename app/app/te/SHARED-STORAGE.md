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
- The shared project is read once when a page opens. Writes are debounced by 500 ms; each local edit atomically replaces the shared project. Pages never poll or refresh from the shared project while they remain open.
- A PostgreSQL UPSERT increments the revision on every write. The revision is informational; it does not reject stale writers, so the most recently saved local edit wins.
- Local changes are saved immediately to browser storage. A failed write is reported to the open page and a later local edit can try again. Reopening always loads the then-current shared project; JSON import/export remains available.
- Without configured storage, the API returns `503 not_configured` and the editor explicitly reports local-only saving. It never claims to be synchronized when a request fails.
- The status **À jour · sauvegarde partagée** means the last synchronization succeeded. Closing the page before an in-flight save completes can leave a pending local change; reopening that browser resumes synchronization.

The purchasing page is unaffected. No local server file or Vercel function memory is used as durable shared storage.
