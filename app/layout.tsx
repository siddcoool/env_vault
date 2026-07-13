import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Env Vault",
  description: "EnvVault is a tool for managing environment variables for your projects",
};

const themeInitScript = `
(function () {
  try {
    var t = localStorage.getItem("env_vault_theme");
    if (t !== "light") document.documentElement.classList.add("dark");
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        <ThemeProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
