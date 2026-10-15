import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// Crea la cartella dei dati nella directory del progetto se non esiste ancora.
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Apre o crea il database SQLite locale dell'applicazione.
const dbpath = path.join(dataDir, "app.sqlite");
const db = new Database(dbpath);

// Abilita il journaling WAL per consentire letture e scritture concorrenti più efficienti.
db.pragma("journal_mode = WAL"); //migliora le prestazioni quando più richieste leggono/scrivono contemporaneamente

db.pragma("foreign_keys = ON");

// Crea le tabelle senza modificare gli account esistenti.
db.exec(`
  CREATE TABLE IF NOT EXISTS Utente (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Sessione (
    token_hash TEXT PRIMARY KEY,
    utente_id INTEGER NOT NULL REFERENCES Utente(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

    CREATE INDEX IF NOT EXISTS idx_sessione_scadenza
  ON Sessione(expires_at);

  CREATE TABLE IF NOT EXISTS Prodotto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL CHECK (length(trim(nome)) > 0),
    descrizione TEXT NOT NULL DEFAULT '',
    prezzo_centesimi INTEGER NOT NULL
      CHECK (
        typeof(prezzo_centesimi) = 'integer'
        AND prezzo_centesimi > 0
      ),
    immagine TEXT,
    disponibilita INTEGER NOT NULL DEFAULT 0
      CHECK (
        typeof(disponibilita) = 'integer'
        AND disponibilita >= 0
      ),
    attivo INTEGER NOT NULL DEFAULT 1
      CHECK (attivo IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

`);

// Aggiunge il ruolo anche ai database creati nelle versioni precedenti.
db.transaction(() => {
  const colonne = db.pragma("table_info(Utente)") as {
    name: string;
  }[];

  const ruoloPresente = colonne.some(
    (colonna) => colonna.name === "ruolo",
  );

  if (!ruoloPresente) {
    db.exec(`
      ALTER TABLE Utente
      ADD COLUMN ruolo TEXT NOT NULL DEFAULT 'cliente'
      CHECK (ruolo IN ('cliente', 'admin'));
    `);
  }
})();
// Aggiunge la categoria anche ai prodotti già presenti.
db.transaction(() => {
  const colonne = db.pragma("table_info(Prodotto)") as {
    name: string;
  }[];

  const categoriaPresente = colonne.some(
    (colonna) => colonna.name === "categoria",
  );

  if (!categoriaPresente) {
    db.exec(`
      ALTER TABLE Prodotto
      ADD COLUMN categoria TEXT NOT NULL DEFAULT 'altro'
      CHECK (
        categoria IN (
          'pane',
          'focacce',
          'frise',
          'taralli',
          'biscotti',
          'altro'
        )
      );
    `);
  }
}).immediate();


// Foto caricate dall'amministratore e carrelli persistenti degli utenti.
db.transaction(() => {
  const colonne = db.pragma("table_info(Prodotto)") as { name: string }[];
  if (!colonne.some((colonna) => colonna.name === "foto")) {
    db.exec("ALTER TABLE Prodotto ADD COLUMN foto BLOB");
  }
  if (!colonne.some((colonna) => colonna.name === "foto_versione")) {
    db.exec("ALTER TABLE Prodotto ADD COLUMN foto_versione INTEGER NOT NULL DEFAULT 0");
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS Carrello (
      utente_id INTEGER NOT NULL REFERENCES Utente(id) ON DELETE CASCADE,
      prodotto_id INTEGER NOT NULL REFERENCES Prodotto(id) ON DELETE CASCADE,
      quantita INTEGER NOT NULL CHECK (
        typeof(quantita) = 'integer' AND quantita BETWEEN 1 AND 99
      ),
      PRIMARY KEY (utente_id, prodotto_id)
    );
    CREATE INDEX IF NOT EXISTS idx_carrello_prodotto ON Carrello(prodotto_id);
  `);
}).immediate();

// Gli ordini conservano nomi e prezzi al momento della conferma.
db.exec(`
  CREATE TABLE IF NOT EXISTS Ordine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL REFERENCES Utente(id),
    token TEXT NOT NULL,
    nominativo TEXT NOT NULL,
    telefono TEXT NOT NULL,
    totale_centesimi INTEGER NOT NULL CHECK (typeof(totale_centesimi) = 'integer' AND totale_centesimi > 0),
    stato TEXT NOT NULL DEFAULT 'ricevuto' CHECK (stato IN ('ricevuto', 'in_preparazione', 'pronto', 'completato')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (utente_id, token)
  );
  CREATE TABLE IF NOT EXISTS RigaOrdine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ordine_id INTEGER NOT NULL REFERENCES Ordine(id) ON DELETE CASCADE,
    prodotto_id INTEGER REFERENCES Prodotto(id) ON DELETE SET NULL,
    nome TEXT NOT NULL,
    prezzo_centesimi INTEGER NOT NULL CHECK (typeof(prezzo_centesimi) = 'integer' AND prezzo_centesimi > 0),
    quantita INTEGER NOT NULL CHECK (typeof(quantita) = 'integer' AND quantita BETWEEN 1 AND 99)
  );
  CREATE INDEX IF NOT EXISTS idx_riga_ordine ON RigaOrdine(ordine_id);
`);

// Gli ordini precedenti senza indirizzo restano identificabili come ritiri in negozio.
db.transaction(() => {
  const colonne = db.pragma("table_info(Ordine)") as { name: string }[];
  for (const campo of ["indirizzo", "numero_civico", "cap", "citta", "provincia"]) {
    if (!colonne.some((colonna) => colonna.name === campo)) {
      db.exec(`ALTER TABLE Ordine ADD COLUMN ${campo} TEXT`);
    }
  }
}).immediate();

db.exec(`
  CREATE TABLE IF NOT EXISTS Recensione (
    utente_id INTEGER NOT NULL REFERENCES Utente(id) ON DELETE CASCADE,
    prodotto_id INTEGER NOT NULL REFERENCES Prodotto(id) ON DELETE CASCADE,
    voto INTEGER NOT NULL CHECK (typeof(voto) = 'integer' AND voto BETWEEN 1 AND 5),
    commento TEXT NOT NULL CHECK (length(trim(commento)) BETWEEN 3 AND 1000),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (utente_id, prodotto_id)
  );
  CREATE INDEX IF NOT EXISTS idx_recensione_prodotto ON Recensione(prodotto_id);
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS Ticket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    utente_id INTEGER NOT NULL REFERENCES Utente(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    oggetto TEXT NOT NULL CHECK (length(trim(oggetto)) BETWEEN 3 AND 120),
    stato TEXT NOT NULL DEFAULT 'aperto' CHECK (stato IN ('aperto', 'chiuso')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (utente_id, token)
  );
  CREATE TABLE IF NOT EXISTS MessaggioTicket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL REFERENCES Ticket(id) ON DELETE CASCADE,
    autore_id INTEGER NOT NULL REFERENCES Utente(id),
    da_admin INTEGER NOT NULL CHECK (da_admin IN (0, 1)),
    token TEXT NOT NULL,
    testo TEXT NOT NULL CHECK (length(trim(testo)) BETWEEN 3 AND 3000),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (ticket_id, autore_id, token)
  );
  CREATE INDEX IF NOT EXISTS idx_ticket_stato ON Ticket(stato, updated_at);
`);

export default db;
