"use server";

import db from "@/lib/db";
import { richiediUtente } from "@/lib/auth";
import { haRicevutoProdotto } from "@/lib/recensioni";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RecensioneState } from "@/lib/form-state";

export async function gestisciRecensione(prodottoId: number, _state: RecensioneState, formData: FormData): Promise<RecensioneState> {
  const utente = await richiediUtente();
  if (!Number.isSafeInteger(prodottoId) || prodottoId < 1) return { message: "Prodotto non valido." };
  const operazione = formData.get("operazione");
  if (operazione !== "salva" && operazione !== "elimina") return { message: "Operazione non valida." };
  if (operazione === "elimina") {
    db.prepare("DELETE FROM Recensione WHERE utente_id = ? AND prodotto_id = ?").run(utente.id, prodottoId);
  } else {
    const voto = formData.get("voto");
    const testo = formData.get("commento");
    if (typeof voto !== "string" || !/^[1-5]$/.test(voto)) return { message: "Scegli un voto da 1 a 5." };
    if (typeof testo !== "string" || testo.trim().length < 3 || testo.trim().length > 1000) return { message: "Scrivi un commento tra 3 e 1000 caratteri." };
    const risultato = db.transaction(() => {
      if (!db.prepare("SELECT id FROM Prodotto WHERE id = ? AND attivo = 1").get(prodottoId)) return "Prodotto non più in vendita.";
      if (!haRicevutoProdotto(utente.id, prodottoId)) return "Puoi recensire il prodotto solo dopo la consegna di un tuo ordine.";
      db.prepare(`INSERT INTO Recensione (utente_id, prodotto_id, voto, commento) VALUES (?, ?, ?, ?)
        ON CONFLICT(utente_id, prodotto_id) DO UPDATE SET voto = excluded.voto, commento = excluded.commento, updated_at = CURRENT_TIMESTAMP`)
        .run(utente.id, prodottoId, Number(voto), testo.trim());
      return null;
    }).immediate();
    if (risultato) return { message: risultato };
  }
  revalidatePath(`/catalogo/${prodottoId}`);
  redirect(`/catalogo/${prodottoId}?recensione=${operazione === "salva" ? "salvata" : "eliminata"}#recensioni`);
}
