"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, ShoppingCart, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import BottomNav from "@/components/BottomNav";
import PageShell from "@/components/PageShell";
import { use } from "react";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setProduct(d.data);
        setLoading(false);
      });
  }, [id]);

  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  if (loading) {
    return (
      <div style={{ background: "var(--gs-dark)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gs-muted)" }}>
        Cargando producto...
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ background: "var(--gs-dark)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gs-muted)" }}>
        Producto no encontrado.
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Por favor selecciona un tamaño");
      return;
    }
    addToCart(product.id, selectedSize);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <PageShell>
    <div style={{ minHeight: "100vh", color: "var(--gs-text)", paddingBottom: "120px" }}>
      {/* Header */}
      <header style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          className="btn-press"
          onClick={() => router.back()}
          style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--gs-surface)", border: "1px solid var(--gs-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gs-text)", cursor: "pointer" }}
        >
          <ArrowLeft size={20} />
        </button>
      </header>

      {/* Main image */}
      <div style={{ margin: "20px", borderRadius: "24px", overflow: "hidden", aspectRatio: "1/1", background: "var(--gs-surface)" }}>
        <img
          src={product.images?.[activeImg] || product.catalogImage || ""}
          alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s" }}
        />
      </div>

      {/* Thumbnails */}
      <div style={{ display: "flex", gap: "10px", padding: "0 20px", marginBottom: "24px" }}>
        {(product.images || []).map((img: string, i: number) => (
          <button
            key={i}
            className="btn-press"
            onClick={() => setActiveImg(i)}
            style={{
              width: "72px", height: "72px", borderRadius: "14px", overflow: "hidden", padding: 0, border: `2px solid ${activeImg === i ? "var(--gs-gold)" : "var(--gs-border)"}`, cursor: "pointer", flexShrink: 0, transition: "border-color 0.2s",
            }}
          >
            <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </button>
        ))}
      </div>

      {/* Info */}
      <div style={{ padding: "0 20px" }}>
        {/* Name + price */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
          <div>
            <p style={{ fontSize: "11px", color: "var(--gs-muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "4px" }}>{product.category}</p>
            <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{product.name}</h1>
          </div>
          <span style={{ fontSize: "26px", fontWeight: 800, color: "var(--gs-gold)", flexShrink: 0 }}>${product.price.toFixed(0)}</span>
        </div>

        {/* Rating */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "20px" }}>
          <Star size={14} fill="var(--gs-gold)" color="var(--gs-gold)" />
          <span style={{ fontSize: "13px", fontWeight: 600 }}>{product.rating}</span>
          <span style={{ fontSize: "12px", color: "var(--gs-muted)" }}>· Street Wear</span>
        </div>

        {/* Description */}
        <p style={{ fontSize: "14px", color: "var(--gs-muted)", lineHeight: 1.7, marginBottom: "24px" }}>
          {product.description}
        </p>

        {/* Size selector */}
        <p style={{ fontSize: "11px", color: "var(--gs-muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "12px" }}>
          Talle {selectedSize && <span style={{ color: "var(--gs-gold)", fontWeight: 700 }}>— {selectedSize}</span>}
        </p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "32px" }}>
          {Object.entries(product.sizes || {}).map(([size, available]) => (
            available && (
              <button
                key={size}
                className="btn-press"
                onClick={() => setSelectedSize(size)}
                style={{
                  padding: "10px 20px", borderRadius: "12px", fontSize: "13px", fontWeight: 600, cursor: "pointer",
                  background: selectedSize === size ? "var(--gs-gold)" : "var(--gs-surface)",
                  color: selectedSize === size ? "#0d0d0d" : "var(--gs-text)",
                  border: `1px solid ${selectedSize === size ? "var(--gs-gold)" : "var(--gs-border)"}`,
                  transition: "all 0.2s",
                }}
              >
                {size}
              </button>
            )
          ))}
        </div>

        {/* Add to cart */}
        <button
          className="btn-press"
          onClick={handleAddToCart}
          style={{
            width: "100%", padding: "18px", borderRadius: "9999px", border: "none",
            background: added ? "#00e676" : "var(--gs-gold)",
            color: "#0d0d0d", fontSize: "15px", fontWeight: 800,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            cursor: "pointer", letterSpacing: "1px", transition: "background 0.3s",
          }}
        >
          <ShoppingCart size={20} />
          {added ? "¡AGREGADO!" : "AGREGAR AL CARRITO"}
        </button>
      </div>

      <BottomNav />
    </div>
    </PageShell>
  );
}
