import { neon } from "@neondatabase/serverless";
import { connection } from "next/server";
import { parseProject } from "../../../te/lib/model";

const headers = { "Cache-Control": "no-store" };
const table = "maison1973_shared_electrical_project";

function database() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? neon(url) : null;
}

async function initialize(sql: NonNullable<ReturnType<typeof database>>) {
  await sql.query(`CREATE TABLE IF NOT EXISTS ${table} (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    revision BIGINT NOT NULL CHECK (revision >= 0),
    project JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

export async function GET() {
  await connection();
  const sql = database();
  if (!sql) return Response.json({ error: "not_configured" }, { status: 503, headers });
  try {
    await initialize(sql);
    const rows = await sql.query(`SELECT revision, project FROM ${table} WHERE id = 1`) as { revision: number; project: unknown }[];
    const saved = rows[0];
    return Response.json(saved ? { revision: Number(saved.revision), project: parseProject(JSON.stringify(saved.project)) } : { revision: 0, project: null }, { headers });
  } catch {
    return Response.json({ error: "storage_unavailable" }, { status: 503, headers });
  }
}

export async function PUT(request: Request) {
  const sql = database();
  if (!sql) return Response.json({ error: "not_configured" }, { status: 503, headers });
  let input: { revision: number; project: unknown };
  try {
    const text = await request.text();
    if (text.length > 1_000_000) return Response.json({ error: "too_large" }, { status: 413, headers });
    input = JSON.parse(text);
    if (!Number.isSafeInteger(input.revision) || input.revision < 0) throw new Error("Invalid revision");
    input.project = parseProject(JSON.stringify(input.project));
  } catch {
    return Response.json({ error: "invalid_project" }, { status: 400, headers });
  }
  try {
    await initialize(sql);
    // A local edit is authoritative: write it atomically even if another client
    // saved after this browser loaded the page.
    const rows = await sql.query(`INSERT INTO ${table} (id, revision, project)
      VALUES (1, 1, $1::jsonb)
      ON CONFLICT (id) DO UPDATE SET revision = ${table}.revision + 1, project = EXCLUDED.project, updated_at = NOW()
      RETURNING revision, updated_at`, [JSON.stringify(input.project)]) as { revision: number; updated_at: string }[];
    const saved = rows[0];
    return Response.json({ revision: Number(saved.revision), updatedAt: saved.updated_at, project: input.project }, { headers });
  } catch {
    return Response.json({ error: "storage_unavailable" }, { status: 503, headers });
  }
}
