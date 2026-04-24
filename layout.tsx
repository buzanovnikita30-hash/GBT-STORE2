import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SubРФ — ChatGPT Plus и Pro для России",
  description: "Подключите ChatGPT Plus или Pro на ваш аккаунт без иностранной карты. Активация за 15 минут.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body className="antialiased bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
