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
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
