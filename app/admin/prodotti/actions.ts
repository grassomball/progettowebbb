"use server";

import sharp from "sharp";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { richiediAdmin } from "@/lib/auth";
import db from "@/lib/db";
import { categorieProdotti } from "@/lib/prodotti";
import type { ProdottoFormState } from "@/lib/form-state";

export async function salvaProdotto(
  id: number | null,
  _previousState: ProdottoFormState,
  formData: FormData,
): Promise<ProdottoFormState> {
  await richiediAdmin();
  if (id !== null && (!Number.isSafeInteger(id) || id <= 0)) {
    return { message: "Prodotto non valido." };
  }
  const testo = (campo: string) => {
    const valore = formData.get(campo);
    return typeof valore === "string" ? valore.trim() : "";
  };
  const nome = testo("nome");
  const descrizione = testo("descrizione");
  const categoria = testo("categoria");
  const prezzo = testo("prezzo");
  const disponibilita = testo("disponibilita");
  const attivo = formData.get("attivo") === "on" ? 1 : 0;
  const errors: NonNullable<ProdottoFormState["errors"]> = {};
  if (!nome || nome.length > 100) errors.nome = "Inserisci un nome da 1 a 100 caratteri.";
  if (descrizione.length > 2000) errors.descrizione = "Usa al massimo 2000 caratteri.";
  if (!categorieProdotti.some((voce) => voce.valore === categoria)) errors.categoria = "Scegli una categoria valida.";

  // Conversione esatta da euro a centesimi, senza arrotondamenti in virgola mobile.
  const parti = prezzo.replace(",", ".").split(".");
  const centesimi = Number(parti[0]) * 100 + Number((parti[1] ?? "").padEnd(2, "0"));
  if (!/^\d{1,4}([.,]\d{1,2})?$/.test(prezzo) || centesimi < 1 || centesimi > 999999) {
    errors.prezzo = "Inserisci un prezzo tra 0,01 e 9999,99 euro, con al massimo due decimali.";
  }
  const scorte = Number(disponibilita);
  if (!/^\d{1,6}$/.test(disponibilita) || scorte > 100000) {
    errors.disponibilita = "Inserisci un numero intero tra 0 e 100000.";
  }
  const file = formData.get("foto");
  if (typeof file === "string") errors.foto = "Seleziona un file immagine.";
  if (file instanceof File && file.size > 2 * 1024 * 1024) {
    errors.foto = "La foto deve pesare al massimo 2 MB.";
  }
  if (Object.keys(errors).length) return { errors };

  let foto: Buffer | null = null;
  if (file instanceof File && file.size > 0) {
    try {
      const bytes = Buffer.from(await file.arrayBuffer());
      const immagine = sharp(bytes, { limitInputPixels: 16000000, failOn: "warning" });
      const info = await immagine.metadata();
      if (!info.format || !["jpeg", "png", "webp"].includes(info.format) || (info.pages ?? 1) > 1) {
        return { errors: { foto: "Carica una foto JPG, PNG o WebP non animata." } };
      }
      // Decodifica e ricodifica: non ci fidiamo del nome o del MIME dichiarato.
      foto = await immagine.rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 85 }).toBuffer();
    } catch {
      return { errors: { foto: "Immagine non valida: usa JPG, PNG o WebP fino a 16 megapixel." } };
    }
  }

  const prodottoId = db.transaction(() => {
    if (id === null) {
      return Number(db.prepare(`INSERT INTO Prodotto
        (nome, descrizione, categoria, prezzo_centesimi, disponibilita, attivo, foto, foto_versione)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(nome, descrizione, categoria, centesimi, scorte, attivo, foto, foto ? 1 : 0).lastInsertRowid);
    }
    const risultato = db.prepare(`UPDATE Prodotto SET nome = ?, descrizione = ?, categoria = ?,
      prezzo_centesimi = ?, disponibilita = ?, attivo = ? WHERE id = ?`)
      .run(nome, descrizione, categoria, centesimi, scorte, attivo, id);
    if (risultato.changes === 0) return null;
    if (foto) {
      db.prepare("UPDATE Prodotto SET foto = ?, foto_versione = foto_versione + 1 WHERE id = ?").run(foto, id);
    }
    return id;
  }).immediate();

  if (prodottoId === null) return { message: "Il prodotto non esiste più. Torna all’elenco." };
  revalidatePath("/admin/prodotti");
  revalidatePath(`/admin/prodotti/${prodottoId}`);
  revalidatePath("/catalogo");
  revalidatePath(`/catalogo/${prodottoId}`);
  revalidatePath("/area-privata/prodotti");
  revalidatePath("/carrello");
  redirect("/admin/prodotti?salvato=1");
}
