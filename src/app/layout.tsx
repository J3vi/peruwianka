import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ToastHost from '@/components/ToastHost'
import AuthRefresh from '@/components/AuthRefresh'
import WhatsAppFloating from '@/components/WhatsAppFloating'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Peruwianka',
  description: 'Tienda online de productos peruanos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
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
  )
}
