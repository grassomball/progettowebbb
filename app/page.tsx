import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { getProdottiPubblicati } from "@/lib/prodotti";
import styles from "./page.module.css";

const categorie = [
  { nome: "Pane", filtro: "pane", immagine: "pane-di-altamura-dop.webp", dettaglio: "Il profumo di casa" },
  { nome: "Focacce", filtro: "focacce", immagine: "focaccia-con-pomodoro-artigianale.webp", dettaglio: "Una pausa tutta pugliese" },
  { nome: "Taralli", filtro: "taralli", immagine: "treccine-ai-semi-di-finocchio.webp", dettaglio: "Piccoli momenti di gusto" },
  { nome: "Biscotti", filtro: "biscotti", immagine: "biscotto-del-mattino.webp", dettaglio: "Il buongiorno più dolce" },
];
const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" });

export default async function Home() {
  await connection();
  const prodotti = getProdottiPubblicati();
  const selezione = categorie.flatMap((c) => {
    const prodotto = prodotti.find((p) => p.categoria === c.filtro);
    return prodotto ? [prodotto] : [];
  });
  return <main className={styles.home}>
    <section className={styles.hero} aria-labelledby="titolo-home">
      <div className={styles.heroCopy}>
        <p className={styles.eyebrow}>Altamura, Puglia · Una storia di famiglia</p>
        <h1 id="titolo-home">Il pane di casa.<br /><em>Il cuore della Puglia.</em></h1>
        <p className={styles.lead}>Ci sono sapori che ti fanno sentire a casa. Scopri il pane, le focacce e le specialità del Forno Di Gesù.</p>
        <div className={styles.actions}>
          <Link href="/catalogo" className={styles.primary}>Entra nel nostro forno <span aria-hidden="true">↗</span></Link>
          <Link href="/chi-siamo" className={styles.textLink}>La nostra storia <span aria-hidden="true">→</span></Link>
        </div>
        <p className={styles.heroNote}>Da cinque generazioni, un legame con la nostra terra.</p>
      </div>
      <div className={styles.heroVisual}>
        <span className={styles.verticalLabel} aria-hidden="true">FATTO DI STORIA, FATTO DI PUGLIA</span>
        <Image src="/prodotti/pane-di-altamura-dop.webp" alt="Pane di Altamura DOP, dalla crosta dorata e dalla forma tradizionale" fill sizes="(max-width: 760px) 100vw, 55vw" preload className={styles.heroBread} />
        <div className={styles.seal}><span>La nostra terra</span><strong>Altamura</strong><span>Il nostro pane</span></div>
        <span className={styles.heroCaption}>01 / Il pane, da sempre.</span>
      </div>
    </section>
    <div className={styles.ribbon} aria-label="Le specialità del forno"><span>Pane</span><span aria-hidden="true">✳</span><span>Focacce</span><span aria-hidden="true">✳</span><span>Frise</span><span aria-hidden="true">✳</span><span>Taralli</span><span aria-hidden="true">✳</span><span>Biscotti</span></div>
    <section className={styles.section} aria-labelledby="categorie-home">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Semplicemente buono</p><h2 id="categorie-home">A ogni momento,<br /><em>il suo sapore.</em></h2></div><Link href="/catalogo" className={styles.textLink}>Tutte le specialità <span aria-hidden="true">→</span></Link></div>
      <div className={styles.categories}>{categorie.map((c) => <Link key={c.filtro} href={`/catalogo?categoria=${c.filtro}`} className={styles.category}>
        <div className={styles.categoryImage}><Image src={`/prodotti/${c.immagine}`} alt={c.nome} fill sizes="(max-width: 760px) 45vw, 23vw" /></div>
        <div className={styles.categoryTitle}><h3>{c.nome}</h3><span aria-hidden="true">↗</span></div><p>{c.dettaglio}</p>
      </Link>)}</div>
    </section>
    <section className={styles.story} aria-labelledby="storia-home">
      <div className={styles.storyImage}><Image src="/forno/storia-famiglia.png" alt="Fotografia storica della famiglia Di Gesù, conservata in un album" fill sizes="(max-width: 760px) 100vw, 50vw" /></div>
      <div className={styles.storyCopy}><p className={styles.eyebrow}>Le mani cambiano. La passione resta.</p><h2 id="storia-home">Una famiglia.<br />Cinque generazioni.<br /><em>La stessa passione.</em></h2><p>Ad Altamura, il lavoro del forno si tramanda in famiglia. Di Gesù porta avanti questa storia attraverso il pane e i sapori della tradizione pugliese.</p><Link href="/chi-siamo" className={styles.primary}>Conosci il nostro forno <span aria-hidden="true">↗</span></Link></div>
    </section>
    {selezione.length > 0 && <section className={styles.section} aria-labelledby="selezione-home">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Dal nostro catalogo</p><h2 id="selezione-home">Porta la Puglia <em>a tavola.</em></h2></div><Link href="/catalogo" className={styles.textLink}>Scopri il catalogo <span aria-hidden="true">→</span></Link></div>
      <div className={styles.products}>{selezione.map((p) => <article key={p.id} className={styles.product}>
        <Link href={`/catalogo/${p.id}`} className={styles.productImage} aria-label={`Scopri ${p.nome}`}>
          {p.immagine ? <Image src={p.immagine} alt={p.nome} fill unoptimized={p.immagine.startsWith("/api/")} sizes="(max-width: 760px) 45vw, 23vw" /> : <span>Foto in arrivo</span>}
          {!p.disponibilita && <span className={styles.stock}>Esaurito</span>}
        </Link>
        <h3><Link href={`/catalogo/${p.id}`}>{p.nome}</Link></h3><p>{euro.format(p.prezzo_centesimi / 100)}</p>
      </article>)}</div>
    </section>}
    <section className={styles.invitation}><p className={styles.eyebrow}>Le cose buone si condividono</p><h2>Un posto a tavola<br /><em>c’è sempre.</em></h2><p>Scegli le tue specialità preferite e ritrova il gusto della Puglia, un morso alla volta.</p><Link href="/catalogo" className={styles.lightButton}>Scopri i prodotti <span aria-hidden="true">↗</span></Link></section>
  </main>;
}
