/* Test dei moduli reali con SQLite in memoria e cookie/redirect Next.js simulati. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { createHash } = require("node:crypto");
const vm = require("node:vm");
const ts = require("typescript");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");

function loadModule(file, dependencies, environment = "test") {
  const compiled = ts.transpileModule(readFileSync(resolve(file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const exports = {};
    vm.runInNewContext(compiled, {
    exports,
    Buffer,
    Error,
    require: (name) => Object.hasOwn(dependencies, name) ? dependencies[name] : require(name),
    process: { cwd: () => process.cwd(), env: { NODE_ENV: environment } },
  }, { filename: file });
  return exports;
}

function setup(t, environment) {
  const db = new Database(":memory:");
  t.after(() => db.close());
  loadModule("lib/db.ts", {
    "better-sqlite3": function () { return db; },
    fs: { existsSync: () => true },
  });
  const user = db.prepare("INSERT INTO Utente (username, password_hash) VALUES (?, ?)")
    .run("utente-test", bcrypt.hashSync("password-test", 4));
  const userId = Number(user.lastInsertRowid);
  const jar = new Map();
  const options = new Map();
  const cookieStore = {
    get: (name) => jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name, value, settings) => { jar.set(name, value); options.set(name, settings); },
    delete: (name) => jar.delete(name),
  };
  const session = loadModule("lib/session.ts", {
    "@/lib/db": db,
    "next/headers": { cookies: async () => cookieStore },
  }, environment);
  const redirect = (url) => { throw new Error(`REDIRECT:${url}`); };
  const login = loadModule("app/login/actions.ts", {
    "@/lib/db": db, "@/lib/session": session, "next/navigation": { redirect },
  });
    const logout = loadModule("app/area-privata/actions.ts", {
    "@/lib/session": session,
    "next/navigation": { redirect },
  });

  const registrazione = loadModule("app/registrati/actions.ts", {
    "@/lib/db": db,
    "next/navigation": { redirect },
  });

  return {
    db,
    userId,
    jar,
    options,
    session,
    login,
    logout,
    registrazione,
  };
}

test("login valido, hash nel database e cookie sicuro in produzione", async (t) => {
  const { db, userId, jar, options, session, login } = setup(t, "production");
  jar.set("session_user_id", String(userId));
  const form = new FormData();
  form.set("username", "utente-test");
  form.set("password", "password-test");
  await assert.rejects(login.loginUtente({}, form),/REDIRECT:\/area-privata/,);
  const token = jar.get("session_token");
  assert.match(token, /^[a-f0-9]{64}$/);
  const row = db.prepare("SELECT * FROM Sessione").get();
  assert.equal(row.token_hash, createHash("sha256").update(token).digest("hex"));
  assert.notEqual(row.token_hash, token);
  assert.equal(await session.getUserIdDaSessione(), userId);
  assert.equal(jar.has("session_user_id"), false);
  const settings = options.get("session_token");
  assert.equal(settings.httpOnly, true);
  assert.equal(settings.secure, true);
  assert.equal(settings.sameSite, "lax");
  assert.equal(settings.path, "/");
  assert.equal(settings.maxAge, 604800);
  assert.equal(settings.expires.getTime(), row.expires_at);
});

test("credenziali errate non creano sessioni", async (t) => {
  const { db, jar, login } = setup(t);
  for (const username of ["utente-test", "inesistente"]) {
    const form = new FormData();
    form.set("username", username);
    form.set("password", "errata");
    const risultato = await login.loginUtente({}, form);assert.equal(risultato.message, "Credenziali non valide");
  }
  assert.equal(jar.size, 0);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Sessione").get().n, 0);
});

test("assenza cookie, vecchio ID, token malformato e token alterato sono rifiutati", async (t) => {
  const { userId, jar, session } = setup(t);
  assert.equal(await session.getUserIdDaSessione(), null);
  jar.set("session_user_id", String(userId));
  assert.equal(await session.getUserIdDaSessione(), null);
  for (const invalid of [String(userId), "1abc", "", "a".repeat(64)]) {
    jar.set("session_token", invalid);
    assert.equal(await session.getUserIdDaSessione(), null);
  }
  await session.creaSessione(userId);
  const token = jar.get("session_token");
  jar.set("session_token", (token[0] === "a" ? "b" : "a") + token.slice(1));
  assert.equal(await session.getUserIdDaSessione(), null);
});

test("sessione scaduta rifiutata e pulita al nuovo login", async (t) => {
  const { db, userId, session } = setup(t);
  await session.creaSessione(userId);
  db.prepare("UPDATE Sessione SET expires_at = ?").run(Date.now() - 1);
  assert.equal(await session.getUserIdDaSessione(), null);
  await session.creaSessione(userId);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Sessione").get().n, 1);
  assert.equal(await session.getUserIdDaSessione(), userId);
});

test("logout revoca il token anche se riutilizzato e può essere ripetuto", async (t) => {
  const { db, userId, jar, session, logout } = setup(t);
  await session.creaSessione(userId);
  const oldToken = jar.get("session_token");
  await assert.rejects(logout.logoutUtente(), /REDIRECT:\/login/);
  assert.equal(jar.has("session_token"), false);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Sessione").get().n, 0);
  jar.set("session_token", oldToken);
  assert.equal(await session.getUserIdDaSessione(), null);
  await assert.rejects(logout.logoutUtente(), /REDIRECT:\/login/);
});

test("nuovo login ruota il token del browser e conserva le altre sessioni", async (t) => {
  const { db, userId, jar, session } = setup(t);
  await session.creaSessione(userId);
  const otherDevice = jar.get("session_token");
  jar.clear();
  await session.creaSessione(userId);
  const previous = jar.get("session_token");
  await session.creaSessione(userId);
  assert.notEqual(jar.get("session_token"), previous);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Sessione").get().n, 2);
  jar.set("session_token", previous);
  assert.equal(await session.getUserIdDaSessione(), null);
  jar.set("session_token", otherDevice);
  assert.equal(await session.getUserIdDaSessione(), userId);
});

test("utente eliminato perde la sessione e la foreign key rifiuta utenti inesistenti", async (t) => {
  const { db, userId, session } = setup(t);
  await session.creaSessione(userId);
  db.prepare("DELETE FROM Utente WHERE id = ?").run(userId);
  assert.equal(await session.getUserIdDaSessione(), null);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM Sessione").get().n, 0);
  await assert.rejects(session.creaSessione(userId), /FOREIGN KEY/);
});

test("registrazione non valida restituisce errori senza creare utenti", async (t) => {
  const { db, registrazione } = setup(t);

  const utentiPrima = db
    .prepare("SELECT COUNT(*) AS totale FROM Utente")
    .get().totale;

  const form = new FormData();
  form.set("username", "ab");
  form.set("password", "123");

  const risultato = await registrazione.registraUtente({}, form);

  assert.equal(
    risultato.errors?.username,
    "Lo username deve contenere da 3 a 30 caratteri",
  );

  assert.equal(
    risultato.errors?.password,
    "La password deve contenere almeno 6 caratteri",
  );

  const utentiDopo = db
    .prepare("SELECT COUNT(*) AS totale FROM Utente")
    .get().totale;

  assert.equal(utentiDopo, utentiPrima);
});

test("registrazione valida salva l'hash e reindirizza al login", async (t) => {
  const { db, registrazione } = setup(t);

  const form = new FormData();
  form.set("username", "  nuovo-utente  ");
  form.set("password", "password-prova");

  await assert.rejects(
    registrazione.registraUtente({}, form),
    /^Error: REDIRECT:\/login\?registrato=1$/,
  );

  const utente = db
    .prepare("SELECT username, password_hash FROM Utente WHERE username = ?")
    .get("nuovo-utente");

  assert.ok(utente);
  assert.equal(utente.username, "nuovo-utente");
  assert.notEqual(utente.password_hash, "password-prova");

  const passwordCorretta = await bcrypt.compare(
    "password-prova",
    utente.password_hash,
  );

  assert.equal(passwordCorretta, true);
});

test("username duplicato non crea utenti e non modifica l'account esistente", async (t) => {
  const { db, registrazione } = setup(t);

  // setup crea già l'account "utente-test".
  const utentePrima = db
    .prepare("SELECT id, password_hash FROM Utente WHERE username = ?")
    .get("utente-test");

  const utentiPrima = db
    .prepare("SELECT COUNT(*) AS totale FROM Utente")
    .get().totale;

  const form = new FormData();
  form.set("username", "utente-test");
  form.set("password", "password-diversa");

  const risultato = await registrazione.registraUtente({}, form);

  assert.equal(risultato.errors?.username, "Username già in uso");

  const utentiDopo = db
    .prepare("SELECT COUNT(*) AS totale FROM Utente")
    .get().totale;

  const utenteDopo = db
    .prepare("SELECT id, password_hash FROM Utente WHERE username = ?")
    .get("utente-test");

  assert.equal(utentiDopo, utentiPrima);
  assert.equal(utenteDopo.id, utentePrima.id);
  assert.equal(utenteDopo.password_hash, utentePrima.password_hash);
});


test("registrazioni contemporanee creano un solo account", async (t) => {
  const { db, registrazione } = setup(t);

  function creaForm() {
    const form = new FormData();
    form.set("username", "utente-concorrente");
    form.set("password", "password-prova");
    return form;
  }

  // Avvia entrambe le registrazioni senza aspettare la prima.
  const risultati = await Promise.allSettled([
    registrazione.registraUtente({}, creaForm()),
    registrazione.registraUtente({}, creaForm()),
  ]);

  const successi = risultati.filter(
    (risultato) =>
      risultato.status === "rejected" &&
      risultato.reason?.message === "REDIRECT:/login?registrato=1",
  );

  const duplicati = risultati.filter(
    (risultato) =>
      risultato.status === "fulfilled" &&
      risultato.value.errors?.username === "Username già in uso",
  );

  assert.equal(successi.length, 1);
  assert.equal(duplicati.length, 1);

  const account = db
    .prepare("SELECT COUNT(*) AS totale FROM Utente WHERE username = ?")
    .get("utente-concorrente");

  assert.equal(account.totale, 1);
});