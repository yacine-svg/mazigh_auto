import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Variable width axis: expanded for headlines, condensed for big numbers.
const display = Archivo({
  variable: "--font-display-face",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mazighauto.dz"),
  title: "MAZIGH AUTO | Showroom Kecherid Auto - El Khroub, Constantine",
  description:
    "Achat, Vente et Échange de véhicules neufs et d'occasion à El Khroub, Constantine, Algérie. Mazigh Auto - Showroom Kecherid Auto.",
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.svg",
    apple: "/logo.png",
  },
  openGraph: {
    title: "MAZIGH AUTO | Showroom Kecherid Auto",
    description: "Achat, Vente et Échange de véhicules à El Khroub, Constantine.",
    images: [{ url: "/logo.png" }],
    locale: "fr_DZ",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#070707",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
