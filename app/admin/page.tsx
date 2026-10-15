import { richiediAdmin } from "@/lib/auth";
import Link from "next/link";

export default async function AdminPage() {
  const utente = await richiediAdmin();

  return (
    <main className="shop-page max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-ink dark:text-white mb-6">
        Area amministrativa
      </h1>

      <p className="text-lg text-muted dark:text-zinc-300">
        Benvenuto, <strong>{utente.username}</strong>.
        Questa area è riservata alla gestione del Forno Di Gesù.
      </p>
      <Link href="/admin/prodotti" className="mt-8 inline-block rounded-lg bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark">
        Gestisci prodotti
      </Link>
      <Link href="/admin/ordini" className="ml-4 mt-8 inline-block rounded-lg border border-brand px-5 py-3 font-medium">Gestisci ordini</Link>
      <Link href="/admin/assistenza" className="ml-4 mt-8 inline-block rounded-lg border border-brand px-5 py-3 font-medium">Gestisci assistenza</Link>
    </main>
  );
}
