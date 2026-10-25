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
    // A single UPSERT writes only when the stored revision is the one the browser read.
    const rows = await sql.query(`INSERT INTO ${table} (id, revision, project)
      SELECT 1, $1, $2::jsonb WHERE $3 = 0
      ON CONFLICT (id) DO UPDATE SET revision = ${table}.revision + 1, project = EXCLUDED.project, updated_at = NOW()
      WHERE ${table}.revision = $3
      RETURNING revision, updated_at`, [input.revision + 1, JSON.stringify(input.project), input.revision]) as { revision: number; updated_at: string }[];
    const saved = rows[0];
    return saved
      ? Response.json({ revision: Number(saved.revision), updatedAt: saved.updated_at, project: input.project }, { headers })
      : Response.json({ error: "conflict" }, { status: 409, headers });
  } catch {
    return Response.json({ error: "storage_unavailable" }, { status: 503, headers });
  }
}
