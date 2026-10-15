import "server-only";
import { createHash } from "node:crypto";
import db from "@/lib/db";
import { richiediUtente } from "@/lib/auth";

type Riga = { prodotto_id: number; nome: string; prezzo_centesimi: number; quantita: number; disponibilita: number; attivo: number };
type IndirizzoSpedizione = { indirizzo: string; numero_civico: string; cap: string; citta: string; provincia: string };
export type Ordine = { id: number; nominativo: string; telefono: string; totale_centesimi: number; stato: string; created_at: string; indirizzo: string | null; numero_civico: string | null; cap: string | null; citta: string | null; provincia: string | null };
export type RigaOrdine = { id: number; prodotto_id: number | null; nome: string; prezzo_centesimi: number; quantita: number };

function leggiCarrello(utenteId: number): Riga[] {
  return db.prepare(`SELECT p.id AS prodotto_id, p.nome, p.prezzo_centesimi, p.disponibilita, p.attivo, c.quantita
    FROM Carrello c JOIN Prodotto p ON p.id = c.prodotto_id WHERE c.utente_id = ? ORDER BY p.id`).all(utenteId) as Riga[];
}

function impronta(righe: Riga[]) {
  // Rileva variazioni rispetto al riepilogo visto dal cliente, anche a totale invariato.
  return createHash("sha256").update(JSON.stringify(righe.map(({ prodotto_id, nome, prezzo_centesimi, quantita }) =>
    [prodotto_id, nome, prezzo_centesimi, quantita]))).digest("hex");
}

export async function getRiepilogoCheckout() {
  const utente = await richiediUtente();
  const righe = leggiCarrello(utente.id);
  return { righe, impronta: impronta(righe), totaleCentesimi: righe.reduce((sum, r) => sum + r.prezzo_centesimi * r.quantita, 0) };
}

export async function creaOrdine(dati: { token: string; impronta: string; nominativo: string; telefono: string } & IndirizzoSpedizione): Promise<{ id: number } | { message: string }> {
  const utente = await richiediUtente();
  return db.transaction(() => {
    // Ripetere la stessa conferma restituisce lo stesso ordine, senza scalare altre scorte.
    const precedente = db.prepare("SELECT id FROM Ordine WHERE utente_id = ? AND token = ?").get(utente.id, dati.token) as { id: number } | undefined;
    if (precedente) return precedente;
    const righe = leggiCarrello(utente.id);
    if (!righe.length) return { message: "Il carrello è vuoto." };
    if (impronta(righe) !== dati.impronta) return { message: "Il carrello o i prezzi sono cambiati. Riapri il riepilogo prima di confermare." };
    if (righe.some((r) => !r.attivo || r.quantita > r.disponibilita)) {
      return { message: "Alcuni prodotti non sono più disponibili nella quantità richiesta. Aggiorna il carrello." };
    }
    const totale = righe.reduce((sum, r) => sum + r.prezzo_centesimi * r.quantita, 0);
    if (!Number.isSafeInteger(totale)) return { message: "Il totale supera il limite consentito." };
    const id = Number(db.prepare(`INSERT INTO Ordine (utente_id, token, nominativo, telefono, totale_centesimi, indirizzo, numero_civico, cap, citta, provincia)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(utente.id, dati.token, dati.nominativo, dati.telefono, totale,
        dati.indirizzo, dati.numero_civico, dati.cap, dati.citta, dati.provincia).lastInsertRowid);
    for (const riga of righe) {
      const modifica = db.prepare("UPDATE Prodotto SET disponibilita = disponibilita - ? WHERE id = ? AND attivo = 1 AND disponibilita >= ?")
        .run(riga.quantita, riga.prodotto_id, riga.quantita);
      if (modifica.changes !== 1) throw new Error("Scorte modificate durante la conferma");
      db.prepare(`INSERT INTO RigaOrdine (ordine_id, prodotto_id, nome, prezzo_centesimi, quantita) VALUES (?, ?, ?, ?, ?)`)
        .run(id, riga.prodotto_id, riga.nome, riga.prezzo_centesimi, riga.quantita);
    }
    db.prepare("DELETE FROM Carrello WHERE utente_id = ?").run(utente.id);
    return { id };
  }).immediate();
}

export async function getOrdini() {
  const utente = await richiediUtente();
  return db.prepare("SELECT id, nominativo, telefono, totale_centesimi, stato, created_at, indirizzo, numero_civico, cap, citta, provincia FROM Ordine WHERE utente_id = ? ORDER BY id DESC").all(utente.id) as Ordine[];
}

export async function getOrdine(id: number) {
  const utente = await richiediUtente();
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const ordine = db.prepare("SELECT id, nominativo, telefono, totale_centesimi, stato, created_at, indirizzo, numero_civico, cap, citta, provincia FROM Ordine WHERE id = ? AND utente_id = ?").get(id, utente.id) as Ordine | undefined;
  if (!ordine) return null;
  const righe = db.prepare(`SELECT r.id, p.id AS prodotto_id, r.nome, r.prezzo_centesimi, r.quantita FROM RigaOrdine r
    LEFT JOIN Prodotto p ON p.id = r.prodotto_id AND p.attivo = 1 WHERE r.ordine_id = ? ORDER BY r.id`).all(id) as RigaOrdine[];
  return { ordine, righe };
}
