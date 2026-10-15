import { randomUUID } from "node:crypto";
import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";
import { getRiepilogoCheckout } from "@/lib/ordini";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default async function CheckoutPage() {
  const { righe, totaleCentesimi, impronta } = await getRiepilogoCheckout();
  const valido = righe.length > 0 && righe.every((r) => r.attivo && r.disponibilita >= r.quantita);
  return (
    <main className="shop-page checkout-page">
      <p className="shop-eyebrow">Un ultimo passo</p><h1 className="text-3xl font-bold">Riepilogo ordine</h1>
      <Link href="/carrello" className="mt-4 inline-block underline">Torna al carrello</Link>
      <p className="my-6">Spedizione a domicilio in Italia, gratuita per questa demo. Non vengono eseguiti pagamenti o spedizioni reali.</p>
      {righe.length === 0 ? <p>Il carrello è vuoto.</p> : <>
        <section className="order-summary" aria-label="Prodotti nel tuo ordine"><ul className="divide-y divide-line">{righe.map((r) => <li key={r.prodotto_id} className="flex flex-wrap justify-between gap-3 py-4"><span>{r.nome} × {r.quantita}</span><strong>{euro.format(r.prezzo_centesimi * r.quantita / 100)}</strong></li>)}</ul>
        <p className="mt-6 text-xl font-bold">Totale: {euro.format(totaleCentesimi / 100)}</p>
        </section>{valido ? <CheckoutForm token={randomUUID()} impronta={impronta} /> : <p role="alert" className="mt-6 text-red-700 dark:text-red-400">Alcuni prodotti non sono disponibili. Aggiorna il carrello prima di procedere.</p>}
      </>}
    </main>
  );
}
