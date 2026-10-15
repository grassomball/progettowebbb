// Verifica di integrazione facoltativa: avviare prima npm run dev nella stessa cartella.
// Usa esclusivamente account e prodotti temporanei e li elimina anche in caso di errore.
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const Database = require("better-sqlite3");

const base = new URL(process.env.TEST_BASE_URL || "http://localhost:3000");
if (!["localhost", "127.0.0.1", "[::1]"].includes(base.hostname)) throw new Error("Usare soltanto un server locale di test.");
const db = new Database("data/app.sqlite", { fileMustExist: true });
db.pragma("foreign_keys = ON");
const tag = randomBytes(6).toString("hex");
const usernames = [`http-cliente-${tag}`, `http-admin-${tag}`, `http-altro-${tag}`];
const prodottoNome = `HTTP pane ${tag}`;
const password = randomBytes(18).toString("hex");
const decode = (s) => s.replaceAll("&quot;", '"').replaceAll("&#x27;", "'").replaceAll("&amp;", "&").replaceAll("&lt;", "<").replaceAll("&gt;", ">");

function browser() {
  const cookies = new Map();
  return {
    cookies,
    async request(path, options = {}) {
      const res = await fetch(new URL(path, base), {
        ...options, redirect: "manual", signal: AbortSignal.timeout(30000),
        headers: { Cookie: [...cookies].map(([k, v]) => `${k}=${v}`).join("; "), ...options.headers },
      });
      for (const header of res.headers.getSetCookie()) {
        const pair = header.split(";")[0];
        const index = pair.indexOf("=");
        const name = pair.slice(0, index), value = pair.slice(index + 1);
        if (value) cookies.set(name, value); else cookies.delete(name);
      }
      return { status: res.status, location: res.headers.get("location"), html: await res.text() };
    },
    async submit(path, field, values = {}) {
      const page = await this.request(path);
      assert.equal(page.status, 200, `GET ${path}`);
      const formHtml = [...page.html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map((m) => m[0])
        .find((form) => field ? form.includes(`name="${field}"`) : form.includes("Esci"));
      assert.ok(formHtml, `Modulo ${field || "logout"} in ${path}`);
      const form = new FormData();
      for (const [input] of formHtml.matchAll(/<input\b[^>]*>/g)) {
        // Un input file vuoto non va trasformato in una stringa: il browser invia un File.
        if (/\btype="file"/.test(input)) continue;
        const name = input.match(/\bname="([^"]*)"/), value = input.match(/\bvalue="([^"]*)"/);
        if (name) form.append(decode(name[1]), decode(value?.[1] ?? ""));
      }
      for (const [name, value] of Object.entries(values)) form.set(name, value);
      return this.request(path, { method: "POST", headers: { Origin: base.origin }, body: form });
    },
  };
}

function redirect(res, path) {
  assert.equal(res.status, 303, `Invio verso ${path}`);
  assert.equal(res.location, path);
}
function ok(nome) { console.log(`OK: ${nome}`); }

async function run() {
  const cliente = browser(), admin = browser(), altro = browser(), ospite = browser();
  assert.equal((await ospite.request("/catalogo")).status, 200);
  for (const path of ["/carrello", "/checkout", "/area-privata/ordini", "/admin", "/admin/assistenza"]) {
    const res = await ospite.request(path);
    assert.equal(res.location, "/login", path);
  }
  ok("pagine pubbliche e protezione delle pagine private");

  const invalid = await cliente.submit("/registrati", "username", { username: "x", password: "x" });
  assert.equal(invalid.status, 200); assert.ok(invalid.html.includes("da 3 a 30 caratteri"));
  for (const [i, session] of [cliente, admin, altro].entries()) {
    redirect(await session.submit("/registrati", "username", { username: usernames[i], password }), "/login?registrato=1");
  }
  const wrong = await cliente.submit("/login", "username", { username: usernames[0], password: "sbagliata" });
  assert.equal(wrong.status, 200); assert.ok(wrong.html.includes("Credenziali non valide"));
  for (const [i, session] of [cliente, admin, altro].entries()) {
    redirect(await session.submit("/login", "username", { username: usernames[i], password }), "/area-privata");
    assert.ok(session.cookies.has("session_token"));
  }
  const uid = db.prepare("SELECT id FROM Utente WHERE username = ?").get(usernames[0]).id;
  db.prepare("UPDATE Utente SET ruolo = 'admin' WHERE username = ?").run(usernames[1]);
  assert.equal((await cliente.request("/admin/ordini")).location, "/area-privata");
  ok("registrazione, errori di validazione, login e separazione dei ruoli");

  redirect(await admin.submit("/admin/prodotti/nuovo", "nome", {
    nome: prodottoNome, descrizione: "Prodotto temporaneo per la verifica HTTP", prezzo: "2,50", disponibilita: "3", categoria: "pane", attivo: "on",
  }), "/admin/prodotti?salvato=1");
  const pid = db.prepare("SELECT id FROM Prodotto WHERE nome = ?").get(prodottoNome).id;
  const path = `/catalogo/${pid}`;
  assert.ok((await ospite.request(path)).html.includes(prodottoNome));
  const excess = await cliente.submit(path, "quantita", { prodotto_id: String(pid), quantita: "4" });
  assert.equal(excess.status, 200); assert.ok(excess.html.includes("non disponibile"));
  const added = await cliente.submit(path, "quantita", { prodotto_id: String(pid), quantita: "2" });
  assert.equal(added.status, 200);
  assert.equal(db.prepare("SELECT quantita FROM Carrello WHERE utente_id = ? AND prodotto_id = ?").get(uid, pid).quantita, 2);
  ok("creazione prodotto, controllo scorte e aggiunta al carrello");

  const incomplete = await cliente.submit("/checkout", "nominativo", {
    nominativo: "Cliente HTTP", telefono: "3331234567", indirizzo: "Via Roma", numero_civico: "", cap: "00100", citta: "Roma", provincia: "RM",
  });
  assert.equal(incomplete.status, 200); assert.ok(incomplete.html.includes("Inserisci il numero civico"));
  const ordineRes = await cliente.submit("/checkout", "nominativo", {
    nominativo: "Cliente HTTP", telefono: "3331234567", indirizzo: "Via Roma", numero_civico: "12/A", cap: "00100", citta: "Roma", provincia: "RM",
  });
  const ordine = db.prepare("SELECT * FROM Ordine WHERE utente_id = ?").get(uid);
  assert.ok(ordine); redirect(ordineRes, `/area-privata/ordini/${ordine.id}`);
  assert.equal(ordine.totale_centesimi, 500); assert.equal(ordine.numero_civico, "12/A");
  assert.equal(db.prepare("SELECT disponibilita FROM Prodotto WHERE id = ?").get(pid).disponibilita, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Carrello WHERE utente_id = ?").get(uid).n, 0);
  const foreignOrder = await altro.request(`/area-privata/ordini/${ordine.id}`);
  assert.ok(!foreignOrder.html.includes("Via Roma"));
  assert.ok(!(await cliente.request(path)).html.includes('name="commento"'));
  ok("checkout, indirizzo, totale, scorte, privacy degli ordini e recensioni prima della consegna");

  for (const stato of ["in_preparazione", "pronto", "completato"]) {
    redirect(await admin.submit(`/admin/ordini/${ordine.id}`, "stato_attuale"), `/admin/ordini/${ordine.id}?aggiornato=1`);
    assert.equal(db.prepare("SELECT stato FROM Ordine WHERE id = ?").get(ordine.id).stato, stato);
  }
  const customerOrder = await cliente.request(`/area-privata/ordini/${ordine.id}`);
  assert.ok(customerOrder.html.includes("Consegnato")); assert.ok(customerOrder.html.includes("12/A"));
  redirect(await cliente.submit(path, "commento", { voto: "4", commento: "Pane ottimo <script>alert(1)</script>", operazione: "salva" }), `${path}?recensione=salvata#recensioni`);
  const publicProduct = await ospite.request(path);
  assert.ok(publicProduct.html.includes("Acquisto verificato")); assert.ok(publicProduct.html.includes("&lt;script&gt;"));
  assert.ok(!publicProduct.html.includes("<script>alert(1)</script>"));
  redirect(await cliente.submit(path, "commento", { voto: "5", commento: "Recensione aggiornata", operazione: "salva" }), `${path}?recensione=salvata#recensioni`);
  assert.equal(db.prepare("SELECT voto FROM Recensione WHERE utente_id = ? AND prodotto_id = ?").get(uid, pid).voto, 5);
  redirect(await cliente.submit(path, "commento", { operazione: "elimina" }), `${path}?recensione=eliminata#recensioni`);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Recensione WHERE prodotto_id = ?").get(pid).n, 0);
  ok("avanzamento ordine e pubblicazione, modifica, eliminazione della recensione");

  const opened = await cliente.submit("/area-privata/assistenza", "oggetto", { oggetto: `Ticket HTTP ${tag}`, messaggio: "Ho una domanda sul mio ordine." });
  const tid = db.prepare("SELECT id FROM Ticket WHERE utente_id = ?").get(uid).id;
  redirect(opened, `/area-privata/assistenza/${tid}`);
  assert.ok(!(await altro.request(`/area-privata/assistenza/${tid}`)).html.includes(`Ticket HTTP ${tag}`));
  redirect(await admin.submit(`/admin/assistenza/${tid}`, "messaggio", { messaggio: "Abbiamo preso in carico la richiesta." }), `/admin/assistenza/${tid}#messaggi`);
  assert.ok((await cliente.request(`/area-privata/assistenza/${tid}`)).html.includes("Abbiamo preso in carico"));
  redirect(await admin.submit(`/admin/assistenza/${tid}`, "stato"), `/admin/assistenza/${tid}`);
  assert.ok(!(await cliente.request(`/area-privata/assistenza/${tid}`)).html.includes('name="messaggio"'));
  redirect(await admin.submit(`/admin/assistenza/${tid}`, "stato"), `/admin/assistenza/${tid}`);
  redirect(await cliente.submit(`/area-privata/assistenza/${tid}`, "messaggio", { messaggio: "Grazie per la risposta." }), `/area-privata/assistenza/${tid}#messaggi`);
  ok("assistenza, privacy delle conversazioni, risposta, chiusura e riapertura");

  const oldToken = cliente.cookies.get("session_token");
  redirect(await cliente.submit("/area-privata", null), "/login");
  cliente.cookies.set("session_token", oldToken);
  assert.equal((await cliente.request("/area-privata")).location, "/login");
  db.prepare("UPDATE Sessione SET expires_at = 0 WHERE utente_id = (SELECT id FROM Utente WHERE username = ?)").run(usernames[2]);
  assert.equal((await altro.request("/carrello")).location, "/login");
  ok("logout invalida il token e sessione scaduta rifiutata");
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => {
  try {
    db.transaction(() => {
      for (const username of usernames) {
        const user = db.prepare("SELECT id FROM Utente WHERE username = ?").get(username);
        if (!user) continue;
        db.prepare("DELETE FROM Ticket WHERE utente_id = ?").run(user.id);
        db.prepare("DELETE FROM Ordine WHERE utente_id = ?").run(user.id);
      }
      for (const username of usernames) db.prepare("DELETE FROM Utente WHERE username = ?").run(username);
      db.prepare("DELETE FROM Prodotto WHERE nome = ?").run(prodottoNome);
    }).immediate();
    console.log("Dati temporanei rimossi.");
  } finally { db.close(); }
});
