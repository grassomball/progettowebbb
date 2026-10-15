"use server";

import { revalidatePath } from "next/cache";
import { richiediUtente } from "@/lib/auth";
import db from "@/lib/db";
import type { CarrelloState } from "@/lib/form-state";

function intero(valore: FormDataEntryValue | null): number | null {
  if (typeof valore !== "string" || !/^[1-9]\d*$/.test(valore)) return null;
  const numero = Number(valore);
  return Number.isSafeInteger(numero) ? numero : null;
}

export async function aggiungiAlCarrello(_state: CarrelloState, formData: FormData): Promise<CarrelloState> {
  const utente = await richiediUtente();
  const id = intero(formData.get("prodotto_id"));
  const quantita = intero(formData.get("quantita"));
  if (!id || !quantita || quantita > 99) return { message: "Scegli una quantità intera tra 1 e 99." };
  const risultato = db.transaction((): CarrelloState => {
    const prodotto = db.prepare("SELECT disponibilita FROM Prodotto WHERE id = ? AND attivo = 1")
      .get(id) as { disponibilita: number } | undefined;
    if (!prodotto) return { message: "Questo prodotto non è più in vendita." };
    const riga = db.prepare("SELECT quantita FROM Carrello WHERE utente_id = ? AND prodotto_id = ?")
      .get(utente.id, id) as { quantita: number } | undefined;
    const totale = (riga?.quantita ?? 0) + quantita;
    if (totale > Math.min(99, prodotto.disponibilita)) {
      return { message: `Quantità non disponibile. Scorte: ${prodotto.disponibilita}; già nel carrello: ${riga?.quantita ?? 0}. Massimo 99 per prodotto.` };
    }
    db.prepare(`INSERT INTO Carrello (utente_id, prodotto_id, quantita) VALUES (?, ?, ?)
      ON CONFLICT(utente_id, prodotto_id) DO UPDATE SET quantita = excluded.quantita`).run(utente.id, id, totale);
    return { success: true, message: "Prodotto aggiunto al carrello." };
  }).immediate();
  if (risultato.success) revalidatePath("/carrello");
  return risultato;
}

export async function modificaRigaCarrello(_state: CarrelloState, formData: FormData): Promise<CarrelloState> {
  const utente = await richiediUtente();
  const id = intero(formData.get("prodotto_id"));
  if (!id) return { message: "Prodotto non valido." };
  const operazione = formData.get("operazione");
  if (operazione === "rimuovi") {
    db.prepare("DELETE FROM Carrello WHERE utente_id = ? AND prodotto_id = ?").run(utente.id, id);
    revalidatePath("/carrello");
    return { success: true, message: "Prodotto rimosso." };
  }
  const quantita = intero(formData.get("quantita"));
  if (operazione !== "aggiorna" || !quantita || quantita > 99) {
    return { message: "Scegli una quantità intera tra 1 e 99." };
  }
  const risultato = db.transaction((): CarrelloState => {
    const prodotto = db.prepare("SELECT disponibilita FROM Prodotto WHERE id = ? AND attivo = 1")
      .get(id) as { disponibilita: number } | undefined;
    if (!prodotto) return { message: "Questo prodotto non è più in vendita: rimuovilo dal carrello." };
    if (quantita > prodotto.disponibilita) return { message: `Disponibili solo ${prodotto.disponibilita} unità.` };
    const aggiornamento = db.prepare("UPDATE Carrello SET quantita = ? WHERE utente_id = ? AND prodotto_id = ?")
      .run(quantita, utente.id, id);
    if (!aggiornamento.changes) return { message: "Il prodotto non è più nel tuo carrello. Ricarica la pagina." };
    return { success: true, message: "Quantità aggiornata." };
  }).immediate();
  if (risultato.success) revalidatePath("/carrello");
  return risultato;
}
