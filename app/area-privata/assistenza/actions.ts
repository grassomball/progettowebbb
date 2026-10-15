"use server";

import db from "@/lib/db";
import { richiediAdmin, richiediUtente } from "@/lib/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AssistenzaState } from "@/lib/form-state";

function testo(form: FormData, campo: string) {
  const valore = form.get(campo);
  return typeof valore === "string" ? valore.trim() : "";
}
function tokenValido(token: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(token); }
function aggiornaPagine(id: number) {
  revalidatePath("/area-privata/assistenza");
  revalidatePath(`/area-privata/assistenza/${id}`);
  revalidatePath("/admin/assistenza");
  revalidatePath(`/admin/assistenza/${id}`);
}

export async function apriTicket(_state: AssistenzaState, form: FormData): Promise<AssistenzaState> {
  const utente = await richiediUtente();
  const oggetto = testo(form, "oggetto"), messaggio = testo(form, "messaggio"), token = testo(form, "token");
  if (oggetto.length < 3 || oggetto.length > 120) return { message: "Inserisci un oggetto tra 3 e 120 caratteri." };
  if (messaggio.length < 3 || messaggio.length > 3000) return { message: "Scrivi un messaggio tra 3 e 3000 caratteri." };
  if (!tokenValido(token)) return { message: "Ricarica la pagina e riprova." };
  const id = db.transaction(() => {
    const esistente = db.prepare("SELECT id FROM Ticket WHERE utente_id = ? AND token = ?").get(utente.id, token) as { id: number } | undefined;
    if (esistente) return esistente.id;
    const id = Number(db.prepare("INSERT INTO Ticket (utente_id, token, oggetto) VALUES (?, ?, ?)").run(utente.id, token, oggetto).lastInsertRowid);
    db.prepare("INSERT INTO MessaggioTicket (ticket_id, autore_id, da_admin, token, testo) VALUES (?, ?, 0, ?, ?)").run(id, utente.id, token, messaggio);
    return id;
  }).immediate();
  aggiornaPagine(id);
  redirect(`/area-privata/assistenza/${id}`);
}

export async function rispondiTicket(id: number, _state: AssistenzaState, form: FormData): Promise<AssistenzaState> {
  const utente = await richiediUtente();
  const messaggio = testo(form, "messaggio"), token = testo(form, "token");
  if (!Number.isSafeInteger(id) || id < 1) return { message: "Ticket non disponibile." };
  if (messaggio.length < 3 || messaggio.length > 3000) return { message: "Scrivi un messaggio tra 3 e 3000 caratteri." };
  if (!tokenValido(token)) return { message: "Ricarica la pagina e riprova." };
  const errore = db.transaction(() => {
    const ticket = db.prepare("SELECT utente_id, stato FROM Ticket WHERE id = ?").get(id) as { utente_id: number; stato: string } | undefined;
    if (!ticket || (ticket.utente_id !== utente.id && utente.ruolo !== "admin")) return "Ticket non disponibile.";
    if (db.prepare("SELECT id FROM MessaggioTicket WHERE ticket_id = ? AND autore_id = ? AND token = ?").get(id, utente.id, token)) return null;
    if (ticket.stato === "chiuso") return "Il ticket è chiuso. Non è possibile aggiungere messaggi.";
    db.prepare("INSERT INTO MessaggioTicket (ticket_id, autore_id, da_admin, token, testo) VALUES (?, ?, ?, ?, ?)")
      .run(id, utente.id, utente.ruolo === "admin" ? 1 : 0, token, messaggio);
    db.prepare("UPDATE Ticket SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);
    return null;
  }).immediate();
  if (errore) return { message: errore };
  aggiornaPagine(id);
  redirect(`${utente.ruolo === "admin" ? "/admin" : "/area-privata"}/assistenza/${id}#messaggi`);
}

export async function cambiaStatoTicket(id: number, _state: AssistenzaState, form: FormData): Promise<AssistenzaState> {
  await richiediAdmin();
  const stato = testo(form, "stato");
  if (!Number.isSafeInteger(id) || id < 1 || (stato !== "aperto" && stato !== "chiuso")) return { message: "Operazione non valida." };
  const risultato = db.prepare("UPDATE Ticket SET stato = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND stato = ?")
    .run(stato, id, stato === "aperto" ? "chiuso" : "aperto");
  if (!risultato.changes) return { message: "Ticket non trovato o già aggiornato. Ricarica la pagina." };
  aggiornaPagine(id);
  redirect(`/admin/assistenza/${id}`);
}
