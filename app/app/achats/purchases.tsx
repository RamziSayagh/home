"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

const STORAGE = "maison1973.purchases.v1";
const endpoint = "/api/achats";
const categories = ["Matériaux", "Électricité", "Plomberie", "Isolation", "Revêtements", "Peinture", "Outillage", "Autre"];
const statuses = ["À acheter", "Commandé", "Reçu"];
const units = ["pièce", "m²", "m³", "m", "kg", "L", "lot", "sac", "boîte"];
type Item = {
  id: string; name: string; category: string; room: string; supplier: string;
  reference: string; quantity: number; unit: string; price: number; status: string; notes: string;
};
const empty = { name: "", category: "Matériaux", room: "", supplier: "", reference: "", quantity: "1", unit: "pièce", price: "", status: "À acheter", notes: "" };
const currency = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const amount = (item: Item) => Math.round(item.quantity * item.price * 100) / 100;

function validItem(value: unknown): value is Item {
  if (!value || typeof value !== "object") return false;
  const i = value as Item;
  return [i.id, i.name, i.room, i.supplier, i.reference, i.notes].every(v => typeof v === "string") &&
    !!i.id && !!i.name.trim() && categories.includes(i.category) && statuses.includes(i.status) && units.includes(i.unit) &&
    Number.isFinite(i.quantity) && i.quantity > 0 && i.quantity <= 1e6 &&
    Number.isFinite(i.price) && i.price >= 0 && i.price <= 1e7;
}

export default function Purchases() {
  const [items, setItems] = useState<Item[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [syncStatus, setSyncStatus] = useState("Chargement de la sauvegarde partagée…");
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const nameInput = useRef<HTMLInputElement>(null);
  const syncTimer = useRef<number | null>(null);
  const itemsRef = useRef<Item[]>([]);

  function saveLocal(next: Item[]) {
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ version: 1, items: next }));
      setStorageError("");
      return true;
    } catch {
      setStorageError("La sauvegarde locale a échoué. Gardez cette page ouverte et exportez vos achats avant de la quitter.");
      return false;
    }
  }

  async function saveShared(next: Item[]) {
    try {
      setSyncStatus("Enregistrement en ligne…");
      const response = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: next }), signal: AbortSignal.timeout(10000), keepalive: JSON.stringify(next).length < 60000 });
      if (!response.ok) throw new Error();
      setSyncStatus("À jour · sauvegarde partagée");
    } catch {
      setSyncStatus("Sauvegarde locale · connexion à la base indisponible");
    }
  }

  useEffect(() => {
    let cancelled = false;
    // Restore after hydration, before enabling edits or writing to storage.
    void (async () => {
      if (cancelled) return;
      let local: Item[] = [];
      try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.version !== 1 || !Array.isArray(data.items) || !data.items.every(validItem) || new Set(data.items.map((i: Item) => i.id)).size !== data.items.length) throw new Error();
        local = data.items;
      }
      } catch {
        setStorageError("Impossible de charger la sauvegarde locale. Vos données existantes sont conservées. Vérifiez l’accès au stockage du navigateur puis rechargez la page.");
        return;
      }
      // Keep the local list usable while the database connection is established.
      // A response received after a user edit must not overwrite that edit.
      itemsRef.current = local;
      setItems(local);
      setReady(true);
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.timeout(10000) });
        if (!response.ok) throw new Error((await response.json()).error);
        const remote = await response.json() as { items: Item[] | null };
        if (cancelled) return;
        if (remote.items && local.length === 0 && JSON.stringify(itemsRef.current) === JSON.stringify(local)) {
          itemsRef.current = remote.items;
          setItems(remote.items);
          saveLocal(remote.items);
          setSyncStatus("À jour · sauvegarde partagée");
        } else {
          if (itemsRef.current.length) void saveShared(itemsRef.current);
          else setSyncStatus("À jour · sauvegarde partagée");
        }
      } catch {
        if (cancelled) return;
        setSyncStatus("Sauvegarde locale · stockage Vercel à configurer");
      }
    })();
    const flush = () => {
      if (syncTimer.current) window.clearTimeout(syncTimer.current);
      if (itemsRef.current.length) void saveShared(itemsRef.current);
    };
    window.addEventListener("pagehide", flush);
    return () => { cancelled = true; window.removeEventListener("pagehide", flush); if (syncTimer.current) window.clearTimeout(syncTimer.current); };
  }, []);

  function update(next: Item[]) {
    itemsRef.current = next;
    setItems(next);
    if (!saveLocal(next)) return;
    if (syncTimer.current) window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => void saveShared(next), 500);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const item: Item = { ...form, id: editing ?? crypto.randomUUID(), name: form.name.trim(), quantity: Number(form.quantity), price: Number(form.price) };
    if (!validItem(item)) return;
    update(editing ? items.map(i => i.id === editing ? item : i) : [...items, item]);
    setNotice(editing ? "Article modifié." : "Article ajouté.");
    setEditing(null);
    setForm(empty);
    nameInput.current?.focus();
  }

  function edit(item: Item) {
    setEditing(item.id);
    setForm({ ...item, quantity: String(item.quantity), price: String(item.price) });
    nameInput.current?.focus();
    nameInput.current?.scrollIntoView({ block: "center" });
  }

  function exportCsv() {
    const cell = (value: string | number) => `"${String(value).replace(/^[=+@\-\t\r]/, " '$&").replaceAll('"', '""')}"`;
    const rows = [["Article", "Catégorie", "Pièce / zone", "Fournisseur", "Référence", "Quantité", "Unité", "Prix unitaire TTC (€)", "Total TTC (€)", "Statut", "Notes"],
      ...items.map(i => [i.name, i.category, i.room, i.supplier, i.reference, String(i.quantity).replace(".", ","), i.unit, i.price.toFixed(2).replace(".", ","), amount(i).toFixed(2).replace(".", ","), i.status, i.notes])];
    const url = URL.createObjectURL(new Blob(["\uFEFF", rows.map(row => row.map(cell).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "maison-1973-achats.csv"; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const search = query.trim().toLocaleLowerCase("fr");
  const visible = items.filter(i => (!category || i.category === category) && (!status || i.status === status) &&
    [i.name, i.room, i.supplier, i.reference, i.notes].some(v => v.toLocaleLowerCase("fr").includes(search)));
  const total = items.reduce((sum, i) => sum + amount(i), 0);
  const remaining = items.filter(i => i.status === "À acheter").reduce((sum, i) => sum + amount(i), 0);
  const received = items.filter(i => i.status === "Reçu").length;

  return <div className="purchases">
    <nav className="purchase-nav" aria-label="Navigation principale"><Link href="/" className="brand">MAISON 1973</Link><div><Link href="/">La maison</Link><Link href="/te">TE</Link><Link href="/achats" aria-current="page">Achats</Link></div></nav>
    <main className="purchase-main">
      <header className="purchase-header"><div><p className="kicker">Le carnet des travaux</p><h1>Les achats.</h1><p>Matériaux, articles et équipement : tout pour préparer le chantier.</p></div><button onClick={exportCsv} disabled={!items.length}>Exporter en CSV ↗</button></header>
      <div className="purchase-stats" aria-label="Bilan des achats"><div><span>Total prévu TTC</span><strong>{currency.format(total)}</strong></div><div><span>Reste à commander TTC</span><strong>{currency.format(remaining)}</strong></div><div><span>Articles reçus</span><strong>{received} <small>/ {items.length}</small></strong></div></div>
      <p className="purchase-storage">{syncStatus} · Une copie locale reste disponible dans ce navigateur. Exportez votre liste pour en conserver une copie. Les totaux incluent tous les articles, même filtrés.</p>
      {storageError && <p role="alert" className="purchase-error">{storageError}</p>}
      <div className="purchase-layout">
        <section className="purchase-form" aria-labelledby="form-title"><p className="kicker">{editing ? "Mise à jour" : "Compléter la liste"}</p><h2 id="form-title">{editing ? "Modifier l’article" : "Ajouter un article"}</h2>
          <form onSubmit={submit}><fieldset disabled={!ready}>
            <label>Article *<input ref={nameInput} required maxLength={200} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex. Plaque de plâtre BA13" /></label>
            <label>Catégorie<select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select></label>
            <label>Pièce / zone<input maxLength={120} value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} placeholder="Ex. Salle de bain · étage" /></label>
            <div className="purchase-pair"><label>Quantité *<input type="number" min="0.001" max="1000000" step="0.001" required value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></label><label>Unité<select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>{units.map(u => <option key={u}>{u}</option>)}</select></label></div>
            <label>Prix unitaire TTC (€)<input type="number" min="0" max="10000000" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0,00" /></label>
            <label>Fournisseur<input maxLength={200} value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder="Magasin ou vendeur" /></label>
            <label>Référence<input maxLength={200} value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} /></label>
            <label>Statut<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label>
            <label>Notes<textarea rows={3} maxLength={2000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Dimensions, couleur, livraison…" /></label>
            <p className="purchase-hint">Prix inconnu ? Laissez le champ vide : il sera compté à 0 €.</p>
            <button className="purchase-primary" type="submit">{editing ? "Enregistrer les modifications" : "+ Ajouter à la liste"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }}>Annuler la modification</button>}
          </fieldset></form>
        </section>
        <section className="purchase-list" aria-labelledby="list-title"><div className="purchase-list-heading"><h2 id="list-title">La liste des achats</h2><span>{visible.length} / {items.length} articles</span></div>
          <div className="purchase-filters"><label>Rechercher<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Article, pièce, fournisseur…" /></label><label>Filtrer par catégorie<select value={category} onChange={e => setCategory(e.target.value)}><option value="">Toutes les catégories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label><label>Filtrer par statut<select value={status} onChange={e => setStatus(e.target.value)}><option value="">Tous les statuts</option>{statuses.map(s => <option key={s}>{s}</option>)}</select></label></div>
          <p role="status" className="purchase-notice">{notice}</p>
          {!ready ? <div className="purchase-empty">{storageError ? "Liste indisponible : la sauvegarde n’a pas pu être chargée." : "Chargement de votre liste…"}</div> : visible.length === 0 ? <div className="purchase-empty"><h3>{items.length ? "Aucun article correspondant" : "Le chantier commence ici."}</h3><p>{items.length ? "Modifiez les filtres pour retrouver vos achats." : "Ajoutez votre premier article, un matériau ou un outil avec le formulaire."}</p></div> :
            <div className="purchase-cards">{visible.map(item => <article key={item.id} className="purchase-card">
              <div className="purchase-card-top"><div><p className="kicker">{item.category}{item.room ? ` · ${item.room}` : ""}</p><h3>{item.name}</h3></div><strong>{currency.format(amount(item))}</strong></div>
              <p className="purchase-detail">{item.quantity.toLocaleString("fr-FR")} {item.unit} × {currency.format(item.price)} TTC</p>
              {(item.supplier || item.reference) && <p className="purchase-detail">{[item.supplier, item.reference].filter(Boolean).join(" · Réf. ")}</p>}
              {item.notes && <p className="purchase-notes">{item.notes}</p>}
              <div className="purchase-card-actions"><label className="purchase-status">Statut de {item.name}<select aria-label={`Statut de ${item.name}`} value={item.status} onChange={e => { update(items.map(i => i.id === item.id ? { ...i, status: e.target.value } : i)); if (editing === item.id) setForm({ ...form, status: e.target.value }); setNotice(`Statut de ${item.name} mis à jour.`); }}>{statuses.map(s => <option key={s}>{s}</option>)}</select></label><button onClick={() => edit(item)} aria-label={`Modifier ${item.name}`}>Modifier</button><button onClick={() => setDeleting(item.id)} aria-label={`Supprimer ${item.name}`}>Supprimer</button></div>
              {deleting === item.id && <div className="purchase-confirm" role="group" aria-label={`Confirmer la suppression de ${item.name}`}><p>Supprimer « {item.name} » de la liste ?</p><button onClick={() => { update(items.filter(i => i.id !== item.id)); setDeleting(null); if (editing === item.id) { setEditing(null); setForm(empty); } setNotice("Article supprimé."); }}>Confirmer la suppression</button><button onClick={() => setDeleting(null)}>Conserver l’article</button></div>}
            </article>)}</div>}
        </section>
      </div>
    </main>
    <footer className="purchase-footer">MAISON 1973 · Le carnet de rénovation</footer>
  </div>;
}
