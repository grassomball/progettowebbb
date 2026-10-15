import Link from "next/link";
import { getOrdini } from "@/lib/ordini";
import { etichettaStatoOrdine } from "@/lib/stati-ordine";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const data = new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" });

export default async function OrdiniPage() {
  const ordini = await getOrdini();
  return <main className="shop-page mx-auto max-w-4xl px-6 py-12">
    <h1 className="text-3xl font-bold">I miei ordini</h1>
    <Link href="/area-privata" className="my-6 inline-block underline">Torna all’area privata</Link>
    <p className="mb-6">I tuoi ordini dimostrativi, senza addebiti reali. La modalità di consegna è indicata nel dettaglio di ogni ordine.</p>
    {ordini.length === 0 ? <p>Non hai ancora effettuato ordini. <Link href="/catalogo" className="underline">Visita il catalogo</Link>.</p> :
      <ul className="space-y-4">{ordini.map((ordine) => <li key={ordine.id} className="rounded-lg border border-line p-5">
        <Link href={`/area-privata/ordini/${ordine.id}`} className="text-xl font-semibold underline">Ordine #{ordine.id}</Link>
        <p className="mt-2">{data.format(new Date(ordine.created_at.replace(" ", "T") + "Z"))} · {etichettaStatoOrdine(ordine.stato, Boolean(ordine.indirizzo))}</p>
        <p className="mt-2 font-bold">{euro.format(ordine.totale_centesimi / 100)}</p>
      </li>)}</ul>}
  </main>;
}
