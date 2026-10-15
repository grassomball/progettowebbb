# Progetto web — Forno Di Gesù

Codice del progetto in Next.js, React, TypeScript e SQLite.

## Dove leggere il codice

- `app/`: pagine del sito e azioni lato server, comprese area cliente e amministrazione.
- `components/`: componenti dell’interfaccia e moduli.
- `lib/`: database, sessioni, catalogo, carrello, ordini, recensioni e assistenza.
- `scripts/`: popolamento del catalogo e assegnazione del ruolo amministratore.
- `tests/`: test di autenticazione, commercio e flussi HTTP.

Per iniziare: `lib/db.ts`, `lib/session.ts`, `app/login/actions.ts` e `app/catalogo/page.tsx`.

## Comandi

```sh
npm ci
npm run dev
npm test
npm run lint
```
