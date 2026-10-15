"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { confermaOrdine } from "@/app/checkout/actions";
import type { CheckoutState } from "@/lib/form-state";

export default function CheckoutForm({ token, impronta }: { token: string; impronta: string }) {
  const [state, action, pending] = useActionState(confermaOrdine, {} as CheckoutState);
  const [nominativo, setNominativo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [indirizzo, setIndirizzo] = useState({ indirizzo: "", numero_civico: "", cap: "", citta: "", provincia: "" });
  const inputClass = "mt-2 w-full rounded border border-line bg-transparent px-3 py-2";
  return (
    <form action={action} className="mt-8">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="impronta" value={impronta} />
      <fieldset disabled={pending} className="space-y-5">
        <legend className="mb-4 text-xl font-semibold">Spedizione a domicilio in Italia</legend>
        <label className="block" htmlFor="nominativo">Nome e cognome
          <input id="nominativo" name="nominativo" autoComplete="name" required minLength={2} maxLength={100} value={nominativo} onChange={(e) => setNominativo(e.target.value)} className={inputClass} />
        </label>
        <label className="block" htmlFor="telefono">Telefono
          <input id="telefono" name="telefono" type="tel" autoComplete="tel" required maxLength={25} value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClass} />
        </label>
        <label className="block" htmlFor="indirizzo">Via / Piazza
          <input id="indirizzo" name="indirizzo" autoComplete="shipping street-address" required minLength={5} maxLength={200} value={indirizzo.indirizzo} onChange={(e) => setIndirizzo({ ...indirizzo, indirizzo: e.target.value })} className={inputClass} />
        </label>
        <label className="block" htmlFor="numero_civico">Numero civico
          <input id="numero_civico" name="numero_civico" required maxLength={20} placeholder="Es. 12, 12/A oppure SNC" value={indirizzo.numero_civico} onChange={(e) => setIndirizzo({ ...indirizzo, numero_civico: e.target.value })} className={inputClass} />
        </label>
        <label className="block" htmlFor="citta">Città
          <input id="citta" name="citta" autoComplete="shipping address-level2" required minLength={2} maxLength={100} value={indirizzo.citta} onChange={(e) => setIndirizzo({ ...indirizzo, citta: e.target.value })} className={inputClass} />
        </label>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block" htmlFor="cap">CAP
            <input id="cap" name="cap" autoComplete="shipping postal-code" required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={indirizzo.cap} onChange={(e) => setIndirizzo({ ...indirizzo, cap: e.target.value })} className={inputClass} />
          </label>
          <label className="block" htmlFor="provincia">Provincia (sigla)
            <input id="provincia" name="provincia" autoComplete="shipping address-level1" required pattern="[A-Za-z]{2}" maxLength={2} placeholder="BA" value={indirizzo.provincia} onChange={(e) => setIndirizzo({ ...indirizzo, provincia: e.target.value.toUpperCase() })} className={inputClass} />
          </label>
        </div>
        <button type="submit" className="rounded-lg bg-brand px-5 py-3 font-medium text-white disabled:opacity-50">{pending ? "Conferma in corso…" : "Conferma ordine dimostrativo"}</button>
      </fieldset>
      <div aria-live="polite" className="mt-4">
        {state.message && <><p role="alert" className="text-red-700 dark:text-red-400">{state.message}</p><Link href="/carrello" className="mt-2 inline-block underline">Torna al carrello e riapri il riepilogo</Link></>}
      </div>
    </form>
  );
}
