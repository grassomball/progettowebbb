import Link from "next/link";
import type { Ticket } from "@/lib/assistenza";

const data = new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" });

export default function ElencoTicket({ ticket, amministrazione = false }: { ticket: Ticket[]; amministrazione?: boolean }) {
  if (!ticket.length) return <p className="mt-8">Nessuna richiesta da mostrare.</p>;
  return <ul className="mt-8 space-y-4">{ticket.map((t) => <li key={t.id} className="rounded-xl border border-line p-5">
    <Link href={`${amministrazione ? "/admin" : "/area-privata"}/assistenza/${t.id}`} className="break-words text-xl font-semibold underline">#{t.id} — {t.oggetto}</Link>
    <p className="mt-2">{t.stato === "aperto" ? "Aperto" : "Chiuso"}{amministrazione ? ` · ${t.username}` : ""}</p>
    <p className="mt-1 text-sm">Ultimo aggiornamento: {data.format(new Date(t.updated_at.replace(" ", "T") + "Z"))}</p>
  </li>)}</ul>;
}
