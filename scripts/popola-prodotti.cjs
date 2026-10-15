const Database = require("better-sqlite3");
const path = require("node:path");

const dbPath = path.join(__dirname, "..", "data", "app.sqlite");

const prodotti = [
  {
    nome: "Pane di Altamura D.O.P. — 500 g",
    categoria: "pane",
    immagine: "/prodotti/pane-di-altamura-dop.webp",
    descrizione:
      "Pane di semola di grano duro con lievito madre, dalla crosta croccante.",
    prezzo: 250,
    disponibilita: 15,
  },
  {
    nome: "Focaccia con pomodoro — 500 g",
    categoria: "focacce",
    immagine: "/prodotti/focaccia-con-pomodoro-artigianale.webp",
    descrizione:
      "Focaccia pugliese con pomodoro, olive, origano e olio extravergine.",
    prezzo: 520,
    disponibilita: 8,
  },
  {
    nome: "Focaccia con pomodoro pelato — 500 g",
    categoria: "focacce",
    immagine: "/prodotti/focaccia-con-salsa-di-pomodoro-artigianale.webp",
    descrizione:
      "Focaccia pugliese con salsa di pomodoro, nel formato da 500 g.",
    prezzo: 520,
    disponibilita: 8,
  },
  {
    nome: "Focaccia con patate — 500 g",
    categoria: "focacce",
    immagine: "/prodotti/focaccia-con-patate-artigianale-focaccia.webp",
    descrizione:
      "Focaccia pugliese con patate, nel formato da 500 g.",
    prezzo: 520,
    disponibilita: 10,
  },
  {
    nome: "Frise caserecce di grano duro — 450 g",
    categoria: "frise",
    immagine: "/prodotti/frise-caserecce-di-grano-duro-artigianali.webp",
    descrizione:
      "Frise a doppia cottura, da ammorbidire con acqua e condire a piacere.",
    prezzo: 520,
    disponibilita: 0,
  },
  {
    nome: "Taralli alle cime di rapa — 250 g",
    categoria: "taralli",
    immagine: "/prodotti/taralli-alle-cime-di-rapa-artigianali.webp",
    descrizione:
      "Taralli croccanti con cime di rapa, ideali per una pausa salata.",
    prezzo: 350,
    disponibilita: 20,
  },
  {
    nome: "Treccine ai semi di finocchio — 400 g",
    categoria: "taralli",
    immagine: "/prodotti/treccine-ai-semi-di-finocchio.webp",
    descrizione:
      "Treccine salate con vino bianco e semi di finocchio.",
    prezzo: 490,
    disponibilita: 12,
  },
  {
    nome: "Biscotto del Mattino — 500 g",
    categoria: "biscotti",
    immagine: "/prodotti/biscotto-del-mattino.webp",
    descrizione:
      "Biscotti da colazione con olio extravergine e una nota di limone.",
    prezzo: 420,
    disponibilita: 18,
  },
  // Formati e prezzi verificati sulle schede digesu.it; scorte dimostrative.
  // https://digesu.it/products/rigatello-dolce?variant=53432689557837
  {
    nome: "Rigatello artigianale — 900 g",
    categoria: "biscotti",
    immagine: "/prodotti/rigatello-artigianale.webp",
    descrizione:
      "Biscotti friabili dal profumo di arancia, da accompagnare a latte o tè.",
    prezzo: 600,
    disponibilita: 12,
  },
  // https://digesu.it/products/rigatello-cacao?variant=53432689688909
  {
    nome: "Rigatello al cacao — 750 g",
    categoria: "biscotti",
    immagine: "/prodotti/rigatello-al-cacao.webp",
    descrizione:
      "Biscotti croccanti al cacao con un tocco di arancia, per colazione o merenda.",
    prezzo: 600,
    disponibilita: 10,
  },
  // https://digesu.it/products/rigatello-integrale?variant=53432689590605
  {
    nome: "Rigatello integrale — 900 g",
    categoria: "biscotti",
    immagine: "/prodotti/rigatello-integrale.jpg",
    descrizione:
      "Biscotti con farina integrale e olio extravergine di oliva, dal gusto rustico.",
    prezzo: 600,
    disponibilita: 8,
  },
];

function popolaProdotti() {
  const db = new Database(dbPath, { fileMustExist: true });

  try {
    const colonne = db.pragma("table_info(Prodotto)");
    if (!colonne.some((colonna) => colonna.name === "categoria")) {
      throw new Error(
        "Categoria non presente nel database. Avvia l'app e apri /catalogo per applicare la migrazione di lib/db.ts, poi riesegui lo script.",
      );
    }

    const cerca = db.prepare(
      "SELECT id, immagine, categoria FROM Prodotto WHERE nome = ?",
    );

    const inserisci = db.prepare(`
      INSERT INTO Prodotto (
        nome, descrizione, prezzo_centesimi, disponibilita, immagine, categoria, attivo
      )
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const aggiornaImmagine = db.prepare(`
      UPDATE Prodotto SET immagine = ? WHERE id = ?
    `);

    const aggiornaCategoria = db.prepare(`
      UPDATE Prodotto SET categoria = ? WHERE id = ?
    `);

    const popola = db.transaction(() => {
      // Nasconde soltanto le vecchie schede dimostrative riconoscibili.
      db.prepare(`
        UPDATE Prodotto
        SET attivo = 0
        WHERE nome IN (?, ?, ?, ?)
          AND descrizione LIKE ?
          AND attivo = 1
      `).run(
        "Pane artigianale — 500 g",
        "Focaccia — una teglia",
        "Taralli — confezione da 250 g",
        "Frise — confezione da 500 g",
        "%Prodotto dimostrativo.%",
      );

      let aggiunti = 0;
      let immaginiAggiornate = 0;
      let categorieAggiornate = 0;

      for (const prodotto of prodotti) {
        const esistente = cerca.get(prodotto.nome);

        // Aggiorna foto e categoria, conservando gli altri dati del prodotto.
        if (esistente) {
          if (esistente.immagine !== prodotto.immagine) {
            aggiornaImmagine.run(prodotto.immagine, esistente.id);
            immaginiAggiornate++;
          }
          if (esistente.categoria !== prodotto.categoria) {
            aggiornaCategoria.run(prodotto.categoria, esistente.id);
            categorieAggiornate++;
          }
          continue;
        }

        inserisci.run(
          prodotto.nome,
          prodotto.descrizione,
          prodotto.prezzo,
          prodotto.disponibilita,
          prodotto.immagine,
          prodotto.categoria,
        );

        aggiunti++;
      }

      return { aggiunti, immaginiAggiornate, categorieAggiornate };
    });

    const { aggiunti, immaginiAggiornate, categorieAggiornate } = popola.immediate();
    console.log(`Prodotti dimostrativi aggiunti: ${aggiunti}`);
    console.log(`Immagini aggiornate: ${immaginiAggiornate}`);
    console.log(`Categorie aggiornate: ${categorieAggiornate}`);
  } finally {
    db.close();
  }
}

try {
  popolaProdotti();
} catch (error) {
  console.error(
    "Caricamento non riuscito:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
}
