import "server-only";
import db from "@/lib/db";
import { getUtenteAutenticato } from "@/lib/auth";

export type Recensione = { utente_id: number; username: string; voto: number; commento: string; updated_at: string };

export function haRicevutoProdotto(utenteId: number, prodottoId: number): boolean {
  return Boolean(db.prepare(`SELECT 1 FROM Ordine o JOIN RigaOrdine r ON r.ordine_id = o.id
    WHERE o.utente_id = ? AND o.stato = 'completato' AND r.prodotto_id = ? LIMIT 1`).get(utenteId, prodottoId));
}

export async function getRecensioniProdotto(prodottoId: number) {
  const utente = await getUtenteAutenticato();
  const prodotto = Number.isSafeInteger(prodottoId) && prodottoId > 0 &&
    db.prepare("SELECT id FROM Prodotto WHERE id = ? AND attivo = 1").get(prodottoId);
  const recensioni = prodotto ? db.prepare(`SELECT r.utente_id, u.username, r.voto, r.commento, r.updated_at
    FROM Recensione r JOIN Utente u ON u.id = r.utente_id WHERE r.prodotto_id = ?
    ORDER BY r.updated_at DESC, r.utente_id DESC`).all(prodottoId) as Recensione[] : [];
  return {
    recensioni,
    media: recensioni.length ? recensioni.reduce((somma, r) => somma + r.voto, 0) / recensioni.length : null,
    propria: recensioni.find((r) => r.utente_id === utente?.id) ?? null,
    puoRecensire: Boolean(prodotto && utente && haRicevutoProdotto(utente.id, prodottoId)),
  };
}
