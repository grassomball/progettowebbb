import db from "@/lib/db";
import { getUtenteAutenticato } from "@/lib/auth";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
    return new Response(null, { status: 404 });
  }
  const prodotto = db.prepare("SELECT foto, attivo FROM Prodotto WHERE id = ?")
    .get(Number(id)) as { foto: Buffer | null; attivo: number } | undefined;
  if (!prodotto?.foto) return new Response(null, { status: 404 });
  if (!prodotto.attivo && (await getUtenteAutenticato())?.ruolo !== "admin") {
    return new Response(null, { status: 404 });
  }
  return new Response(new Uint8Array(prodotto.foto), {
    headers: {
      "Content-Type": "image/jpeg",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}
