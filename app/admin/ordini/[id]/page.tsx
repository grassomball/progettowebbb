import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrdineAdmin } from "@/lib/ordini-admin";
import { etichettaStatoOrdine } from "@/lib/stati-ordine";
import StatoOrdineForm from "@/components/StatoOrdineForm";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default async function OrdineAdminPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ aggiornato?: string }> }) {
  const { id } = await params;
  const dati = await getOrdineAdmin(/^[1-9]\d*$/.test(id) ? Number(id) : NaN);
  if (!dati) notFound();
  const { ordine, righe } = dati;
  const { aggiornato } = await searchParams;
  return <main className="shop-page mx-auto max-w-3xl px-6 py-12">
    <h1 className="text-3xl font-bold">Ordine #{ordine.id}</h1>
    <Link href="/admin/ordini" className="my-4 inline-block underline">Tutti gli ordini</Link>
    {aggiornato === "1" && <p role="status" className="mb-4">Stato dell’ordine aggiornato.</p>}
    <p>Account: <strong>{ordine.username}</strong></p>
    <p className="mt-2">Stato: <strong>{etichettaStatoOrdine(ordine.stato, Boolean(ordine.indirizzo))}</strong></p>
    <StatoOrdineForm id={ordine.id} stato={ordine.stato} spedizione={Boolean(ordine.indirizzo)} />
    <h2 className="mt-8 text-xl font-semibold">{ordine.indirizzo ? "Destinatario e spedizione" : "Dati per il ritiro"}</h2>
    <p className="mt-3">{ordine.nominativo} · {ordine.telefono}</p>
    {ordine.indirizzo && <p>{ordine.indirizzo}{ordine.numero_civico ? `, ${ordine.numero_civico}` : ""}<br />{ordine.cap} {ordine.citta} ({ordine.provincia})<br />Italia</p>}
    <h2 className="mt-8 text-xl font-semibold">Prodotti ordinati</h2>
    <ul className="divide-y divide-line">{righe.map((r) => <li key={r.id} className="py-4">
      <p className="font-medium">{r.nome}</p><p>{r.quantita} × {euro.format(r.prezzo_centesimi / 100)} = {euro.format(r.prezzo_centesimi * r.quantita / 100)}</p>
    </li>)}</ul>
    <p className="mt-6 text-xl font-bold">Totale: {euro.format(ordine.totale_centesimi / 100)}</p>
  </main>;
}
