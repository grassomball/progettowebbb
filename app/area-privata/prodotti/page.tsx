import Link from "next/link";
import { redirect } from "next/navigation";
import { getUtenteAutenticato } from "@/lib/auth";
import {
  getProdottiPubblicati,
  normalizzaOrdinamentoProdotti,
  ordinamentiProdotti,
} from "@/lib/prodotti";

const formatoPrezzo = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export default async function ProdottiPrivatiPage({
  searchParams,
}: {
  searchParams: Promise<{ ordine?: string | string[] }>;
}) {
  const utente = await getUtenteAutenticato();

  if (!utente) {
    redirect("/login");
  }

  const { ordine } = await searchParams;
  const ordinamento = normalizzaOrdinamentoProdotti(ordine);
  const prodotti = getProdottiPubblicati(undefined, ordinamento);

  return (
    <main className="shop-page mx-auto max-w-4xl px-6 py-12">
      <Link
        href="/area-privata"
        className="text-sm font-medium text-muted underline underline-offset-4 dark:text-zinc-300"
      >
        Torna all’area privata
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-ink dark:text-white">
        Elenco prodotti
      </h1>
      <p className="mt-4 text-muted dark:text-zinc-300">
        Ordina i prodotti per nome o prezzo. Seleziona il nome per aprire la
        scheda del prodotto.
      </p>

      <form
        action="/area-privata/prodotti"
        method="get"
        className="my-8 flex flex-wrap items-end gap-3"
      >
        <div>
          <label
            htmlFor="ordine"
            className="mb-2 block text-sm font-medium text-ink dark:text-white"
          >
            Ordina per
          </label>
          <select
            key={ordinamento}
            id="ordine"
            name="ordine"
            defaultValue={ordinamento}
            className="rounded-lg border border-line bg-paper px-3 py-2 text-ink"
          >
            {ordinamentiProdotti.map((opzione) => (
              <option key={opzione.valore} value={opzione.valore}>
                {opzione.etichetta}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          Applica
        </button>
      </form>

      {prodotti.length === 0 ? (
        <p className="text-muted dark:text-zinc-300">
          Al momento non ci sono prodotti pubblicati.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full bg-paper text-left text-ink">
            <caption className="bg-paper px-4 py-3 text-left text-sm text-muted">
              {prodotti.length} {prodotti.length === 1 ? "prodotto" : "prodotti"}
              {" nel catalogo"}
            </caption>
            <thead className="bg-sand">
              <tr>
                <th
                  scope="col"
                  aria-sort={
                    ordinamento === "nome-asc"
                      ? "ascending"
                      : ordinamento === "nome-desc"
                        ? "descending"
                        : undefined
                  }
                  className="px-4 py-3"
                >
                  Nome
                </th>
                <th
                  scope="col"
                  aria-sort={
                    ordinamento === "prezzo-asc"
                      ? "ascending"
                      : ordinamento === "prezzo-desc"
                        ? "descending"
                        : undefined
                  }
                  className="px-4 py-3 text-right"
                >
                  Prezzo
                </th>
                <th scope="col" className="px-4 py-3">
                  Disponibilità
                </th>
              </tr>
            </thead>
            <tbody>
              {prodotti.map((prodotto) => (
                <tr key={prodotto.id} className="border-t border-line">
                  <th scope="row" className="px-4 py-4 font-medium">
                    <Link
                      href={`/catalogo/${prodotto.id}`}
                      className="text-brand underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                    >
                      {prodotto.nome}
                    </Link>
                  </th>
                  <td className="whitespace-nowrap px-4 py-4 text-right tabular-nums">
                    {formatoPrezzo.format(prodotto.prezzo_centesimi / 100)}
                  </td>
                  <td className="px-4 py-4">
                    {prodotto.disponibilita > 0
                      ? `${prodotto.disponibilita} disponibili`
                      : "Esaurito"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
