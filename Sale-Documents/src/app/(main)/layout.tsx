import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { FloatingContact } from "@/components/layout/FloatingContact";
import { CartProvider } from "@/contexts/CartContext";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <CartProvider>
      <Header />
      <main className="flex-1 flex flex-col pb-24">
        {children}
      </main>
      <Footer />
      <FloatingContact />
    </CartProvider>
  );
}
