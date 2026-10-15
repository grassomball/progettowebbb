"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { richiediUtente } from "@/lib/auth";
import { creaOrdine } from "@/lib/ordini";
import type { CheckoutState } from "@/lib/form-state";

export async function confermaOrdine(_state: CheckoutState, formData: FormData): Promise<CheckoutState> {
  await richiediUtente();
  const testo = (nome: string) => { const valore = formData.get(nome); return typeof valore === "string" ? valore.trim() : ""; };
  const nominativo = testo("nominativo");
  const telefono = testo("telefono");
  const indirizzo = testo("indirizzo");
  const numeroCivico = testo("numero_civico").toUpperCase();
  const cap = testo("cap");
  const citta = testo("citta");
  const provincia = testo("provincia").toUpperCase();
  const token = testo("token");
  const impronta = testo("impronta");
  if (nominativo.length < 2 || nominativo.length > 100 || [...nominativo].some((char) => char.charCodeAt(0) < 32)) {
    return { message: "Inserisci un nominativo tra 2 e 100 caratteri." };
  }
  if (!/^\+?[0-9 ()-]{6,25}$/.test(telefono) || telefono.replace(/\D/g, "").length < 6) {
    return { message: "Inserisci un numero di telefono valido." };
  }
  if (indirizzo.length < 5 || indirizzo.length > 200 || citta.length < 2 || citta.length > 100 ||
      [...indirizzo + citta].some((char) => char.charCodeAt(0) < 32)) {
    return { message: "Inserisci la via (da 5 a 200 caratteri) e la città (da 2 a 100 caratteri)." };
  }
  if (numeroCivico.length > 20 || !/^(?:\d+[A-Z0-9 /-]*|SNC)$/.test(numeroCivico)) {
    return { message: "Inserisci il numero civico, ad esempio 12 o 12/A. Se assente, indica SNC." };
  }
  if (!/^\d{5}$/.test(cap) || !/^[A-Z]{2}$/.test(provincia)) {
    return { message: "Inserisci un CAP italiano di 5 cifre e la sigla della provincia di 2 lettere." };
  }
  if (!/^[0-9a-f-]{36}$/.test(token) || !/^[0-9a-f]{64}$/.test(impronta)) {
    return { message: "Riapri il riepilogo del carrello e riprova." };
  }
  const risultato = await creaOrdine({ nominativo, telefono, token, impronta, indirizzo, numero_civico: numeroCivico, cap, citta, provincia });
  if ("message" in risultato) return risultato;
  revalidatePath("/carrello");
  revalidatePath("/checkout");
  revalidatePath("/catalogo", "layout");
  revalidatePath("/area-privata", "layout");
  revalidatePath("/admin/prodotti", "layout");
  redirect(`/area-privata/ordini/${risultato.id}`);
}
