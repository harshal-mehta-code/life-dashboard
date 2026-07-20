import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tend — your life, tended to",
    short_name: "Tend",
    description:
      "One calm place to track relationships, chores, errands, and everything else in life.",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF7F1",
    theme_color: "#B85C3E",
    icons: [
      {
        src: "/manifest-icons/192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/manifest-icons/512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/manifest-icons/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
