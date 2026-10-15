"use client";

import { useActionState, useState } from "react";
import { modificaRigaCarrello } from "@/app/carrello/actions";
import type { CarrelloState } from "@/lib/form-state";

export default function RigaCarrelloForm({ id, quantita, disponibilita, attivo }: {
  id: number; quantita: number; disponibilita: number; attivo: number;
}) {
  const [state, action, pending] = useActionState(modificaRigaCarrello, {} as CarrelloState);
  const [valore, setValore] = useState(String(quantita));
  return (
    <form action={action} className="mt-4 space-y-2">
      <input type="hidden" name="prodotto_id" value={id} />
      <label htmlFor={`quantita-${id}`} className="block text-sm font-medium">Quantità</label>
      <div className="flex flex-wrap gap-3">
        <input id={`quantita-${id}`} name="quantita" type="number" min={1} max={Math.max(1, Math.min(99, disponibilita))}
          step={1} required value={valore} onChange={(e) => setValore(e.target.value)} disabled={pending}
          className="w-20 rounded border border-line bg-white px-3 py-2 text-ink" />
        <button type="submit" name="operazione" value="aggiorna" disabled={pending || !attivo || disponibilita < 1}
          className="rounded-lg bg-brand px-4 py-2 text-white disabled:opacity-50">Aggiorna</button>
        <button type="submit" name="operazione" value="rimuovi" formNoValidate disabled={pending}
          className="rounded-lg border border-red-700 px-4 py-2 text-red-800 disabled:opacity-50">Rimuovi</button>
      </div>
      <p role="status" className={state.success ? "text-sm text-green-800" : "text-sm text-red-700"}>{pending ? "Aggiornamento…" : state.message}</p>
    </form>
  );
}
