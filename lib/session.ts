import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import db from "@/lib/db";

const SESSION_COOKIE_NAME = "session_token";
const LEGACY_COOKIE_NAME = "session_user_id";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function creaSessione(userId: number) {
  const cookieStore = await cookies();
  const token = randomBytes(32).toString("hex");
  const now = Date.now();
  const expiresAt = now + SESSION_DURATION_SECONDS * 1000;
  const previousToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Il database conserva solo l'hash del token, non il segreto del cookie.
  db.transaction(() => {
    db.prepare("DELETE FROM Sessione WHERE expires_at <= ?").run(now);
    if (previousToken) {
      db.prepare("DELETE FROM Sessione WHERE token_hash = ?").run(hashToken(previousToken));
    }
    db.prepare(
      "INSERT INTO Sessione (token_hash, utente_id, expires_at) VALUES (?, ?, ?)",
    ).run(hashToken(token), userId, expiresAt);
  })();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
    expires: new Date(expiresAt),
  });
  cookieStore.delete(LEGACY_COOKIE_NAME);
}

export async function getUserIdDaSessione(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // I vecchi cookie numerici e i token malformati non autenticano l'utente.
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;

  const sessione = db.prepare(`
    SELECT Sessione.utente_id
    FROM Sessione
    INNER JOIN Utente ON Utente.id = Sessione.utente_id
    WHERE Sessione.token_hash = ? AND Sessione.expires_at > ?
  `).get(hashToken(token), Date.now()) as 
  { utente_id: number } | undefined;

  return sessione?.utente_id ?? null;
}

export async function distruggiSessione() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    db.prepare("DELETE FROM Sessione WHERE token_hash = ?").run(hashToken(token));
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(LEGACY_COOKIE_NAME);
}
