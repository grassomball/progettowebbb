"use server";

import db from "@/lib/db";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import type { RegistrazioneState } from "@/lib/form-state";

export async function registraUtente(
  _previousState: RegistrazioneState,
  formData: FormData,
): Promise<RegistrazioneState> {
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

  const username = usernameValue.trim();
  const password = passwordValue;

  // Raccoglie gli errori di entrambi i campi.
  const errors: NonNullable<RegistrazioneState["errors"]> = {};

  if (username.length === 0) {
    errors.username = "Inserisci uno username";
  } else if (username.length < 3 || username.length > 30) {
    errors.username = "Lo username deve contenere da 3 a 30 caratteri";
  }

  if (password.length === 0) {
    errors.password = "Inserisci una password";
  } else if (password.length < 6) {
    errors.password = "La password deve contenere almeno 6 caratteri";
  } else if (Buffer.byteLength(password, "utf8") > 72) {
    errors.password = "La password supera il limite massimo di 72 byte";
  }

  // Se i dati non sono validi, restituisce gli errori senza salvare.
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const utenteEsistente = db
    .prepare("SELECT id FROM Utente WHERE username = ?")
    .get(username);

  if (utenteEsistente) {
    return {
      errors: {
        username: "Username già in uso",
      },
    };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    db.prepare(
      "INSERT INTO Utente (username, password_hash) VALUES (?, ?)",
    ).run(username, passwordHash);
  } catch (error) {
    // Copre anche due registrazioni contemporanee dello stesso username.
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      return {
        errors: {
          username: "Username già in uso",
        },
      };
    }

    // Gli errori inattesi non vengono confusi con errori di compilazione.
    throw error;
  }

  redirect("/login?registrato=1");
}