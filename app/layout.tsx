import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sparkboard — Brainstorming Workshop",
  description: "Convierte ideas en momentos memorables.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
