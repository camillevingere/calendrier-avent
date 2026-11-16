import type { Metadata, Viewport } from "next";
import { Press_Start_2P, VT323 } from "next/font/google";
import "./globals.css";

const pressStart = Press_Start_2P({ weight: "400", subsets: ["latin"], variable: "--font-press-start" });
const vt323 = VT323({ weight: "400", subsets: ["latin"], variable: "--font-vt323" });

export const metadata: Metadata = {
  title: "Skill Quest — le calendrier de l'Avent IA de Fyliz",
  description:
    "24 skills IA de qualité pour faire gagner du temps à ta PME. Un niveau débloqué chaque jour de décembre à minuit, offert par Fyliz, agence d'automatisation IA.",
  openGraph: {
    title: "Skill Quest — 24 skills IA pour ta PME",
    description: "Un calendrier de l'Avent rétro : chaque jour de décembre à minuit, un skill IA testé et expliqué.",
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#0f0f10" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${pressStart.variable} ${vt323.variable}`}>
      <body>{children}</body>
    </html>
  );
}
