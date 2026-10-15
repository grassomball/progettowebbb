import Link from "next/link";
import { getProdottiAdmin } from "@/lib/prodotti-admin";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default async function GestioneProdottiPage({ searchParams }: {
  searchParams: Promise<{ salvato?: string }>;
}) {
  const prodotti = await getProdottiAdmin();
  const { salvato } = await searchParams;
  return (
    <main className="shop-page mx-auto max-w-5xl px-6 py-12">
      <Link href="/admin" className="underline underline-offset-4">Area amministrativa</Link>
      <div className="my-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Gestione prodotti</h1>
        <Link href="/admin/prodotti/nuovo" className="rounded-lg bg-brand px-4 py-2 text-white">Nuovo prodotto</Link>
      </div>
      {salvato === "1" && <p role="status" className="mb-6 rounded-lg bg-green-100 p-3 text-green-900">Prodotto salvato.</p>}
      {prodotti.length === 0 ? <p>Nessun prodotto presente. Aggiungi il primo prodotto.</p> : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full bg-paper text-left text-ink">
            <caption className="sr-only">Prodotti pubblicati e nascosti</caption>
            <thead className="bg-sand"><tr>
              <th scope="col" className="p-4">Prodotto</th><th scope="col" className="p-4">Prezzo</th>
              <th scope="col" className="p-4">Scorte</th><th scope="col" className="p-4">Stato</th>
            </tr></thead>
            <tbody>{prodotti.map((prodotto) => (
              <tr key={prodotto.id} className="border-t border-line">
                <th scope="row" className="p-4 font-medium"><Link href={`/admin/prodotti/${prodotto.id}`} className="text-brand underline underline-offset-4">{prodotto.nome}</Link></th>
                <td className="whitespace-nowrap p-4">{euro.format(prodotto.prezzo_centesimi / 100)}</td>
                <td className="p-4">{prodotto.disponibilita}</td><td className="p-4">{prodotto.attivo ? "Pubblicato" : "Nascosto"}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </main>
  );
}
