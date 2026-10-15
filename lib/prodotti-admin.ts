import "server-only";
import db from "@/lib/db";
import { richiediAdmin } from "@/lib/auth";
import type { Prodotto } from "@/lib/prodotti";

const colonne = `id, nome, categoria, descrizione, prezzo_centesimi,
  CASE WHEN foto IS NOT NULL
    THEN '/api/prodotti/' || id || '/immagine?v=' || foto_versione
    ELSE immagine END AS immagine,
  disponibilita, attivo, created_at`;

export async function getProdottiAdmin(): Promise<Prodotto[]> {
  await richiediAdmin();
  return db.prepare(`SELECT ${colonne} FROM Prodotto ORDER BY nome COLLATE NOCASE, id`).all() as Prodotto[];
}

export async function getProdottoAdmin(id: number): Promise<Prodotto | null> {
  await richiediAdmin();
  if (!Number.isSafeInteger(id) || id <= 0) return null;
  return (db.prepare(`SELECT ${colonne} FROM Prodotto WHERE id = ?`).get(id) as Prodotto | undefined) ?? null;
}
