import Link from "next/link";
import { getRecensioniProdotto } from "@/lib/recensioni";
import RecensioneForm from "@/components/RecensioneForm";

const data = new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeZone: "Europe/Rome" });

export default async function RecensioniProdotto({ prodottoId, esito }: { prodottoId: number; esito?: string }) {
  const { recensioni, media, propria, puoRecensire } = await getRecensioniProdotto(prodottoId);
  return <section id="recensioni" aria-labelledby="titolo-recensioni" className="mt-12">
    <h2 id="titolo-recensioni" className="text-2xl font-bold">Recensioni</h2>
    {esito === "salvata" && <p role="status" className="mt-3">Recensione salvata.</p>}
    {esito === "eliminata" && <p role="status" className="mt-3">Recensione eliminata.</p>}
    <p className="mt-3">{media === null ? "Nessuna recensione: puoi essere il primo a raccontare la tua esperienza." : `Voto medio: ${media.toLocaleString("it-IT", { maximumFractionDigits: 1 })} su 5 · ${recensioni.length} recensioni`}</p>
    {puoRecensire ? <RecensioneForm key={propria ? `${propria.voto}-${propria.commento}` : "nuova"} prodottoId={prodottoId} recensione={propria && { voto: propria.voto, commento: propria.commento }} /> :
      <p className="my-6">Puoi scrivere una recensione dopo aver ricevuto il prodotto. <Link href="/area-privata/ordini" className="underline">Controlla i tuoi ordini</Link>.</p>}
    <ul className="mt-6 space-y-4">{recensioni.map((r) => <li key={r.utente_id} className="rounded-lg border border-line p-5">
      <p className="font-semibold">{r.username} · {r.voto} su 5</p>
      <p className="mt-1 text-sm">Acquisto verificato · {data.format(new Date(r.updated_at.replace(" ", "T") + "Z"))}</p>
      <p className="mt-3 whitespace-pre-wrap break-words">{r.commento}</p>
    </li>)}</ul>
  </section>;
}
