"use client";

import { useActionState } from "react";
import { cambiaStatoTicket } from "@/app/area-privata/assistenza/actions";
import type { AssistenzaState } from "@/lib/form-state";

export default function StatoTicketForm({ id, stato }: { id: number; stato: string }) {
  const [state, action, pending] = useActionState(cambiaStatoTicket.bind(null, id), {} as AssistenzaState);
  return <form action={action} className="mt-5">
    <input type="hidden" name="stato" value={stato === "aperto" ? "chiuso" : "aperto"} />
    <button disabled={pending} className="rounded border px-4 py-2 disabled:opacity-50">{pending ? "Attendi…" : stato === "aperto" ? "Chiudi ticket" : "Riapri ticket"}</button>
    <p role="status" className="mt-2">{state.message}</p>
  </form>;
}
