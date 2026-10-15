import Link from "next/link";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    registrato?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const registrazioneCompletata = params.registrato === "1";

  return (
    <div className="shop-page auth-page">
      <p className="shop-eyebrow">Il tuo account</p><h1 className="text-3xl font-bold text-ink dark:text-white mb-6">
        Bentornato al forno.
      </h1><p className="auth-intro">Accedi per ritrovare il tuo carrello, gli ordini e le tue recensioni.</p>

      {registrazioneCompletata && (
        <p
          role="status"
          className="mb-4 rounded border border-green-300 bg-green-50 p-3 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
        >
          Registrazione completata! Ora puoi accedere con le tue credenziali.
        </p>
      )}

      <LoginForm />
      <p className="auth-switch"><Link href="/registrati">Non hai un account? Registrati</Link></p>
    </div>
  );
}