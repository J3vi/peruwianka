import AuthRefresh from "@/components/AuthRefresh";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navbar from "@/components/Navbar";
import ToastHost from "@/components/ToastHost";
import WhatsAppFloating from "@/components/WhatsAppFloating";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
export const dynamic = "force-dynamic";

const inter = Inter({ subsets: ["latin"] });

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Peruwianka",
  description: "Tienda online de productos peruanos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Header />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ToastHost />
        <AuthRefresh />
        <WhatsAppFloating />
      </body>
    </html>
  );
}
