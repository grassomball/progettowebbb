"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { richiediAdmin } from "@/lib/auth";
import db from "@/lib/db";
import { isStatoOrdine, prossimoStatoOrdine } from "@/lib/stati-ordine";
import type { StatoOrdineFormState } from "@/lib/form-state";

export async function aggiornaStatoOrdine(id: number, _state: StatoOrdineFormState, formData: FormData): Promise<StatoOrdineFormState> {
  await richiediAdmin();
  const precedente = formData.get("stato_attuale");
  const nuovo = formData.get("stato_nuovo");
  if (!Number.isSafeInteger(id) || id < 1 || !isStatoOrdine(precedente) ||
      !isStatoOrdine(nuovo) || prossimoStatoOrdine(precedente) !== nuovo) {
    return { message: "Passaggio di stato non valido." };
  }
  // Il confronto evita che un modulo vecchio sovrascriva il lavoro di un altro amministratore.
  const risultato = db.prepare("UPDATE Ordine SET stato = ? WHERE id = ? AND stato = ?").run(nuovo, id, precedente);
  if (!risultato.changes) return { message: "Ordine non trovato o già aggiornato. Ricarica la pagina prima di continuare." };
  revalidatePath("/admin/ordini");
  revalidatePath(`/admin/ordini/${id}`);
  revalidatePath("/area-privata/ordini");
  revalidatePath(`/area-privata/ordini/${id}`);
  redirect(`/admin/ordini/${id}?aggiornato=1`);
}
