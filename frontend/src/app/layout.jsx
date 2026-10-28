import "./globals.css";
import { ThemeLangProvider } from "@/lib/theme-lang-context";

export const metadata = {
  title: "Say & Save | Voice Order Notebook & Ledger",
  description: "Offline-capable voice diary and order ledger for tailors, medical shops, and bakers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased transition-colors duration-200">
        <ThemeLangProvider>
          {children}
        </ThemeLangProvider>
      </body>
    </html>
  );
}
