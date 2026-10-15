import Link from "next/link";
import { notFound } from "next/navigation";
import { getProdottoAdmin } from "@/lib/prodotti-admin";
import { categorieProdotti } from "@/lib/prodotti";
import ProdottoForm from "@/components/ProdottoForm";

export default async function ModificaProdottoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prodotto = await getProdottoAdmin(/^[1-9]\d*$/.test(id) ? Number(id) : NaN);
  if (!prodotto) notFound();
  return (
    <main className="shop-page mx-auto max-w-2xl px-6 py-12">
      <Link href="/admin/prodotti" className="underline underline-offset-4">Torna ai prodotti</Link>
      <h1 className="mt-6 text-3xl font-bold">Modifica prodotto</h1>
      <ProdottoForm key={prodotto.id} prodotto={prodotto} categorie={categorieProdotti} />
    </main>
  );
}
