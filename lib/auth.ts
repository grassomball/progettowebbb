import "server-only";

import db from "@/lib/db";
import { getUserIdDaSessione } from "@/lib/session";
import { redirect } from "next/navigation";

type UtenteAutenticato = {
  id: number;
  username: string;
  ruolo: "cliente" | "admin";
};

export async function getUtenteAutenticato(): Promise<UtenteAutenticato | null> {
  const userId = await getUserIdDaSessione();

  if (userId === null) {
    return null;
  }

  const utente = db
    .prepare("SELECT id, username, ruolo FROM Utente WHERE id = ?")
    .get(userId) as UtenteAutenticato | undefined;

  return utente ?? null;
}

export async function richiediAdmin(): Promise<UtenteAutenticato> {
  const utente = await getUtenteAutenticato();

  if (!utente) {
    redirect("/login");
  }

  if (utente.ruolo !== "admin") {
    redirect("/area-privata");
  }

  return utente;
}

export async function richiediUtente(): Promise<UtenteAutenticato> {
  const utente = await getUtenteAutenticato();
  if (!utente) redirect("/login");
  return utente;
}
