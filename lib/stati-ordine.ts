export const statiOrdine = ["ricevuto", "in_preparazione", "pronto", "completato"] as const;
export type StatoOrdine = typeof statiOrdine[number];

export function isStatoOrdine(valore: unknown): valore is StatoOrdine {
  return typeof valore === "string" && statiOrdine.some((stato) => stato === valore);
}

export function etichettaStatoOrdine(stato: string, spedizione: boolean) {
  switch (stato) {
    case "ricevuto": return "Ricevuto";
    case "in_preparazione": return "In preparazione";
    case "pronto": return spedizione ? "Pronto per la spedizione" : "Pronto per il ritiro";
    case "completato": return spedizione ? "Consegnato" : "Ritirato";
    default: return stato;
  }
}

export function prossimoStatoOrdine(stato: string): StatoOrdine | null {
  if (!isStatoOrdine(stato)) return null;
  return statiOrdine[statiOrdine.indexOf(stato) + 1] ?? null;
}
