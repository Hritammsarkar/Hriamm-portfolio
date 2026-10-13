import type { Metadata } from "next";
import "./globals.css";
import "./sections.css";
import "./admin.css";
import "./pages.css";

export const metadata: Metadata = {
  title: "Hritamm Sarkar | Portfolio",
  description: "I’m Hritamm Sarkar, a B.Tech ECE student at Narula Institute of Technology. Explore my projects, skills and resume.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

