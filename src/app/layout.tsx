import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { PreferencesProvider } from "@/context/PreferencesContext";
import FloatingToolbar from "@/components/FloatingToolbar";

export const metadata: Metadata = {
  title: "GunStyle — Street Wear",
  description: "Ropa oversize. Lo que se usa en la calle.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <PreferencesProvider>
          <CartProvider>
            <FloatingToolbar />
            {children}
          </CartProvider>
        </PreferencesProvider>
      </body>
    </html>
  );
}
