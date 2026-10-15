import "server-only";
import db from "@/lib/db";
import { richiediAdmin, richiediUtente } from "@/lib/auth";

export type Ticket = { id: number; utente_id: number; username: string; oggetto: string; stato: "aperto" | "chiuso"; created_at: string; updated_at: string };
export type MessaggioTicket = { id: number; username: string; da_admin: number; testo: string; created_at: string };

export async function getTicketUtente() {
  const utente = await richiediUtente();
  return db.prepare(`SELECT t.id, t.utente_id, u.username, t.oggetto, t.stato, t.created_at, t.updated_at
    FROM Ticket t JOIN Utente u ON u.id = t.utente_id WHERE t.utente_id = ? ORDER BY t.updated_at DESC, t.id DESC`).all(utente.id) as Ticket[];
}

export async function getTicketAdmin(stato?: string) {
  await richiediAdmin();
  const filtro = stato === "aperto" || stato === "chiuso" ? stato : null;
  return db.prepare(`SELECT t.id, t.utente_id, u.username, t.oggetto, t.stato, t.created_at, t.updated_at
    FROM Ticket t JOIN Utente u ON u.id = t.utente_id ${filtro ? "WHERE t.stato = ?" : ""}
    ORDER BY t.updated_at DESC, t.id DESC`).all(...(filtro ? [filtro] : [])) as Ticket[];
}

export async function getDettaglioTicket(id: number, amministrazione = false) {
  const utente = await (amministrazione ? richiediAdmin() : richiediUtente());
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const ticket = db.prepare(`SELECT t.id, t.utente_id, u.username, t.oggetto, t.stato, t.created_at, t.updated_at
    FROM Ticket t JOIN Utente u ON u.id = t.utente_id WHERE t.id = ? ${amministrazione ? "" : "AND t.utente_id = ?"}`)
    .get(...(amministrazione ? [id] : [id, utente.id])) as Ticket | undefined;
  if (!ticket) return null;
  const messaggi = db.prepare(`SELECT m.id, u.username, m.da_admin, m.testo, m.created_at
    FROM MessaggioTicket m JOIN Utente u ON u.id = m.autore_id WHERE m.ticket_id = ? ORDER BY m.id`).all(id) as MessaggioTicket[];
  return { ticket, messaggi };
}
