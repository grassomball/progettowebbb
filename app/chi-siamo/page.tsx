import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Chi siamo | Forno Di Gesù", description: "Una famiglia, cinque generazioni e un legame con Altamura. Scopri la storia del Forno Di Gesù." };

export default function ChiSiamoPage() {
  return <main className={styles.about}>
    <header className={styles.intro}><p className={styles.eyebrow}>Il nostro forno · Le nostre radici</p><h1>Le mani nel pane.<br /><em>Il cuore ad Altamura.</em></h1><p>Prima di essere un forno, siamo una storia di famiglia.<br />Una storia che profuma di Puglia, da cinque generazioni.</p></header>
    <div className={styles.archive}><Image src="/forno/archivio-forno.jpg" alt="Immagine d’archivio del forno Di Gesù con pane e prodotti tradizionali" fill sizes="100vw" preload /><span>Ricordi di famiglia, sapori che restano.</span></div>
    <section className={styles.roots} aria-labelledby="titolo-radici">
      <div><p className={styles.eyebrow}>Un mestiere che si tramanda</p><h2 id="titolo-radici">Il tempo passa.<br /><em>Le radici restano.</em></h2><p>La memoria del forno passa da Luca, nato nel 1934, che portava il pane in bicicletta al Campo 65. Da quei gesti quotidiani prende forma il racconto della famiglia Di Gesù.</p><p>Oggi quella tradizione continua nel pane di Altamura e nelle specialità pugliesi: un incontro tra il sapere di ieri e la tavola di oggi.</p></div>
      <div className={styles.family}><Image src="/forno/storia-famiglia.png" alt="Album con una fotografia storica della famiglia Di Gesù" fill sizes="(max-width: 760px) 100vw, 50vw" /></div>
    </section>
    <section className={styles.values} aria-labelledby="titolo-valori"><p className={styles.eyebrow}>Quello che ci racconta</p><h2 id="titolo-valori">Tre parole, <em>una storia.</em></h2><div className={styles.valueGrid}>
      <article><span>01</span><h3>Famiglia</h3><p>Un mestiere condiviso tra generazioni, fatto di esperienza e gesti tramandati.</p></article>
      <article><span>02</span><h3>Territorio</h3><p>Altamura e la Murgia: il luogo da cui nasce l’identità del nostro forno.</p></article>
      <article><span>03</span><h3>Tradizione</h3><p>Pane, focacce, taralli e biscotti: sapori che accompagnano la vita di ogni giorno.</p></article>
    </div></section>
    <section className={styles.territory}><div className={styles.territoryImage}><Image src="/forno/altamura-grano.jpg" alt="La cattedrale di Altamura raffigurata in un taccuino tra i campi di grano" fill sizes="(max-width: 760px) 100vw, 50vw" /></div><div className={styles.territoryCopy}><p className={styles.eyebrow}>La nostra Puglia</p><h2>Una terra da vivere.<br /><em>E da assaporare.</em></h2><p>Nel 2023, Di Gesù Bakery ha aperto un nuovo capitolo: uno spazio dedicato alla degustazione e alla convivialità, accanto alla tradizione del forno.</p><Link href="/catalogo" className={styles.button}>Scopri i nostri prodotti <span aria-hidden="true">↗</span></Link></div></section>
    <p className={styles.source}>Storia e fotografie tratte dal <a href="https://digesu.it/pages/chi-siamo" target="_blank" rel="noreferrer">sito ufficiale del Forno Di Gesù ↗</a>.</p>
  </main>;
}
