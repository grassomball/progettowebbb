"use client";

import Link from "next/link";
import { useActionState } from "react";
import { aggiungiAlCarrello } from "@/app/carrello/actions";
import type { CarrelloState } from "@/lib/form-state";

export default function AggiungiCarrelloForm({ prodottoId, disponibilita }: { prodottoId: number; disponibilita: number }) {
  const [state, action, pending] = useActionState(aggiungiAlCarrello, {} as CarrelloState);
  return (
    <form action={action} className="mt-6 space-y-3">
      <input type="hidden" name="prodotto_id" value={prodottoId} />
      <label htmlFor="quantita" className="block text-sm font-medium">Quantità</label>
      <div className="flex flex-wrap gap-3">
        <input id="quantita" name="quantita" type="number" min={1} max={Math.min(99, disponibilita)}
          step={1} required defaultValue={1} disabled={pending} className="w-20 rounded border border-line bg-white px-3 py-2 text-ink" />
        <button type="submit" disabled={pending || disponibilita < 1}
          className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark disabled:opacity-50">
          {pending ? "Aggiunta…" : "Aggiungi al carrello"}
        </button>
      </div>
      <p role="status" className={state.success ? "text-sm text-green-800" : "text-sm text-red-700"}>{state.message}</p>
      {state.success && <Link href="/carrello" className="inline-block font-medium text-brand underline">Vai al carrello</Link>}
    </form>
  );
}
