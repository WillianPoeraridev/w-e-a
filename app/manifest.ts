import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WeA — Willian & Angélica",
    short_name: "WeA",
    description:
      "O sistema de vida do casal: finanças, agenda, treino, estudos, metas e relacionamento.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0f0f14",
    theme_color: "#6366f1",
    lang: "pt-BR",
    categories: ["productivity", "finance", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
