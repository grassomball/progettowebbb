"use server";

import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { creaSessione } from "@/lib/session";
import { redirect } from "next/navigation";
import type { LoginState } from "@/lib/form-state";

interface Utente {
  id: number;
  username: string;
  password_hash: string;
}

export async function loginUtente(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const usernameValue = formData.get("username");
  const passwordValue = formData.get("password");

  if (
    typeof usernameValue !== "string" ||
    typeof passwordValue !== "string"
  ) {
    return {
      message: "Username e password sono obbligatori",
    };
  }

  // Stesso trattamento dello username usato nella registrazione.
  const username = usernameValue.trim();
  const password = passwordValue;

  const errors: NonNullable<LoginState["errors"]> = {};

  if (username.length === 0) {
    errors.username = "Inserisci lo username";
  }

  if (password.length === 0) {
    errors.password = "Inserisci la password";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const utente = db
    .prepare(
      "SELECT id, username, password_hash FROM Utente WHERE username = ?",
    )
    .get(username) as Utente | undefined;

  if (!utente) {
    return {
      message: "Credenziali non valide",
    };
  }

  const passwordCorretta = await bcrypt.compare(
    password,
    utente.password_hash,
  );

  if (!passwordCorretta) {
    return {
      message: "Credenziali non valide",
    };
  }

  await creaSessione(utente.id);
  redirect("/area-privata");
}