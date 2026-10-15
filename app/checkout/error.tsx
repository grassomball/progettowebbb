"use client";

import Link from "next/link";

export default function CheckoutError({ reset }: { reset: () => void }) {
  return <main className="shop-page mx-auto max-w-2xl px-6 py-12">
    <h1 className="text-2xl font-bold">Non è stato possibile completare la richiesta</h1>
    <p className="my-4">Controlla i tuoi ordini prima di riprovare: la conferma potrebbe essere già stata registrata.</p>
    <Link href="/area-privata/ordini" className="mr-6 underline">I miei ordini</Link>
    <button onClick={reset} className="rounded border px-4 py-2">Riprova</button>
  </main>;
}
