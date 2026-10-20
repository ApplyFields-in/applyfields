import type { Metadata } from 'next';
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { Navbar } from '@/components/navbar';
import { CartDrawer } from '@/components/cart-drawer';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'ApplyFields Services — Book MeeSeva, CSC, PAN, Aadhaar & Xerox Online',
  description:
    'Dedicated citizen service booking portal for Telangana, Andhra Pradesh, Karnataka and Maharashtra. Reserve time slots at local verified centers with zero waiting lines.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-cyan-500 selection:text-slate-950">
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col justify-between">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
            <CartDrawer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
