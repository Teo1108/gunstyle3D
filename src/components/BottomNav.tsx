"use client";
import { Home, LayoutGrid, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/context/CartContext";

const navItems = [
  { id: "home", path: "/", icon: Home, label: "Inicio" },
  { id: "catalog", path: "/catalog", icon: LayoutGrid, label: "Catálogo" },
  { id: "cart", path: "/cart", icon: ShoppingBag, label: "Carrito" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { cart } = useCart();
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <nav style={{
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 48px)", maxWidth: "400px",
      display: "flex", justifyContent: "space-around", padding: "12px 24px",
      borderRadius: "9999px", zIndex: 1000,
      background: "rgba(13,13,13,0.85)", backdropFilter: "blur(16px)",
      border: "1px solid var(--gs-border)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      {navItems.map(({ id, path, icon: Icon, label }) => {
        const isActive = pathname === path;
        return (
          <Link key={id} href={path} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textDecoration: "none", color: isActive ? "var(--gs-gold)" : "var(--gs-muted)", transition: "all 0.2s", transform: isActive ? "translateY(-2px)" : "none", position: "relative" }}>
            {id === "cart" && cartCount > 0 && (
              <span style={{ position: "absolute", top: "-6px", right: "-8px", background: "var(--gs-gold)", color: "#0d0d0d", fontSize: "9px", fontWeight: 800, width: "16px", height: "16px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {cartCount}
              </span>
            )}
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{ fontSize: "10px", fontWeight: isActive ? 600 : 400 }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
