import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDettaglioTicket } from "@/lib/assistenza";
import TicketForm from "@/components/TicketForm";
import StatoTicketForm from "@/components/StatoTicketForm";

const data = new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" });

export default async function TicketDettaglio({ id, amministrazione = false }: { id: string; amministrazione?: boolean }) {
  const dati = await getDettaglioTicket(/^[1-9]\d*$/.test(id) ? Number(id) : NaN, amministrazione);
  if (!dati) notFound();
  const { ticket, messaggi } = dati;
  return <main className="mx-auto max-w-3xl px-6 py-12">
    <h1 className="break-words text-3xl font-bold">Ticket #{ticket.id}: {ticket.oggetto}</h1>
    <Link href={`${amministrazione ? "/admin" : "/area-privata"}/assistenza`} className="my-4 inline-block underline">Tutte le richieste</Link>
    <p>Stato: <strong>{ticket.stato === "aperto" ? "Aperto" : "Chiuso"}</strong></p>
    {amministrazione && <><p className="mt-2">Cliente: {ticket.username}</p><StatoTicketForm id={ticket.id} stato={ticket.stato} /></>}
    <h2 id="messaggi" className="mt-8 text-xl font-semibold">Conversazione</h2>
    <ol className="mt-4 space-y-4">{messaggi.map((m) => <li key={m.id} className={`rounded-xl border p-5 ${m.da_admin ? "border-amber-500" : "border-line"}`}>
      <p className="font-semibold">{m.da_admin ? "Assistenza" : m.username}</p>
      <p className="mt-1 text-sm">{data.format(new Date(m.created_at.replace(" ", "T") + "Z"))}</p>
      <p className="mt-3 whitespace-pre-wrap break-words">{m.testo}</p>
    </li>)}</ol>
    {ticket.stato === "aperto" ? <TicketForm key={messaggi.length} ticketId={ticket.id} token={randomUUID()} /> : <p className="mt-8">Questa richiesta è chiusa.{!amministrazione && " Se hai ancora bisogno di aiuto, puoi aprire una nuova richiesta."}</p>}
  </main>;
}
