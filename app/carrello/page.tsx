import Link from "next/link";
import { getCarrello } from "@/lib/carrello";
import RigaCarrelloForm from "@/components/RigaCarrelloForm";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default async function CarrelloPage() {
  const { righe, totaleCentesimi } = await getCarrello();
  return (
    <main className="shop-page mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Il tuo carrello</h1>
      <Link href="/catalogo" className="mt-4 inline-block underline underline-offset-4">Continua gli acquisti</Link>
      {righe.length === 0 ? <p className="mt-8">Il carrello è vuoto. Scegli un prodotto dal catalogo.</p> : (
        <>
          <p className="my-6 text-sm text-muted dark:text-zinc-300">I prezzi sono quelli attuali del catalogo. Il carrello non riserva i prodotti.</p>
          <ul className="space-y-4">{righe.map((riga) => (
            <li key={riga.prodotto_id} className="rounded-xl border border-line bg-paper p-5 text-ink">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="text-xl font-semibold">{riga.attivo ? <Link href={`/catalogo/${riga.prodotto_id}`} className="underline underline-offset-4">{riga.nome}</Link> : riga.nome}</h2>
                <p className="font-bold">{euro.format(riga.prezzo_centesimi * riga.quantita / 100)}</p>
              </div>
              <p className="mt-2 text-sm">{euro.format(riga.prezzo_centesimi / 100)} per unità</p>
              {riga.problema && <p role="alert" className="mt-3 font-medium text-red-800">{riga.problema}</p>}
              <RigaCarrelloForm key={`${riga.quantita}-${riga.disponibilita}-${riga.attivo}`} id={riga.prodotto_id}
                quantita={riga.quantita} disponibilita={riga.disponibilita} attivo={riga.attivo} />
            </li>
          ))}</ul>
          <p className="mt-8 text-right text-2xl font-bold">Totale prodotti: {euro.format(totaleCentesimi / 100)}</p>
          {righe.every((riga) => !riga.problema) && <div className="mt-6 text-right"><Link href="/checkout" className="inline-block rounded-lg bg-brand px-5 py-3 font-medium text-white">Procedi all’ordine</Link></div>}
          {righe.some((riga) => riga.problema) && <p className="mt-3 text-right text-red-700 dark:text-red-400">Il totale include le righe segnalate: aggiornale o rimuovile.</p>}
        </>
      )}
    </main>
  );
}
