import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Configura i font utilizzati dall'applicazione e li espone come variabili CSS.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Informazioni visualizzate dai motori di ricerca e dal titolo della scheda del browser.
export const metadata: Metadata = {
  title: "Forno Di Gesù",
  description:
    "Progetto universitario di una web app dedicata al Forno Di Gesù di Altamura.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Layout condiviso da tutte le pagine dell'applicazione.
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* La barra di navigazione resta presente in tutte le pagine. */}
        <Navbar />
        {/* Il contenuto della pagina occupa lo spazio rimanente sotto la barra. */}
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
