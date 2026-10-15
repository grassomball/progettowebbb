import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { categorieProdotti, getProdottoPubblicatoById } from "@/lib/prodotti";
import { getUtenteAutenticato } from "@/lib/auth";
import AggiungiCarrelloForm from "@/components/AggiungiCarrelloForm";
import RecensioniProdotto from "@/components/RecensioniProdotto";

const formatoPrezzo = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export default async function DettaglioProdottoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ recensione?: string | string[] }>;
}) {
  const { id } = await params;

  // Accetta soltanto ID interi positivi, senza conversioni parziali.
  if (!/^[1-9]\d*$/.test(id)) {
    notFound();
  }

  await connection();
  const prodotto = getProdottoPubblicatoById(Number(id));

  if (!prodotto) {
    notFound();
  }

  const categoria = categorieProdotti.find(
    (voce) => voce.valore === prodotto.categoria,
  );
  const disponibile = prodotto.disponibilita > 0;
  const utente = await getUtenteAutenticato();
  const { recensione } = await searchParams;

  return (
    <main className="shop-page product-page">
      <Link
        href="/catalogo"
        className="inline-block text-sm font-medium text-muted underline underline-offset-4 dark:text-zinc-300"
      >
        Torna al catalogo
      </Link>

      <article className="product-detail">
        <div className="product-detail-image relative aspect-square">
          {prodotto.immagine ? (
            <Image
              src={prodotto.immagine}
              alt={prodotto.nome}
              fill
              unoptimized={prodotto.immagine.startsWith("/api/")}
              sizes="(max-width: 767px) calc(100vw - 40px), 550px"
              className="object-contain p-4"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Foto in arrivo
            </div>
          )}
        </div>

        <div className="product-detail-copy flex flex-col justify-center">
          <Link
            href={`/catalogo?categoria=${prodotto.categoria}`}
            className="self-start text-sm font-medium text-brand underline underline-offset-4"
          >
            {categoria?.etichetta ?? "Altro"}
          </Link>

          <h1 className="mt-4 text-3xl font-bold">{prodotto.nome}</h1>

          {prodotto.descrizione && (
            <p className="mt-5 whitespace-pre-line leading-relaxed text-muted">
              {prodotto.descrizione}
            </p>
          )}

          <p className="mt-6 text-3xl font-bold text-brand">
            {formatoPrezzo.format(prodotto.prezzo_centesimi / 100)}
          </p>

          <span
            className={`mt-5 self-start rounded-full px-3 py-1 text-sm font-medium ${
              disponibile
                ? "bg-green-100 text-green-800"
                : "bg-stone-200 text-muted"
            }`}
          >
            {disponibile ? "Disponibile" : "Esaurito"}
          </span>

          {disponibile && (
            <p className="mt-3 text-sm text-muted">
              Disponibilità: {prodotto.disponibilita} unità.
            </p>
          )}
          {disponibile && (utente ? (
            <AggiungiCarrelloForm prodottoId={prodotto.id} disponibilita={prodotto.disponibilita} />
          ) : (
            <Link href="/login" className="mt-6 font-medium text-brand underline underline-offset-4">Accedi per aggiungere al carrello</Link>
          ))}
        </div>
      </article>
      <RecensioniProdotto prodottoId={prodotto.id} esito={typeof recensione === "string" ? recensione : undefined} />
    </main>
  );
}
