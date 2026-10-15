"use client";

import { useActionState } from "react";
import { aggiornaStatoOrdine } from "@/app/admin/ordini/actions";
import { prossimoStatoOrdine, etichettaStatoOrdine } from "@/lib/stati-ordine";
import type { StatoOrdineFormState } from "@/lib/form-state";

export default function StatoOrdineForm({ id, stato, spedizione }: { id: number; stato: string; spedizione: boolean }) {
  const [state, action, pending] = useActionState(aggiornaStatoOrdine.bind(null, id), {} as StatoOrdineFormState);
  const prossimo = prossimoStatoOrdine(stato);
  return <div className="mt-6">
    {prossimo ? <form action={action}>
      <input type="hidden" name="stato_attuale" value={stato} />
      <input type="hidden" name="stato_nuovo" value={prossimo} />
      <button disabled={pending} className="rounded-lg bg-brand px-5 py-3 font-medium text-white disabled:opacity-50">
        {pending ? "Aggiornamento…" : `Segna come: ${etichettaStatoOrdine(prossimo, spedizione)}`}
      </button>
    </form> : <p>Gestione dell’ordine completata.</p>}
    <p role="status" className="mt-3">{state.message}</p>
  </div>;
}
