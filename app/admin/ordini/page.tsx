import Link from "next/link";
import { getOrdiniAdmin } from "@/lib/ordini-admin";
import { statiOrdine, isStatoOrdine, etichettaStatoOrdine } from "@/lib/stati-ordine";

const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });
const data = new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Rome" });

export default async function OrdiniAdminPage({ searchParams }: { searchParams: Promise<{ stato?: string | string[] }> }) {
  const { stato } = await searchParams;
  const filtro = isStatoOrdine(stato) ? stato : "";
  const ordini = await getOrdiniAdmin(filtro);
  return <main className="shop-page mx-auto max-w-4xl px-6 py-12">
    <h1 className="text-3xl font-bold">Gestione ordini</h1>
    <Link href="/admin" className="mt-4 inline-block underline">Torna all’amministrazione</Link>
    <form className="my-8 flex flex-wrap items-end gap-4">
      <label htmlFor="stato">Filtra per stato
        <select id="stato" name="stato" defaultValue={filtro} className="ml-3 rounded border bg-white px-3 py-2 text-ink">
          <option value="">Tutti</option>
          {statiOrdine.map((s) => <option key={s} value={s}>{s === "pronto" ? "Pronto" : s === "completato" ? "Completato" : etichettaStatoOrdine(s, true)}</option>)}
        </select>
      </label>
      <button className="rounded border px-4 py-2">Applica</button>
    </form>
    <p className="mb-4">{ordini.length} ordini trovati</p>
    {ordini.length === 0 ? <p>Nessun ordine da mostrare.</p> : <ul className="space-y-4">{ordini.map((o) => <li key={o.id} className="rounded-xl border border-line p-5">
      <Link href={`/admin/ordini/${o.id}`} className="text-xl font-semibold underline">Ordine #{o.id} — {o.nominativo}</Link>
      <p className="mt-2">{data.format(new Date(o.created_at.replace(" ", "T") + "Z"))}</p>
      <p>{etichettaStatoOrdine(o.stato, Boolean(o.indirizzo))} · {euro.format(o.totale_centesimi / 100)}</p>
    </li>)}</ul>}
  </main>;
}
