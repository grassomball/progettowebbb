/* Moduli reali, SQLite in memoria; cookie, redirect e invalidazione Next simulati. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const Database = require("better-sqlite3");
const sharp = require("sharp");

function load(file, dependencies) {
  const exports = {};
  const code = ts.transpileModule(readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, {
    exports, Buffer, File, Response, Uint8Array, Error, process,
    require: (name) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
  }, { filename: file });
  return exports;
}

function setup(t) {
  const db = new Database(":memory:");
  t.after(() => db.close());
  const migrate = () => load("lib/db.ts", { "better-sqlite3": function () { return db; }, fs: { existsSync: () => true } });
  migrate();
  const user = db.prepare("INSERT INTO Utente (username, password_hash, ruolo) VALUES (?, 'hash-test', ?)");
  user.run("amministratore", "admin");
  user.run("cliente-a", "cliente");
  user.run("cliente-b", "cliente");
  const prodottoId = Number(db.prepare(`INSERT INTO Prodotto
    (nome, categoria, prezzo_centesimi, disponibilita, immagine) VALUES ('Pane', 'pane', 250, 5, '/prodotti/pane-di-altamura-dop.webp')`).run().lastInsertRowid);
  const jar = new Map();
  const session = load("lib/session.ts", {
    "@/lib/db": db,
    "next/headers": { cookies: async () => ({
      get: (name) => jar.has(name) ? { value: jar.get(name) } : undefined,
      set: (name, value) => jar.set(name, value), delete: (name) => jar.delete(name),
    }) },
  });
  const navigation = { redirect: (url) => { throw new Error(`REDIRECT:${url}`); } };
  const auth = load("lib/auth.ts", { "server-only": {}, "@/lib/db": db, "@/lib/session": session, "next/navigation": navigation });
  const prodotti = load("lib/prodotti.ts", { "server-only": {}, "@/lib/db": db });
  const invalidated = [];
  const common = { "server-only": {}, "@/lib/db": db, "@/lib/auth": auth, "@/lib/prodotti": prodotti,
    "next/navigation": navigation, "next/cache": { revalidatePath: (path) => invalidated.push(path) } };
  const ordini = load("lib/ordini.ts", common);
  const stati = load("lib/stati-ordine.ts", {});
  const adminOrdiniDependencies = { ...common, "@/lib/stati-ordine": stati };
  const recensioni = load("lib/recensioni.ts", common);
  return {
    assistenza: load("lib/assistenza.ts", common),
    assistenzaActions: load("app/area-privata/assistenza/actions.ts", common),
    recensioni,
    recensioniActions: load("app/catalogo/recensioni-actions.ts", { ...common, "@/lib/recensioni": recensioni }),
    adminOrdini: load("lib/ordini-admin.ts", adminOrdiniDependencies),
    statiOrdini: load("app/admin/ordini/actions.ts", adminOrdiniDependencies),
    ordini,
    checkout: load("app/checkout/actions.ts", { ...common, "@/lib/ordini": ordini }),
    db, prodottoId, migrate, jar, invalidated, prodotti,
    login: (id) => session.creaSessione(id),
    admin: load("app/admin/prodotti/actions.ts", common),
    adminRead: load("lib/prodotti-admin.ts", common),
    cart: load("app/carrello/actions.ts", common),
    cartRead: load("lib/carrello.ts", common),
    image: load("app/api/prodotti/[id]/immagine/route.ts", common),
  };
}

function productForm(values = {}) {
  const form = new FormData();
  for (const [name, value] of Object.entries({ nome: "Biscotti", descrizione: "Biscotti da colazione", categoria: "biscotti", prezzo: "6,05", disponibilita: "12", attivo: "on", ...values })) {
    if (value !== null) form.set(name, value);
  }
  return form;
}

function cartForm(id, quantita = "1", operazione = "aggiorna") {
  const form = new FormData();
  form.set("prodotto_id", String(id));
  form.set("quantita", String(quantita));
  form.set("operazione", operazione);
  return form;
}

test("migrazioni ripetibili e carrello con chiavi esterne", async (t) => {
  const s = setup(t);
  const before = s.db.prepare("SELECT * FROM Prodotto").all();
  s.migrate();
  assert.deepEqual(s.db.prepare("SELECT * FROM Prodotto").all(), before);
  assert.throws(() => s.db.prepare("INSERT INTO Carrello VALUES (999, ?, 1)").run(s.prodottoId), /FOREIGN KEY/);
  assert.throws(() => s.db.prepare("INSERT INTO Carrello VALUES (2, ?, 0)").run(s.prodottoId), /CHECK/);
  await s.login(2);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId));
  s.db.prepare("DELETE FROM Utente WHERE id = 2").run();
  assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM Carrello").get().n, 0);
});

test("pagine dati e azioni amministrative rifiutano ospite e cliente", async (t) => {
  const s = setup(t);
  await assert.rejects(s.admin.salvaProdotto(null, {}, productForm()), /REDIRECT:\/login/);
  await assert.rejects(s.adminRead.getProdottiAdmin(), /REDIRECT:\/login/);
  await s.login(2);
  const form = productForm({ ruolo: "admin" });
  await assert.rejects(s.admin.salvaProdotto(s.prodottoId, {}, form), /REDIRECT:\/area-privata/);
  await assert.rejects(s.adminRead.getProdottoAdmin(s.prodottoId), /REDIRECT:\/area-privata/);
  assert.equal(s.db.prepare("SELECT nome FROM Prodotto").get().nome, "Pane");
  assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM Prodotto").get().n, 1);
});

test("admin crea e modifica prodotti, conserva la foto e può nascondere/ripubblicare", async (t) => {
  const s = setup(t);
  await s.login(1);
  await assert.rejects(s.admin.salvaProdotto(null, {}, productForm()), /REDIRECT:\/admin\/prodotti\?salvato=1/);
  const created = s.db.prepare("SELECT * FROM Prodotto WHERE nome = 'Biscotti'").get();
  assert.equal(created.prezzo_centesimi, 605);
  assert.equal(created.categoria, "biscotti");
  await assert.rejects(s.admin.salvaProdotto(s.prodottoId, {}, productForm({ attivo: null, prezzo: "3.10" })), /REDIRECT:/);
  const changed = s.db.prepare("SELECT * FROM Prodotto WHERE id = ?").get(s.prodottoId);
  assert.equal(changed.prezzo_centesimi, 310);
  assert.equal(changed.immagine, "/prodotti/pane-di-altamura-dop.webp");
  assert.equal(s.prodotti.getProdottoPubblicatoById(s.prodottoId), null);
  assert.equal((await s.adminRead.getProdottoAdmin(s.prodottoId)).attivo, 0);
  await assert.rejects(s.admin.salvaProdotto(s.prodottoId, {}, productForm()), /REDIRECT:/);
  assert.equal(s.prodotti.getProdottoPubblicatoById(s.prodottoId).attivo, 1);
  assert.ok(s.invalidated.includes("/carrello"));
});

test("validazione prodotto rifiuta prezzi imprecisi, scorte e categorie non valide senza scritture", async (t) => {
  const s = setup(t);
  await s.login(1);
  const before = s.db.prepare("SELECT * FROM Prodotto").all();
  for (const values of [{ nome: " " }, { nome: "a".repeat(101) }, { descrizione: "a".repeat(2001) },
    { prezzo: "1.001" }, { prezzo: "0" }, { prezzo: "-1" }, { prezzo: "1e2" }, { prezzo: "10000" },
    { disponibilita: "1.5" }, { disponibilita: "-1" }, { disponibilita: "100001" }, { categoria: "inventata" }]) {
    assert.ok((await s.admin.salvaProdotto(s.prodottoId, {}, productForm(values))).errors);
  }
  assert.ok((await s.admin.salvaProdotto(999, {}, productForm())).message);
  assert.ok((await s.admin.salvaProdotto(-1, {}, productForm())).message);
  assert.deepEqual(s.db.prepare("SELECT * FROM Prodotto").all(), before);
});

test("foto decodificata e ricodificata JPEG, sostituzione e protezione foto nascosta", async (t) => {
  const s = setup(t);
  await s.login(1);
  const png = await sharp({ create: { width: 20, height: 20, channels: 3, background: "red" } }).png().toBuffer();
  const form = productForm();
  form.set("foto", new File([png], "foto.png", { type: "image/png" }));
  await assert.rejects(s.admin.salvaProdotto(s.prodottoId, {}, form), /REDIRECT:/);
  const first = s.db.prepare("SELECT foto, foto_versione FROM Prodotto WHERE id = ?").get(s.prodottoId);
  assert.equal((await sharp(first.foto).metadata()).format, "jpeg");
  assert.equal(first.foto_versione, 1);
  const publicUrl = s.prodotti.getProdottoPubblicatoById(s.prodottoId).immagine;
  await assert.rejects(s.admin.salvaProdotto(s.prodottoId, {}, form), /REDIRECT:/);
  assert.notEqual(s.prodotti.getProdottoPubblicatoById(s.prodottoId).immagine, publicUrl);
  const request = new Request("http://localhost/api/prodotti/1/immagine");
  const context = { params: Promise.resolve({ id: String(s.prodottoId) }) };
  s.jar.clear();
  const publicImage = await s.image.GET(request, context);
  assert.equal(publicImage.status, 200);
  assert.equal(publicImage.headers.get("content-type"), "image/jpeg");
  assert.equal(publicImage.headers.get("x-content-type-options"), "nosniff");
  s.db.prepare("UPDATE Prodotto SET attivo = 0 WHERE id = ?").run(s.prodottoId);
  assert.equal((await s.image.GET(request, context)).status, 404);
  await s.login(2);
  assert.equal((await s.image.GET(request, context)).status, 404);
  await s.login(1);
  assert.equal((await s.image.GET(request, context)).status, 200);
  assert.equal((await s.image.GET(request, { params: Promise.resolve({ id: "abc" }) })).status, 404);
});

test("foto falsa, SVG e file oltre 2 MB vengono rifiutati senza cambiare il prodotto", async (t) => {
  const s = setup(t);
  await s.login(1);
  const before = s.db.prepare("SELECT * FROM Prodotto").all();
  for (const file of [new File(["testo"], "falsa.jpg", { type: "image/jpeg" }),
    new File(['<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>'], "foto.svg", { type: "image/svg+xml" }),
    new File([Buffer.alloc(2 * 1024 * 1024 + 1)], "grande.jpg", { type: "image/jpeg" })]) {
    const form = productForm(); form.set("foto", file);
    assert.ok((await s.admin.salvaProdotto(s.prodottoId, {}, form)).errors.foto);
  }
  assert.deepEqual(s.db.prepare("SELECT * FROM Prodotto").all(), before);
});

test("carrello aggrega quantità, ignora prezzi e proprietario inviati dal browser", async (t) => {
  const s = setup(t);
  await s.login(2);
  const form = cartForm(s.prodottoId, 2); form.set("prezzo_centesimi", "1"); form.set("utente_id", "3");
  assert.equal((await s.cart.aggiungiAlCarrello({}, form)).success, true);
  assert.equal((await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId))).success, true);
  assert.equal(s.db.prepare("SELECT COUNT(*) AS n FROM Carrello").get().n, 1);
  assert.equal((await s.cartRead.getCarrello()).totaleCentesimi, 750);
  await s.login(3);
  assert.equal((await s.cartRead.getCarrello()).righe.length, 0);
  assert.ok(!(await s.cart.modificaRigaCarrello({}, cartForm(s.prodottoId, 1))).success);
  await s.cart.modificaRigaCarrello({}, cartForm(s.prodottoId, 1, "rimuovi"));
  assert.equal(s.db.prepare("SELECT quantita FROM Carrello WHERE utente_id = 2").get().quantita, 3);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId, 2));
  await s.login(2);
  assert.equal((await s.cart.modificaRigaCarrello({}, cartForm(s.prodottoId, 4))).success, true);
  assert.equal((await s.cartRead.getCarrello()).totaleCentesimi, 1000);
  await s.cart.modificaRigaCarrello({}, cartForm(s.prodottoId, "non valido", "rimuovi"));
  assert.equal((await s.cartRead.getCarrello()).righe.length, 0);
  assert.equal(s.db.prepare("SELECT quantita FROM Carrello WHERE utente_id = 3").get().quantita, 2);
});

test("carrello rifiuta quantità non valide, prodotti nascosti e scorte superate anche con aggiunte concorrenti", async (t) => {
  const s = setup(t);
  await s.login(2);
  for (const quantita of ["0", "-1", "1.5", "1e0", "100", "9007199254740992"]) {
    assert.ok(!(await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId, quantita))).success);
  }
  assert.ok(!(await s.cart.aggiungiAlCarrello({}, cartForm(999))).success);
  const results = await Promise.all([s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId, 3)), s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId, 3))]);
  assert.equal(results.filter((r) => r.success).length, 1);
  assert.equal(s.db.prepare("SELECT quantita FROM Carrello").get().quantita, 3);
  assert.equal(s.db.prepare("SELECT disponibilita FROM Prodotto").get().disponibilita, 5);
  s.db.prepare("UPDATE Prodotto SET attivo = 0").run();
  assert.ok(!(await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId))).success);
  assert.ok(!(await s.cart.modificaRigaCarrello({}, cartForm(s.prodottoId))).success);
  assert.ok((await s.cartRead.getCarrello()).righe[0].problema);
  await s.cart.modificaRigaCarrello({}, cartForm(s.prodottoId, 1, "rimuovi"));
  assert.equal((await s.cartRead.getCarrello()).righe.length, 0);
});

test("carrello rilegge prezzi e scorte; sessioni assenti/scadute bloccano lettura e scrittura", async (t) => {
  const s = setup(t);
  await assert.rejects(s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId)), /REDIRECT:\/login/);
  await assert.rejects(s.cartRead.getCarrello(), /REDIRECT:\/login/);
  await s.login(2);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId, 3));
  s.db.prepare("UPDATE Prodotto SET prezzo_centesimi = 310, disponibilita = 2").run();
  const cart = await s.cartRead.getCarrello();
  assert.equal(cart.totaleCentesimi, 930);
  assert.match(cart.righe[0].problema, /riduci/);
  assert.ok(!(await s.cart.modificaRigaCarrello({}, cartForm(s.prodottoId, 3))).success);
  assert.equal((await s.cart.modificaRigaCarrello({}, cartForm(s.prodottoId, 2))).success, true);
  assert.equal((await s.cartRead.getCarrello()).righe[0].problema, null);
  s.db.prepare("UPDATE Prodotto SET disponibilita = 0").run();
  assert.match((await s.cartRead.getCarrello()).righe[0].problema, /esaurito/);
  s.db.prepare("UPDATE Sessione SET expires_at = 0").run();
  await assert.rejects(s.cartRead.getCarrello(), /REDIRECT:\/login/);
  await assert.rejects(s.cart.modificaRigaCarrello({}, cartForm(s.prodottoId, 1, "rimuovi")), /REDIRECT:\/login/);
  assert.equal(s.db.prepare("SELECT quantita FROM Carrello").get().quantita, 2);
});

async function checkoutForm(s, values = {}) {
  const riepilogo = await s.ordini.getRiepilogoCheckout();
  const form = new FormData();
  for (const [key, value] of Object.entries({
    token: require('node:crypto').randomUUID(), impronta: riepilogo.impronta,
    nominativo: 'Cliente Test', telefono: '+39 3331234567',
    indirizzo: 'Via Roma', numero_civico: '12/a', cap: '00100', citta: 'Roma', provincia: 'rm', ...values,
  })) form.set(key, value);
  return form;
}

test('checkout atomico, prezzi storici, doppio invio e isolamento degli ordini', async (t) => {
  const s = setup(t);
  await s.login(2);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId, '2'));
  const form = await checkoutForm(s, { utente_id: '3', totale_centesimi: '1' });
  await assert.rejects(s.checkout.confermaOrdine({}, form), /REDIRECT:\/area-privata\/ordini\/1/);
  await assert.rejects(s.checkout.confermaOrdine({}, form), /REDIRECT:\/area-privata\/ordini\/1/);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM Ordine').get().n, 1);
  assert.equal(s.db.prepare('SELECT disponibilita FROM Prodotto').get().disponibilita, 3);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM Carrello').get().n, 0);
  assert.equal((await s.ordini.getOrdine(1)).ordine.totale_centesimi, 500);
  s.db.prepare("UPDATE Prodotto SET prezzo_centesimi = 900, nome = 'Nuovo nome', attivo = 0").run();
  const storico = await s.ordini.getOrdine(1);
  assert.equal(storico.righe[0].nome, 'Pane');
  assert.equal(storico.righe[0].prezzo_centesimi, 250);
  assert.equal(storico.ordine.indirizzo, 'Via Roma');
  assert.equal(storico.ordine.numero_civico, '12/A');
  assert.equal(storico.ordine.cap, '00100');
  assert.equal(storico.ordine.citta, 'Roma');
  assert.equal(storico.ordine.provincia, 'RM');
  s.migrate();
  assert.equal((await s.ordini.getOrdine(1)).ordine.indirizzo, 'Via Roma');
  await s.login(3);
  assert.equal(await s.ordini.getOrdine(1), null);
  assert.equal((await s.ordini.getOrdini()).length, 0);
  s.jar.clear();
  await assert.rejects(s.checkout.confermaOrdine({}, form), /REDIRECT:\/login/);
  await assert.rejects(s.ordini.getOrdini(), /REDIRECT:\/login/);
  await assert.rejects(s.ordini.getOrdine(1), /REDIRECT:\/login/);
});

test('checkout rifiuta dati invalidi, carrello vuoto e riepilogo superato', async (t) => {
  const s = setup(t);
  await s.login(2);
  assert.ok((await s.checkout.confermaOrdine({}, await checkoutForm(s))).message);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId));
  for (const values of [{ nominativo: 'x' }, { telefono: 'abc' }, { token: '' }, { impronta: '' },
    { indirizzo: '' }, { indirizzo: 'x'.repeat(201) }, { numero_civico: '' }, { numero_civico: 'abc' }, { numero_civico: '1'.repeat(21) }, { citta: '' }, { cap: '100' }, { cap: 'abcde' }, { provincia: 'Roma' }]) {
    assert.ok((await s.checkout.confermaOrdine({}, await checkoutForm(s, values))).message);
  }
  const form = await checkoutForm(s);
  s.db.prepare('UPDATE Prodotto SET prezzo_centesimi = 300').run();
  assert.match((await s.checkout.confermaOrdine({}, form)).message, /cambiati/);
  const aggiornato = await checkoutForm(s);
  await s.cart.modificaRigaCarrello({}, cartForm(s.prodottoId, '2'));
  assert.match((await s.checkout.confermaOrdine({}, aggiornato)).message, /cambiati/);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM Ordine').get().n, 0);
  assert.equal(s.db.prepare('SELECT disponibilita FROM Prodotto').get().disponibilita, 5);
});

test('due clienti competono per le ultime scorte senza venderle due volte', async (t) => {
  const s = setup(t);
  await s.login(2);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId, '5'));
  const primo = await checkoutForm(s);
  await s.login(3);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId, '5'));
  const secondo = await checkoutForm(s);
  await assert.rejects(s.checkout.confermaOrdine({}, secondo), /REDIRECT:/);
  await s.login(2);
  assert.match((await s.checkout.confermaOrdine({}, primo)).message, /disponibili/);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM Ordine').get().n, 1);
  assert.equal(s.db.prepare('SELECT disponibilita FROM Prodotto').get().disponibilita, 0);
  assert.equal(s.db.prepare('SELECT quantita FROM Carrello WHERE utente_id = 2').get().quantita, 5);
});

test('errore durante la scrittura annulla ordine, righe e decremento scorte', async (t) => {
  const s = setup(t);
  await s.login(2);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId, '2'));
  const form = await checkoutForm(s);
  s.db.exec("CREATE TRIGGER simula_errore BEFORE INSERT ON RigaOrdine BEGIN SELECT RAISE(ABORT, 'errore simulato'); END");
  await assert.rejects(s.checkout.confermaOrdine({}, form), /errore simulato/);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM Ordine').get().n, 0);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM RigaOrdine').get().n, 0);
  assert.equal(s.db.prepare('SELECT disponibilita FROM Prodotto').get().disponibilita, 5);
  assert.equal(s.db.prepare('SELECT quantita FROM Carrello').get().quantita, 2);
  s.db.exec('DROP TRIGGER simula_errore');
  s.db.prepare('UPDATE Prodotto SET attivo = 0').run();
  assert.match((await s.checkout.confermaOrdine({}, form)).message, /disponibili/);
});

test('ordini amministrativi: autorizzazione, filtri e dettagli riservati', async (t) => {
  const s = setup(t);
  const form = new FormData(); form.set('stato_attuale', 'ricevuto'); form.set('stato_nuovo', 'in_preparazione');
  await assert.rejects(s.adminOrdini.getOrdiniAdmin(), /REDIRECT:\/login/);
  await assert.rejects(s.adminOrdini.getOrdineAdmin(1), /REDIRECT:\/login/);
  await assert.rejects(s.statiOrdini.aggiornaStatoOrdine(1, {}, form), /REDIRECT:\/login/);
  await s.login(2);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId));
  await assert.rejects(s.checkout.confermaOrdine({}, await checkoutForm(s)), /REDIRECT:/);
  await assert.rejects(s.adminOrdini.getOrdiniAdmin(), /REDIRECT:\/area-privata/);
  await assert.rejects(s.adminOrdini.getOrdineAdmin(1), /REDIRECT:\/area-privata/);
  await assert.rejects(s.statiOrdini.aggiornaStatoOrdine(1, {}, form), /REDIRECT:\/area-privata/);
  await s.login(1);
  assert.equal((await s.adminOrdini.getOrdiniAdmin('ricevuto')).length, 1);
  assert.equal((await s.adminOrdini.getOrdiniAdmin('completato')).length, 0);
  assert.equal((await s.adminOrdini.getOrdiniAdmin("' OR 1=1 --")).length, 1);
  const detail = await s.adminOrdini.getOrdineAdmin(1);
  assert.equal(detail.ordine.username, 'cliente-a');
  assert.equal(detail.ordine.indirizzo, 'Via Roma');
  assert.equal(detail.ordine.numero_civico, '12/A');
  assert.equal(detail.righe[0].nome, 'Pane');
  assert.equal(await s.adminOrdini.getOrdineAdmin(NaN), null);
  assert.equal(await s.adminOrdini.getOrdineAdmin(999), null);
});

test('stati ordine avanzano in sequenza, rifiutano duplicati e non toccano scorte o prezzi', async (t) => {
  const s = setup(t);
  await s.login(2);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId, '2'));
  await assert.rejects(s.checkout.confermaOrdine({}, await checkoutForm(s)), /REDIRECT:/);
  await s.login(1);
  const change = (old, next, id = 1) => {
    const form = new FormData(); form.set('stato_attuale', old); form.set('stato_nuovo', next);
    return s.statiOrdini.aggiornaStatoOrdine(id, {}, form);
  };
  assert.ok(!(await change('ricevuto', 'completato')).success);
  assert.ok(!(await change('ricevuto', 'inventato')).success);
  assert.ok(!(await change('ricevuto', 'in_preparazione', 999)).success);
  assert.ok(!(await change('ricevuto', 'in_preparazione', -1)).success);
  await assert.rejects(change('ricevuto', 'in_preparazione'), /REDIRECT:\/admin\/ordini\/1\?aggiornato=1/);
  assert.ok(!(await change('ricevuto', 'in_preparazione')).success);
  assert.ok(!(await change('in_preparazione', 'ricevuto')).success);
  await assert.rejects(change('in_preparazione', 'pronto'), /REDIRECT:/);
  await assert.rejects(change('pronto', 'completato'), /REDIRECT:/);
  assert.ok(!(await change('completato', 'ricevuto')).success);
  assert.equal(s.db.prepare('SELECT disponibilita FROM Prodotto').get().disponibilita, 3);
  assert.equal(s.db.prepare('SELECT totale_centesimi FROM Ordine').get().totale_centesimi, 500);
  assert.ok(s.invalidated.includes('/area-privata/ordini/1'));
  await s.login(2);
  assert.equal((await s.ordini.getOrdine(1)).ordine.stato, 'completato');
});

function reviewForm(values = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ voto: '5', commento: 'Ottimo pane', operazione: 'salva', ...values })) form.set(key, value);
  return form;
}

test('recensioni richiedono un acquisto proprio consegnato e un prodotto pubblicato', async (t) => {
  const s = setup(t);
  const save = () => s.recensioniActions.gestisciRecensione(s.prodottoId, {}, reviewForm());
  await assert.rejects(save(), /REDIRECT:\/login/);
  await s.login(2);
  assert.ok((await save()).message);
  await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId));
  await assert.rejects(s.checkout.confermaOrdine({}, await checkoutForm(s)), /REDIRECT:/);
  for (const stato of ['ricevuto', 'in_preparazione', 'pronto']) {
    s.db.prepare('UPDATE Ordine SET stato = ?').run(stato);
    assert.equal((await s.recensioni.getRecensioniProdotto(s.prodottoId)).puoRecensire, false);
    assert.ok((await save()).message);
  }
  s.db.prepare("UPDATE Ordine SET stato = 'completato'").run();
  await s.login(3);
  assert.ok((await save()).message);
  await s.login(2);
  assert.equal((await s.recensioni.getRecensioniProdotto(s.prodottoId)).puoRecensire, true);
  s.db.prepare('UPDATE Prodotto SET attivo = 0').run();
  assert.ok((await save()).message);
  assert.equal((await s.recensioni.getRecensioniProdotto(s.prodottoId)).puoRecensire, false);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM Recensione').get().n, 0);
});

test('recensioni: validazione, aggiornamento senza duplicati, media e cancellazione del solo proprietario', async (t) => {
  const s = setup(t);
  for (const uid of [2, 3]) {
    await s.login(uid);
    await s.cart.aggiungiAlCarrello({}, cartForm(s.prodottoId));
    await assert.rejects(s.checkout.confermaOrdine({}, await checkoutForm(s)), /REDIRECT:/);
  }
  s.db.prepare("UPDATE Ordine SET stato = 'completato'").run();
  await s.login(2);
  for (const values of [{voto:'0'}, {voto:'6'}, {voto:'2.5'}, {commento:'  '}, {commento:'x'.repeat(1001)}, {operazione:'altro'}]) {
    assert.ok((await s.recensioniActions.gestisciRecensione(s.prodottoId, {}, reviewForm(values))).message);
  }
  assert.ok((await s.recensioniActions.gestisciRecensione(-1, {}, reviewForm())).message);
  await assert.rejects(s.recensioniActions.gestisciRecensione(s.prodottoId, {}, reviewForm({utente_id:'3'})), /REDIRECT:/);
  await assert.rejects(s.recensioniActions.gestisciRecensione(s.prodottoId, {}, reviewForm({voto:'3',commento:'Buono'})), /REDIRECT:/);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM Recensione').get().n, 1);
  assert.equal(s.db.prepare('SELECT utente_id FROM Recensione').get().utente_id, 2);
  await s.login(3);
  await assert.rejects(s.recensioniActions.gestisciRecensione(s.prodottoId, {}, reviewForm({operazione:'elimina',utente_id:'2'})), /REDIRECT:/);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM Recensione').get().n, 1);
  await assert.rejects(s.recensioniActions.gestisciRecensione(s.prodottoId, {}, reviewForm()), /REDIRECT:/);
  s.jar.clear();
  const pubblico = await s.recensioni.getRecensioniProdotto(s.prodottoId);
  assert.equal(pubblico.media, 4);
  assert.equal(pubblico.recensioni.length, 2);
  assert.equal(pubblico.propria, null);
  assert.equal(pubblico.puoRecensire, false);
  await s.login(2);
  assert.equal((await s.recensioni.getRecensioniProdotto(s.prodottoId)).propria.voto, 3);
  await assert.rejects(s.recensioniActions.gestisciRecensione(s.prodottoId, {}, reviewForm({operazione:'elimina',voto:'',commento:''})), /REDIRECT:/);
  assert.equal((await s.recensioni.getRecensioniProdotto(s.prodottoId)).media, 5);
  s.db.prepare('UPDATE Prodotto SET attivo=0').run();
  assert.equal((await s.recensioni.getRecensioniProdotto(s.prodottoId)).recensioni.length, 0);
});

function ticketForm(values = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ oggetto: 'Informazioni ordine', messaggio: 'Vorrei informazioni sulla consegna.', token: require('node:crypto').randomUUID(), ...values })) form.set(key, value);
  return form;
}

test('ticket: creazione atomica, validazione e invio duplicato', async (t) => {
  const s = setup(t);
  await assert.rejects(s.assistenzaActions.apriTicket({}, ticketForm()), /REDIRECT:\/login/);
  await assert.rejects(s.assistenza.getTicketUtente(), /REDIRECT:\/login/);
  await s.login(2);
  for (const values of [{oggetto:' '},{oggetto:'x'.repeat(121)},{messaggio:''},{messaggio:'x'.repeat(3001)},{token:'x'}]) {
    assert.ok((await s.assistenzaActions.apriTicket({}, ticketForm(values))).message);
  }
  s.db.exec("CREATE TRIGGER errore_ticket BEFORE INSERT ON MessaggioTicket BEGIN SELECT RAISE(ABORT, 'errore simulato'); END");
  await assert.rejects(s.assistenzaActions.apriTicket({}, ticketForm()), /errore simulato/);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM Ticket').get().n, 0);
  s.db.exec('DROP TRIGGER errore_ticket');
  const form = ticketForm({utente_id:'3',stato:'chiuso',da_admin:'1'});
  for (let i=0; i<2; i++) await assert.rejects(s.assistenzaActions.apriTicket({}, form), /REDIRECT:\/area-privata\/assistenza\/1/);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM Ticket').get().n, 1);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM MessaggioTicket').get().n, 1);
  const ticket = (await s.assistenza.getDettaglioTicket(1)).ticket;
  assert.equal(ticket.utente_id, 2); assert.equal(ticket.stato, 'aperto');
  assert.equal((await s.assistenza.getDettaglioTicket(1)).messaggi[0].da_admin, 0);
  s.migrate();
  assert.equal((await s.assistenza.getTicketUtente()).length, 1);
});

test('ticket: cliente non legge o modifica richieste altrui e non assume ruolo admin', async (t) => {
  const s = setup(t);
  await s.login(2);
  await assert.rejects(s.assistenzaActions.apriTicket({}, ticketForm()), /REDIRECT:/);
  await s.login(3);
  assert.equal((await s.assistenza.getTicketUtente()).length, 0);
  assert.equal(await s.assistenza.getDettaglioTicket(1), null);
  assert.equal(await s.assistenza.getDettaglioTicket(NaN), null);
  assert.ok((await s.assistenzaActions.rispondiTicket(1, {}, ticketForm({ruolo:'admin',autore_id:'2'}))).message);
  await assert.rejects(s.assistenza.getDettaglioTicket(1, true), /REDIRECT:\/area-privata/);
  await assert.rejects(s.assistenza.getTicketAdmin(), /REDIRECT:\/area-privata/);
  await assert.rejects(s.assistenzaActions.cambiaStatoTicket(1, {}, ticketForm({stato:'chiuso'})), /REDIRECT:\/area-privata/);
  assert.equal(s.db.prepare('SELECT COUNT(*) AS n FROM MessaggioTicket').get().n, 1);
  s.jar.clear();
  await assert.rejects(s.assistenzaActions.rispondiTicket(1, {}, ticketForm()), /REDIRECT:\/login/);
});

test('assistenza: conversazione, chiusura e riapertura con protezione dai reinvii', async (t) => {
  const s = setup(t);
  await s.login(2);
  await assert.rejects(s.assistenzaActions.apriTicket({}, ticketForm()), /REDIRECT:/);
  const rispostaCliente = ticketForm({messaggio:'Aggiungo il riferimento ordine.',da_admin:'1'});
  for (let i=0; i<2; i++) await assert.rejects(s.assistenzaActions.rispondiTicket(1, {}, rispostaCliente), /REDIRECT:/);
  assert.equal((await s.assistenza.getDettaglioTicket(1)).messaggi[1].da_admin, 0);
  assert.ok((await s.assistenzaActions.rispondiTicket(1, {}, ticketForm({messaggio:' '}))).message);
  await s.login(1);
  assert.equal((await s.assistenza.getTicketAdmin('aperto')).length, 1);
  assert.equal((await s.assistenza.getTicketAdmin('chiuso')).length, 0);
  const risposta = ticketForm({messaggio:'La consegna e prevista domani.'});
  for (let i=0; i<2; i++) await assert.rejects(s.assistenzaActions.rispondiTicket(1, {}, risposta), /REDIRECT:\/admin\/assistenza\/1/);
  assert.equal((await s.assistenza.getDettaglioTicket(1, true)).messaggi.length, 3);
  assert.equal((await s.assistenza.getDettaglioTicket(1, true)).messaggi[2].da_admin, 1);
  assert.ok((await s.assistenzaActions.cambiaStatoTicket(-1, {}, ticketForm({stato:'chiuso'}))).message);
  assert.ok((await s.assistenzaActions.cambiaStatoTicket(1, {}, ticketForm({stato:'altro'}))).message);
  await assert.rejects(s.assistenzaActions.cambiaStatoTicket(1, {}, ticketForm({stato:'chiuso'})), /REDIRECT:/);
  assert.ok((await s.assistenzaActions.cambiaStatoTicket(1, {}, ticketForm({stato:'chiuso'}))).message);
  await s.login(2);
  assert.equal((await s.assistenza.getDettaglioTicket(1)).ticket.stato, 'chiuso');
  assert.ok((await s.assistenzaActions.rispondiTicket(1, {}, ticketForm())).message);
  await s.login(1);
  assert.ok((await s.assistenzaActions.rispondiTicket(1, {}, ticketForm())).message);
  await assert.rejects(s.assistenzaActions.cambiaStatoTicket(1, {}, ticketForm({stato:'aperto'})), /REDIRECT:/);
  await s.login(2);
  await assert.rejects(s.assistenzaActions.rispondiTicket(1, {}, ticketForm()), /REDIRECT:/);
  assert.equal((await s.assistenza.getDettaglioTicket(1)).messaggi.length, 4);
  assert.ok(s.invalidated.includes('/admin/assistenza/1'));
  assert.ok(s.invalidated.includes('/area-privata/assistenza/1'));
});
