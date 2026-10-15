import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserIdDaSessione } from "@/lib/session";
import db from "@/lib/db";

export default async function AreaPrivataPage() {
  // Recupera dal cookie l'identificativo dell'utente autenticato.
    const userId = await getUserIdDaSessione();

  if (!userId) {
    redirect("/login");
  }

  const utente = db
    .prepare("SELECT username FROM Utente WHERE id = ?")
    .get(userId) as { username: string } | undefined;

  if (!utente) {
    redirect("/login");
  }
  return (
    // Questa pagina viene renderizzata solo dopo il controllo della sessione.
    <div className="shop-page account-page">
      <p className="shop-eyebrow">Il tuo spazio al forno</p><h1 className="text-3xl font-bold text-ink dark:text-white mb-6">
        Area privata
      </h1>

      <p className="text-lg text-muted dark:text-zinc-300 mb-4">
        Benvenuto, <strong>{utente.username}</strong>!
        Hai effettuato correttamente l&apos;accesso al tuo account.
      </p>

      <p className="text-lg text-muted dark:text-zinc-300">
        Per terminare la sessione, premi Esci nella barra di navigazione.
      </p>

      <div className="account-grid">
        <Link href="/area-privata/ordini" className="account-card"><span className="shop-eyebrow">01 / Ordini</span><h2>I miei ordini</h2><p>Ritrova i tuoi acquisti e segui lo stato della preparazione.</p><span aria-hidden="true">→</span></Link>
        <Link href="/area-privata/prodotti" className="account-card"><span className="shop-eyebrow">02 / Prodotti</span><h2>Dal nostro forno</h2><p>Consulta l&apos;elenco dei prodotti, i prezzi e le disponibilità.</p><span aria-hidden="true">→</span></Link>
        <Link href="/area-privata/assistenza" className="account-card"><span className="shop-eyebrow">03 / Assistenza</span><h2>Parliamone</h2><p>Scrivici per una richiesta e leggi le nostre risposte.</p><span aria-hidden="true">→</span></Link>
      </div>
    </div>
  );
}
