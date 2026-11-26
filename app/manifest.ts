import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hochformat",
    short_name: "Hochformat",
    description:
      "Verbessert Fotos mit KI und speichert sie als 4K-Bild im Format 9:16.",
    lang: "de",
    start_url: "/",
    display: "standalone",
    background_color: "#e4eaed",
    theme_color: "#e4eaed",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
