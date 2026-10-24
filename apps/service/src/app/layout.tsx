import type { Metadata } from 'next';
import '@fontsource-variable/plus-jakarta-sans';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { CartProvider } from '@/lib/cart-context';
import { Navbar } from '@/components/navbar';
import { CartDrawer } from '@/components/cart-drawer';
import { Footer } from '@/components/footer';
import { ScrollToTop } from '@applyfields/ui';

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
    <html lang="en">
      <body className="min-h-screen bg-[#F0F4F8] font-sans text-[#082046] antialiased selection:bg-[#38bdf8] selection:text-[#082046]">
        <AuthProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col justify-between">
              <Navbar />
              <main className="flex-1 w-full animate-rise">{children}</main>
              <Footer />
            </div>
            <CartDrawer />
            <ScrollToTop />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

