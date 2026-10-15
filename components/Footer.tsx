import Link from "next/link";
import styles from "./SiteChrome.module.css";

export default function Footer() {
  return <footer className={styles.footer}>
    <div className={styles.footerInner}>
      <div className={styles.footerIntro}><p className={styles.footerTitle}>Di Gesù.<br />Il gusto di sentirsi a casa.</p><p className={styles.footerText}>Pane, ricordi e sapori di Puglia.<br />Una storia che continua, ad Altamura.</p></div>
      <div><h2>Il nostro forno</h2><ul><li><Link href="/">Home</Link></li><li><Link href="/chi-siamo">Chi siamo</Link></li><li><Link href="/catalogo">I nostri prodotti</Link></li></ul></div>
      <div><h2>Al tuo fianco</h2><ul><li><Link href="/area-privata">Area personale</Link></li><li><Link href="/area-privata/ordini">I miei ordini</Link></li><li><Link href="/area-privata/assistenza">Assistenza clienti</Link></li><li><Link href="/carrello">Il mio carrello</Link></li></ul></div>
    </div>
    <div className={styles.footerBottom}><span>Forno Di Gesù · Altamura, Puglia</span><a href="https://digesu.it/" target="_blank" rel="noreferrer">Scopri il forno sul sito ufficiale ↗</a></div>
  </footer>;
}
