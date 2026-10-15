import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrdine } from "@/lib/ordini";
import { etichettaStatoOrdine } from "@/lib/stati-ordine";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default async function OrdinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const dati = await getOrdine(/^[1-9]\d*$/.test(id) ? Number(id) : NaN);
  if (!dati) notFound();
  const { ordine, righe } = dati;
  return <main className="shop-page mx-auto max-w-2xl px-6 py-12">
    <h1 className="text-3xl font-bold">Ordine #{ordine.id}</h1>
    <p className="mt-4">Ordine dimostrativo registrato. Nessun addebito effettuato.</p>
    <p className="mt-2">Stato: <strong>{etichettaStatoOrdine(ordine.stato, Boolean(ordine.indirizzo))}</strong></p>
    <h2 className="mt-8 text-xl font-semibold">{ordine.indirizzo ? "Indirizzo di spedizione" : "Ritiro in negozio"}</h2>
    <p className="mt-2">{ordine.nominativo} · {ordine.telefono}</p>
    {ordine.indirizzo && <><p className="mt-2">{ordine.indirizzo}{ordine.numero_civico ? `, ${ordine.numero_civico}` : ""}<br />{ordine.cap} {ordine.citta} ({ordine.provincia})<br />Italia</p><p className="mt-2">Spedizione gratuita.</p></>}
    <h2 className="mt-8 text-xl font-semibold">Prodotti ordinati</h2>
    <ul className="mt-3 divide-y divide-line">{righe.map((r) => <li key={r.id} className="py-4">
      <p className="font-medium">{r.nome}</p>
      <p>{r.quantita} × {euro.format(r.prezzo_centesimi / 100)} = {euro.format(r.prezzo_centesimi * r.quantita / 100)}</p>
      {ordine.stato === "completato" && r.prodotto_id && <Link href={`/catalogo/${r.prodotto_id}#recensioni`} className="mt-2 inline-block underline">Scrivi o modifica la tua recensione</Link>}
    </li>)}</ul>
    <p className="mt-6 text-xl font-bold">Totale: {euro.format(ordine.totale_centesimi / 100)}</p>
    <Link href="/area-privata/ordini" className="mt-8 inline-block underline">Tutti i miei ordini</Link>
  </main>;
}
