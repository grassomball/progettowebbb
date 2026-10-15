const Database = require("better-sqlite3");
const path = require("node:path");

const username = process.argv[2];

if (!username || !username.trim()) {
  console.error('Uso: node scripts/assegna-admin.cjs "username"');
  process.exit(1);
}

const dbPath = path.join(__dirname, "..", "data", "app.sqlite");

function assegnaAdmin() {
  // Apre soltanto un database già esistente.
  const db = new Database(dbPath, { fileMustExist: true });

  try {
    const utente = db
      .prepare("SELECT id, username, ruolo FROM Utente WHERE username = ?")
      .get(username.trim());

    if (!utente) {
      console.error("Utente non trovato. Registralo prima dal sito.");
      process.exitCode = 1;
      return;
    }

    if (utente.ruolo === "admin") {
      console.log(`${utente.username} è già amministratore.`);
      return;
    }

    const risultato = db
      .prepare("UPDATE Utente SET ruolo = ? WHERE id = ?")
      .run("admin", utente.id);

    if (risultato.changes !== 1) {
      throw new Error("Account non aggiornato.");
    }

    console.log(`${utente.username} è ora amministratore.`);
  } finally {
    db.close();
  }
}

try {
  assegnaAdmin();
} catch (error) {
  console.error(
    "Assegnazione non riuscita:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}