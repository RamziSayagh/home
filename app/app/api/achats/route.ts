import { neon } from "@neondatabase/serverless";
import { connection } from "next/server";

const headers = { "Cache-Control": "no-store" };
const table = "maison1973_shared_purchases";
const categories = new Set(["Matériaux", "Électricité", "Plomberie", "Isolation", "Revêtements", "Peinture", "Outillage", "Autre"]);
const statuses = new Set(["À acheter", "Commandé", "Reçu"]);
const units = new Set(["pièce", "m²", "m³", "m", "kg", "L", "lot", "sac", "boîte"]);

type Item = {
  id: string; name: string; category: string; room: string; supplier: string;
  reference: string; quantity: number; unit: string; price: number; status: string; notes: string;
};

function database() {
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  return url ? neon(url) : null;
}

async function initialize(sql: NonNullable<ReturnType<typeof database>>) {
  await sql.query(`CREATE TABLE IF NOT EXISTS ${table} (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    revision BIGINT NOT NULL CHECK (revision >= 0),
    items JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
}

function validItem(value: unknown): value is Item {
  if (!value || typeof value !== "object") return false;
  const item = value as Item;
  return [item.id, item.name, item.room, item.supplier, item.reference, item.notes].every(value => typeof value === "string") &&
    item.id.length > 0 && item.id.length <= 200 && item.name.trim().length > 0 && item.name.length <= 200 &&
    item.room.length <= 120 && item.supplier.length <= 200 && item.reference.length <= 200 && item.notes.length <= 2000 &&
    categories.has(item.category) && statuses.has(item.status) && units.has(item.unit) &&
    Number.isFinite(item.quantity) && item.quantity > 0 && item.quantity <= 1_000_000 &&
    Number.isFinite(item.price) && item.price >= 0 && item.price <= 10_000_000;
}

function parseItems(value: unknown): Item[] {
  if (!Array.isArray(value) || value.length > 10_000 || !value.every(validItem)) throw new Error("Invalid purchases");
  if (new Set(value.map(item => item.id)).size !== value.length) throw new Error("Duplicate purchase ids");
  return value;
}

export async function GET() {
  await connection();
  const sql = database();
  if (!sql) return Response.json({ error: "not_configured" }, { status: 503, headers });
  try {
    await initialize(sql);
    const rows = await sql.query(`SELECT revision, items FROM ${table} WHERE id = 1`) as { revision: number; items: unknown }[];
    const saved = rows[0];
    return Response.json(saved ? { revision: Number(saved.revision), items: parseItems(saved.items) } : { revision: 0, items: null }, { headers });
  } catch {
    return Response.json({ error: "storage_unavailable" }, { status: 503, headers });
  }
}

export async function PUT(request: Request) {
  const sql = database();
  if (!sql) return Response.json({ error: "not_configured" }, { status: 503, headers });
  let items: Item[];
  try {
    const body = await request.text();
    if (body.length > 2_000_000) return Response.json({ error: "too_large" }, { status: 413, headers });
    items = parseItems(JSON.parse(body).items);
  } catch {
    return Response.json({ error: "invalid_purchases" }, { status: 400, headers });
  }
  try {
    await initialize(sql);
    const rows = await sql.query(`INSERT INTO ${table} (id, revision, items)
      VALUES (1, 1, $1::jsonb)
      ON CONFLICT (id) DO UPDATE SET revision = ${table}.revision + 1, items = EXCLUDED.items, updated_at = NOW()
      RETURNING revision, updated_at`, [JSON.stringify(items)]) as { revision: number; updated_at: string }[];
    return Response.json({ revision: Number(rows[0].revision), items }, { headers });
  } catch {
    return Response.json({ error: "storage_unavailable" }, { status: 503, headers });
  }
}
