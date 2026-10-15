import "server-only";
import db from "@/lib/db";
import { richiediAdmin } from "@/lib/auth";
import type { Ordine, RigaOrdine } from "@/lib/ordini";
import { isStatoOrdine } from "@/lib/stati-ordine";

export async function getOrdiniAdmin(stato?: string) {
  await richiediAdmin();
  const filtro = isStatoOrdine(stato) ? stato : null;
  return db.prepare(`SELECT id, nominativo, telefono, totale_centesimi, stato, created_at, indirizzo, numero_civico, cap, citta, provincia
    FROM Ordine ${filtro ? "WHERE stato = ?" : ""} ORDER BY id DESC`).all(...(filtro ? [filtro] : [])) as Ordine[];
}

export async function getOrdineAdmin(id: number) {
  await richiediAdmin();
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const ordine = db.prepare(`SELECT o.id, o.nominativo, o.telefono, o.totale_centesimi, o.stato, o.created_at,
    o.indirizzo, o.numero_civico, o.cap, o.citta, o.provincia, u.username FROM Ordine o JOIN Utente u ON u.id = o.utente_id
    WHERE o.id = ?`).get(id) as (Ordine & { username: string }) | undefined;
  if (!ordine) return null;
  const righe = db.prepare("SELECT id, prodotto_id, nome, prezzo_centesimi, quantita FROM RigaOrdine WHERE ordine_id = ? ORDER BY id").all(id) as RigaOrdine[];
  return { ordine, righe };
}
