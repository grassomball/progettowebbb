import Link from "next/link";
import RegistratiForm from "@/components/RegistratiForm";

export default function RegistratiPage() {
  return (
    <div className="shop-page auth-page">
      <p className="shop-eyebrow">Il tuo account</p><h1 className="text-3xl font-bold text-ink dark:text-white mb-6">
        Un posto alla nostra tavola.
      </h1><p className="auth-intro">Crea il tuo account e porta a casa i sapori del forno.</p>

      <RegistratiForm />
      <p className="auth-switch"><Link href="/login">Hai già un account? Accedi</Link></p>
    </div>
  );
}