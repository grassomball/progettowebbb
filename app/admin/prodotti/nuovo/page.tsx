import Link from "next/link";
import { richiediAdmin } from "@/lib/auth";
import { categorieProdotti } from "@/lib/prodotti";
import ProdottoForm from "@/components/ProdottoForm";

export default async function NuovoProdottoPage() {
  await richiediAdmin();
  return (
    <main className="shop-page mx-auto max-w-2xl px-6 py-12">
      <Link href="/admin/prodotti" className="underline underline-offset-4">Torna ai prodotti</Link>
      <h1 className="mt-6 text-3xl font-bold">Nuovo prodotto</h1>
      <ProdottoForm categorie={categorieProdotti} />
    </main>
  );
}
