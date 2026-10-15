"use client";

import { useActionState } from "react";
import { registraUtente } from "@/app/registrati/actions";
import type { RegistrazioneState } from "@/lib/form-state";

const initialState: RegistrazioneState = {};

export default function RegistratiForm() {
  const [state, formAction, pending] = useActionState(
    registraUtente,
    initialState,
  );

  const inputClass =
    "border border-line dark:border-zinc-700 rounded px-3 py-2 bg-white dark:bg-black text-ink dark:text-white";

  const errorClass = "text-sm text-red-700 dark:text-red-400";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>

        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          required
          aria-invalid={Boolean(state.errors?.username)}
          aria-describedby="username-error"
          className={inputClass}
        />

        <p id="username-error" aria-live="polite" className={errorClass}>
          {state.errors?.username}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          aria-invalid={Boolean(state.errors?.password)}
          aria-describedby="password-error"
          className={inputClass}
        />

        <p id="password-error" aria-live="polite" className={errorClass}>
          {state.errors?.password}
        </p>
      </div>

      <p aria-live="polite" className={errorClass}>
        {state.message}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="shop-button mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "Registrazione in corso…" : "Crea account"}
      </button>
    </form>
  );
}