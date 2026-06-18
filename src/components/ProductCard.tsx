"use client";
import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/products";
import PressButton from "@/components/PressButton";

export default function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const { addToCart } = useCart();

  return (
    <Link
      href={`/catalog/${product.id}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        textDecoration: "none",
        background: "var(--gs-surface-glass)",
        backdropFilter: "blur(16px)",
        border: "1px solid var(--gs-border)",
        borderRadius: "24px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        transform: isHovered ? "translateY(-4px)" : "none",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", marginBottom: "16px", borderRadius: "16px", overflow: "hidden", background: "rgba(0,0,0,0.2)" }}>
        <img
          src={product.catalogImage || (product as any).image || ""}
          alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s", transform: isHovered ? "scale(1.05)" : "scale(1)" }}
        />
        <PressButton
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsLiked(!isLiked); }}
          style={{ position: "absolute", top: "8px", right: "8px", background: "rgba(20,20,26,0.6)", backdropFilter: "blur(10px)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: isLiked ? "#ff4d4f" : "var(--gs-text)" }}
        >
          <Heart size={16} fill={isLiked ? "#ff4d4f" : "none"} />
        </PressButton>
        {product.isNew && (
          <span style={{ position: "absolute", top: "8px", left: "8px", background: "var(--gs-gold)", color: "#0d0d0d", fontSize: "10px", fontWeight: 700, padding: "4px 8px", borderRadius: "9999px", letterSpacing: "1px" }}>
            NEW
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 4px 0", color: "var(--gs-text)", lineHeight: 1.4 }}>{product.name}</h3>
          <p style={{ fontSize: "11px", color: "var(--gs-muted)", margin: 0 }}>{product.category}</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "16px" }}>
          <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--gs-text)" }}>${product.price.toFixed(2)}</span>
          <PressButton
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); addToCart(product.id); }}
            style={{ background: "rgba(245,166,35,0.1)", color: "var(--gs-gold)", border: "none", borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ShoppingCart size={16} />
          </PressButton>
        </div>
      </div>
    </Link>
  );
}
