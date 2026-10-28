import "./globals.css";

export const metadata = {
  title: "Dukaan Diary | Voice Notebook for Small Shops",
  description: "Offline-capable voice diary and order ledger for tailors, medical shops, and bakers.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f8f9fe] text-[#172b4d]">
        {children}
      </body>
    </html>
  );
}

