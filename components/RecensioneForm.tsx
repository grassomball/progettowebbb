"use client";

import { useActionState, useState } from "react";
import { gestisciRecensione } from "@/app/catalogo/recensioni-actions";
import type { RecensioneState } from "@/lib/form-state";

export default function RecensioneForm({ prodottoId, recensione }: { prodottoId: number; recensione: { voto: number; commento: string } | null }) {
  const [state, action, pending] = useActionState(gestisciRecensione.bind(null, prodottoId), {} as RecensioneState);
  const [voto, setVoto] = useState(String(recensione?.voto ?? 5));
  const [commento, setCommento] = useState(recensione?.commento ?? "");
  return <form action={action} className="my-6 rounded-xl border border-line p-5">
    <fieldset disabled={pending} className="space-y-4">
      <legend className="mb-3 text-xl font-semibold">{recensione ? "Modifica la tua recensione" : "Scrivi una recensione"}</legend>
      <p className="text-sm">Il voto, il commento e il tuo username saranno visibili nella scheda del prodotto.</p>
      <label className="block" htmlFor="voto">Voto
        <select id="voto" name="voto" value={voto} onChange={(e) => setVoto(e.target.value)} className="ml-3 rounded border bg-white px-3 py-2 text-ink">
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} su 5</option>)}
        </select>
      </label>
      <label className="block" htmlFor="commento">Commento
        <textarea id="commento" name="commento" value={commento} onChange={(e) => setCommento(e.target.value)} required minLength={3} maxLength={1000} rows={4} className="mt-2 w-full rounded border border-line bg-transparent p-3" />
      </label>
      <div className="flex flex-wrap gap-3">
        <button name="operazione" value="salva" className="rounded-lg bg-brand px-5 py-3 text-white disabled:opacity-50">{pending ? "Attendi…" : recensione ? "Salva modifiche" : "Pubblica recensione"}</button>
        {recensione && <button name="operazione" value="elimina" formNoValidate className="rounded-lg border px-5 py-3 disabled:opacity-50">Elimina la mia recensione</button>}
      </div>
    </fieldset>
    <p role="status" className="mt-3">{state.message}</p>
  </form>;
}
