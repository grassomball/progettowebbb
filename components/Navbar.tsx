import Link from "next/link";
import { getUtenteAutenticato } from "@/lib/auth";
import { logoutUtente } from "@/app/area-privata/actions";
import styles from "./SiteChrome.module.css";

export default async function Navbar() {
  const utente = await getUtenteAutenticato();
  const linkClass = styles.navLink;

  return (
    <header className={styles.header}>
      <div className={styles.announcement}>Il gusto della Puglia, dalla nostra famiglia alla tua tavola.</div>
    <nav aria-label="Navigazione principale" className={styles.nav}>
      <div className={styles.navInner}>
        <Link href="/" className={styles.brand} aria-label="Forno Di Gesù — Home">
          <span className={styles.brandTop}>IL FORNO</span><span className={styles.brandName}>Di Gesù<span className={styles.brandDot}>.</span></span><span className={styles.brandBottom}>ALTAMURA · PUGLIA</span>
        </Link>
        <div className={styles.primaryLinks}>
          <Link href="/" className={linkClass}>Home</Link>
          <Link href="/chi-siamo" className={linkClass}>Chi siamo</Link>
          <Link href="/catalogo" className={linkClass}>I nostri prodotti</Link>
        </div>
        <div className={styles.accountLinks}>
          {utente !== null ? (
            <>
              <Link href="/area-privata" className={linkClass}>Area privata</Link>
              <Link href="/carrello" className={linkClass}>Carrello</Link>
                            {utente.ruolo === "admin" && (
                <Link href="/admin" className={linkClass}>
                  Amministrazione
                </Link>
              )}
              <form action={logoutUtente}>
                <button type="submit" className={styles.accountButton}>
                  Esci
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className={linkClass}>Accedi</Link>
              <Link href="/registrati" className={styles.accountButton}>Registrati</Link>
            </>
          )}
        </div>
      </div>
    </nav>
    </header>
  );
}
