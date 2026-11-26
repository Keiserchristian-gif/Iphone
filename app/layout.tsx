import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "Hochformat",
  description:
    "Verbessert Fotos mit KI und speichert sie als 4K-Bild im Format 9:16.",
  appleWebApp: {
    capable: true,
    title: "Hochformat",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#e4eaed",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={bricolage.variable}>
      <body>{children}</body>
    </html>
  );
}
