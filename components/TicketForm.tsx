"use client";

import { useActionState, useState } from "react";
import { apriTicket, rispondiTicket } from "@/app/area-privata/assistenza/actions";
import type { AssistenzaState } from "@/lib/form-state";

export default function TicketForm({ token, ticketId }: { token: string; ticketId?: number }) {
  const [state, action, pending] = useActionState(ticketId ? rispondiTicket.bind(null, ticketId) : apriTicket, {} as AssistenzaState);
  const [oggetto, setOggetto] = useState("");
  const [messaggio, setMessaggio] = useState("");
  const inputClass = "mt-2 w-full rounded border border-line bg-transparent p-3";
  return <form action={action} className="mt-6">
    <input type="hidden" name="token" value={token} />
    <fieldset disabled={pending} className="space-y-4">
      <legend className="mb-4 text-xl font-semibold">{ticketId ? "Aggiungi una risposta" : "Apri una richiesta"}</legend>
      {!ticketId && <label htmlFor="oggetto" className="block">Oggetto
        <input id="oggetto" name="oggetto" required minLength={3} maxLength={120} value={oggetto} onChange={(e) => setOggetto(e.target.value)} className={inputClass} />
      </label>}
      <label htmlFor="messaggio" className="block">Messaggio
        <textarea id="messaggio" name="messaggio" required minLength={3} maxLength={3000} rows={5} value={messaggio} onChange={(e) => setMessaggio(e.target.value)} className={inputClass} />
      </label>
      <button className="rounded-lg bg-brand px-5 py-3 font-medium text-white disabled:opacity-50">{pending ? "Invio in corso…" : ticketId ? "Invia risposta" : "Invia richiesta"}</button>
    </fieldset>
    <p role="status" className="mt-3">{state.message}</p>
  </form>;
}
