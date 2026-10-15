import Link from "next/link";
import { getTicketAdmin } from "@/lib/assistenza";
import ElencoTicket from "@/components/ElencoTicket";

export default async function AssistenzaAdminPage({ searchParams }: { searchParams: Promise<{ stato?: string | string[] }> }) {
  const { stato } = await searchParams;
  const filtro = stato === "aperto" || stato === "chiuso" ? stato : "";
  const ticket = await getTicketAdmin(filtro);
  return <main className="shop-page mx-auto max-w-4xl px-6 py-12">
    <h1 className="text-3xl font-bold">Gestione assistenza</h1>
    <Link href="/admin" className="my-4 inline-block underline">Torna all’amministrazione</Link>
    <form className="mt-4 flex flex-wrap items-end gap-3">
      <label htmlFor="stato">Filtra per stato
        <select id="stato" name="stato" defaultValue={filtro} className="ml-3 rounded border bg-white px-3 py-2 text-ink">
          <option value="">Tutti</option><option value="aperto">Aperti</option><option value="chiuso">Chiusi</option>
        </select>
      </label>
      <button className="rounded border px-4 py-2">Applica</button>
    </form>
    <ElencoTicket ticket={ticket} amministrazione />
  </main>;
}
