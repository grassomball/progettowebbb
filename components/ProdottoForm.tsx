"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { salvaProdotto } from "@/app/admin/prodotti/actions";
import type { Prodotto } from "@/lib/prodotti";
import type { ProdottoFormState } from "@/lib/form-state";

export default function ProdottoForm({ prodotto, categorie }: {
  prodotto?: Prodotto;
  categorie: readonly { valore: string; etichetta: string }[];
}) {
  const [state, action, pending] = useActionState(
    salvaProdotto.bind(null, prodotto?.id ?? null), {} as ProdottoFormState,
  );
  const [erroreFotoClient, setErroreFotoClient] = useState("");
  const [valori, setValori] = useState({
    nome: prodotto?.nome ?? "",
    descrizione: prodotto?.descrizione ?? "",
    categoria: prodotto?.categoria ?? "pane",
    prezzo: prodotto ? (prodotto.prezzo_centesimi / 100).toFixed(2) : "",
    disponibilita: String(prodotto?.disponibilita ?? 0),
    attivo: prodotto ? prodotto.attivo === 1 : true,
  });
  const inputClass = "w-full rounded-lg border border-line bg-white px-3 py-2 text-ink";
  const errore = (campo: keyof NonNullable<ProdottoFormState["errors"]>) => (
    <p id={`${campo}-errore`} className="text-sm text-red-700 dark:text-red-400" aria-live="polite">
      {state.errors?.[campo]}
    </p>
  );

  return (
    <form action={action} className="mt-8 space-y-5" onSubmit={(event) => {
      const foto = new FormData(event.currentTarget).get("foto");
      if (foto instanceof File && foto.size > 2 * 1024 * 1024) {
        event.preventDefault();
        setErroreFotoClient("La foto supera 2 MB: seleziona un file più piccolo.");
      }
    }}>
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        <legend className="sr-only">Dati del prodotto</legend>
        <div>
          <label htmlFor="nome" className="mb-1 block font-medium">Nome</label>
          <input id="nome" name="nome" required maxLength={100} value={valori.nome}
            onChange={(e) => setValori({ ...valori, nome: e.target.value })}
            aria-invalid={Boolean(state.errors?.nome)} aria-describedby="nome-errore" className={inputClass} />
          {errore("nome")}
        </div>
        <div>
          <label htmlFor="descrizione" className="mb-1 block font-medium">Descrizione</label>
          <textarea id="descrizione" name="descrizione" rows={4} maxLength={2000} value={valori.descrizione}
            onChange={(e) => setValori({ ...valori, descrizione: e.target.value })}
            aria-invalid={Boolean(state.errors?.descrizione)} aria-describedby="descrizione-errore" className={inputClass} />
          {errore("descrizione")}
        </div>
        <div>
          <label htmlFor="categoria" className="mb-1 block font-medium">Categoria</label>
          <select id="categoria" name="categoria" value={valori.categoria}
            onChange={(e) => setValori({ ...valori, categoria: e.target.value as Prodotto["categoria"] })}
            aria-invalid={Boolean(state.errors?.categoria)} aria-describedby="categoria-errore" className={inputClass}>
            {categorie.map((categoria) => <option key={categoria.valore} value={categoria.valore}>{categoria.etichetta}</option>)}
          </select>
          {errore("categoria")}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="prezzo" className="mb-1 block font-medium">Prezzo (€)</label>
            <input id="prezzo" name="prezzo" inputMode="decimal" required maxLength={7} placeholder="6,00"
              value={valori.prezzo} onChange={(e) => setValori({ ...valori, prezzo: e.target.value })}
              aria-invalid={Boolean(state.errors?.prezzo)} aria-describedby="prezzo-errore" className={inputClass} />
            {errore("prezzo")}
          </div>
          <div>
            <label htmlFor="disponibilita" className="mb-1 block font-medium">Unità disponibili</label>
            <input id="disponibilita" name="disponibilita" type="number" min={0} max={100000} step={1} required
              value={valori.disponibilita} onChange={(e) => setValori({ ...valori, disponibilita: e.target.value })}
              aria-invalid={Boolean(state.errors?.disponibilita)} aria-describedby="disponibilita-errore" className={inputClass} />
            {errore("disponibilita")}
          </div>
        </div>
        <div>
          <label htmlFor="foto" className="mb-1 block font-medium">Foto del prodotto</label>
          {prodotto?.immagine && (
            <Image src={prodotto.immagine} alt={`Foto attuale: ${prodotto.nome}`} width={200} height={200}
              unoptimized className="mb-3 h-40 w-40 rounded-lg bg-white object-contain" />
          )}
          <input id="foto" name="foto" type="file" accept="image/jpeg,image/png,image/webp"
            onChange={() => setErroreFotoClient("")}
            aria-invalid={Boolean(state.errors?.foto || erroreFotoClient)} aria-describedby="foto-aiuto foto-errore foto-client-errore" className={inputClass} />
          <p id="foto-client-errore" role="status" className="text-sm text-red-700 dark:text-red-400">{erroreFotoClient}</p>
          <p id="foto-aiuto" className="mt-1 text-sm text-muted dark:text-zinc-300">
            JPG, PNG o WebP; massimo 2 MB e 16 megapixel. Lascia vuoto per mantenere la foto attuale.
          </p>
          {errore("foto")}
        </div>
        <label className="flex items-center gap-3">
          <input type="checkbox" name="attivo" checked={valori.attivo}
            onChange={(e) => setValori({ ...valori, attivo: e.target.checked })} />
          Pubblicato nel catalogo
        </label>
        <p className="text-sm text-muted dark:text-zinc-300">
          Togli la spunta per nascondere il prodotto e impedirne l’aggiunta al carrello.
        </p>
        <button type="submit" className="rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark">
          {pending ? "Salvataggio…" : "Salva prodotto"}
        </button>
      </fieldset>
      <div role="status" className="text-red-700 dark:text-red-400">
        {state.message}
        {state.errors && "Correggi i campi indicati. Se avevi scelto una foto, selezionala di nuovo."}
      </div>
    </form>
  );
}
