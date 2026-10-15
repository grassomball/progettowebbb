import "server-only";

import db from "@/lib/db";

export const categorieProdotti = [
  { valore: "pane", etichetta: "Pane" },
  { valore: "focacce", etichetta: "Focacce" },
  { valore: "frise", etichetta: "Frise" },
  { valore: "taralli", etichetta: "Taralli" },
  { valore: "biscotti", etichetta: "Biscotti" },
  { valore: "altro", etichetta: "Altro" },
] as const;

export type CategoriaProdotto = (typeof categorieProdotti)[number]["valore"];

export const ordinamentiProdotti = [
  { valore: "nome-asc", etichetta: "Nome: A–Z" },
  { valore: "nome-desc", etichetta: "Nome: Z–A" },
  { valore: "prezzo-asc", etichetta: "Prezzo: dal più basso" },
  { valore: "prezzo-desc", etichetta: "Prezzo: dal più alto" },
] as const;

export type OrdinamentoProdotti =
  (typeof ordinamentiProdotti)[number]["valore"];

export function normalizzaOrdinamentoProdotti(
  valore: unknown,
): OrdinamentoProdotti {
  return (
    ordinamentiProdotti.find((ordinamento) => ordinamento.valore === valore)
      ?.valore ?? "nome-asc"
  );
}

// Le clausole SQL provengono solo da questa lista, mai direttamente dall'URL.
const clausoleOrdinamento: Record<OrdinamentoProdotti, string> = {
  "nome-asc": "nome COLLATE NOCASE ASC, id ASC",
  "nome-desc": "nome COLLATE NOCASE DESC, id ASC",
  "prezzo-asc": "prezzo_centesimi ASC, nome COLLATE NOCASE ASC, id ASC",
  "prezzo-desc": "prezzo_centesimi DESC, nome COLLATE NOCASE ASC, id ASC",
};

export type Prodotto = {
  id: number;
  nome: string;
  categoria: CategoriaProdotto;
  descrizione: string;
  prezzo_centesimi: number;
  immagine: string | null;
  disponibilita: number;
  attivo: 0 | 1;
  created_at: string;
};

export function getProdottiPubblicati(
  categoria?: CategoriaProdotto,
  ordinamento: OrdinamentoProdotti = "nome-asc",
): Prodotto[] {
  const ordineSql =
    clausoleOrdinamento[normalizzaOrdinamentoProdotti(ordinamento)];

  return db
    .prepare(`
      SELECT
        id, nome, categoria, descrizione, prezzo_centesimi,
        CASE WHEN foto IS NOT NULL
          THEN '/api/prodotti/' || id || '/immagine?v=' || foto_versione
          ELSE immagine END AS immagine,
        disponibilita, attivo, created_at
      FROM Prodotto
      WHERE attivo = 1
        AND (? IS NULL OR categoria = ?)
      ORDER BY ${ordineSql}
    `)
    .all(categoria ?? null, categoria ?? null) as Prodotto[];
}

export function getProdottoPubblicatoById(
  id: number,
): Prodotto | null {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return null;
  }

  const prodotto = db
    .prepare(`
      SELECT
        id, nome, categoria, descrizione, prezzo_centesimi,
        CASE WHEN foto IS NOT NULL
          THEN '/api/prodotti/' || id || '/immagine?v=' || foto_versione
          ELSE immagine END AS immagine,
        disponibilita, attivo, created_at
      FROM Prodotto
      WHERE id = ? AND attivo = 1
    `)
    .get(id) as Prodotto | undefined;

  return prodotto ?? null;
}
