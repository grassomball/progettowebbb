import { connection } from "next/server";
import Link from "next/link";
import { categorieProdotti, getProdottiPubblicati } from "@/lib/prodotti";
import ProdottoCard from "@/components/ProdottoCard";

export default async function CatalogoPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string | string[] }>;
}) {
  await connection();

  const { categoria } = await searchParams;
  const categoriaSelezionata = categorieProdotti.find(
    (voce) => voce.valore === categoria,
  );
  const prodotti = getProdottiPubblicati(categoriaSelezionata?.valore);
  const filtri = [
    { valore: "", etichetta: "Tutti" },
    ...categorieProdotti,
  ];

  return (
    <main className="shop-page catalog-page">
      <p className="shop-eyebrow">Dal forno alla tua tavola</p>
      <h1 className="text-3xl font-bold text-ink dark:text-white mb-4">
        I nostri prodotti
      </h1>

      <p className="text-muted dark:text-zinc-300 mb-8">
        I sapori della tradizione del Forno Di Gesù.
      </p>

      <nav aria-label="Categorie dei prodotti" className="mb-8">
        <ul className="flex flex-wrap gap-3">
          {filtri.map((filtro) => {
            const selezionato =
              filtro.valore === (categoriaSelezionata?.valore ?? "");

            return (
              <li key={filtro.valore}>
                <Link
                  href={
                    filtro.valore
                      ? `/catalogo?categoria=${filtro.valore}`
                      : "/catalogo"
                  }
                  aria-current={selezionato ? "page" : undefined}
                  className={`inline-block rounded-full border px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand ${
                    selezionato
                      ? "border-brand bg-brand text-white"
                      : "border-line bg-paper text-ink hover:bg-sand"
                  }`}
                >
                  {filtro.etichetta}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mb-6 text-sm text-muted dark:text-zinc-300">
        {categoriaSelezionata?.etichetta ?? "Tutti i prodotti"}
        {": "}
        {prodotti.length} {prodotti.length === 1 ? "prodotto" : "prodotti"}
      </p>

      {prodotti.length === 0 ? (
        <p className="text-muted dark:text-zinc-300">
          {categoriaSelezionata
            ? "Al momento non ci sono prodotti pubblicati in questa categoria."
            : "Al momento non ci sono prodotti pubblicati."}
        </p>
      ) : (
        <ul className="catalog-grid">
          {prodotti.map((prodotto) => (
            <li key={prodotto.id}>
              <ProdottoCard prodotto={prodotto} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
