import "server-only";
import db from "@/lib/db";
import { richiediUtente } from "@/lib/auth";

export type RigaCarrello = {
  prodotto_id: number;
  nome: string;
  quantita: number;
  prezzo_centesimi: number;
  disponibilita: number;
  attivo: number;
  problema: string | null;
};

export async function getCarrello() {
  const utente = await richiediUtente();
  const righe = (db.prepare(`SELECT p.id AS prodotto_id, p.nome, c.quantita,
    p.prezzo_centesimi, p.disponibilita, p.attivo
    FROM Carrello c JOIN Prodotto p ON p.id = c.prodotto_id
    WHERE c.utente_id = ? ORDER BY p.nome COLLATE NOCASE, p.id`).all(utente.id) as Omit<RigaCarrello, "problema">[])
    .map((riga): RigaCarrello => ({
      ...riga,
      problema: !riga.attivo ? "Prodotto non più in vendita: rimuovilo dal carrello."
        : riga.disponibilita === 0 ? "Prodotto esaurito."
          : riga.quantita > riga.disponibilita ? `Disponibili solo ${riga.disponibilita} unità: riduci la quantità.` : null,
    }));
  return {
    righe,
    totaleCentesimi: righe.reduce((totale, riga) => totale + riga.prezzo_centesimi * riga.quantita, 0),
  };
}
