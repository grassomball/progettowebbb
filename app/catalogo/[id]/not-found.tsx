import Link from "next/link";

export default function ProdottoNonTrovato() {
  return (
    <main className="shop-page mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-3xl font-bold text-ink dark:text-white">
        Prodotto non trovato
      </h1>
      <p className="mt-4 text-muted dark:text-zinc-300">
        Il prodotto cercato non è presente nel catalogo.
      </p>
      <Link
        href="/catalogo"
        className="mt-6 inline-block rounded-lg bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      >
        Torna al catalogo
      </Link>
    </main>
  );
}
