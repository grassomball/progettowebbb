import { randomUUID } from "node:crypto";
import Link from "next/link";
import { getTicketUtente } from "@/lib/assistenza";
import ElencoTicket from "@/components/ElencoTicket";
import TicketForm from "@/components/TicketForm";

export default async function AssistenzaPage() {
  const ticket = await getTicketUtente();
  return <main className="shop-page mx-auto max-w-3xl px-6 py-12">
    <h1 className="text-3xl font-bold">Assistenza clienti</h1>
    <Link href="/area-privata" className="my-4 inline-block underline">Torna all’area privata</Link>
    <p>Scrivici per domande sui prodotti o sui tuoi ordini. Troverai le risposte in questa sezione.</p>
    <TicketForm token={randomUUID()} />
    <h2 className="mt-10 text-2xl font-semibold">Le mie richieste</h2>
    <ElencoTicket ticket={ticket} />
  </main>;
}
