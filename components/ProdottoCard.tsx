import Image from "next/image";
import Link from "next/link";
import type { Prodotto } from "@/lib/prodotti";

const formatoPrezzo = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
});

export default function ProdottoCard({
  prodotto,
}: {
  prodotto: Prodotto;
}) {
  const disponibile = prodotto.disponibilita > 0;

  return (
    <article className="product-card">
      <div className="product-card-image">
        {prodotto.immagine ? (
          <Image
            src={prodotto.immagine}
            alt={prodotto.nome}
            fill
            unoptimized={prodotto.immagine.startsWith("/api/")}
            sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 999px) 45vw, 30vw"
            className="object-contain p-6"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-brand">
            Foto in arrivo
          </div>
        )}
      </div>

      <div className="product-card-copy">
        <h2 className="text-xl font-semibold">
          <Link
            href={`/catalogo/${prodotto.id}`}
            className="hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            {prodotto.nome}
          </Link>
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-muted">
          {prodotto.descrizione}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xl font-bold text-brand">
            {formatoPrezzo.format(prodotto.prezzo_centesimi / 100)}
          </p>

          <span
            className={
              disponibile
                ? "rounded-full bg-green-100 px-3 py-1 text-sm text-green-800"
                : "rounded-full bg-stone-200 px-3 py-1 text-sm text-muted"
            }
          >
            {disponibile ? "Disponibile" : "Esaurito"}
          </span>
        </div>

        <Link
          href={`/catalogo/${prodotto.id}`}
          aria-label={`Vedi dettagli: ${prodotto.nome}`}
          className="mt-6 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
        >
          Vedi dettagli
        </Link>
      </div>
    </article>
  );
}
