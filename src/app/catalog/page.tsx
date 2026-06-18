"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Search, SlidersHorizontal, ChevronDown, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import BottomNav from "@/components/BottomNav";
import PageShell from "@/components/PageShell";
import { Product } from "@/lib/products";

const FILTERS = ["All", "T-Shirts", "Hoodies", "Accessories"];

export default function CatalogPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("All");
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProducts = () => {
    setLoading(true);
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => { if (d.success) setProducts(d.data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const displayed = products.filter((p) => {
    const matchesFilter = activeFilter === "All" || p.category === activeFilter;
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <PageShell>
    <div style={{ minHeight: "100vh", color: "var(--gs-text)", paddingBottom: "120px" }}>
      {/* Header */}
      <header style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "16px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.back()} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--gs-surface)", border: "1px solid var(--gs-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gs-text)", cursor: "pointer" }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "2px", textTransform: "uppercase" }}>Catálogo</h1>
        </div>
        <button onClick={loadProducts} disabled={loading} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--gs-surface)", border: "1px solid var(--gs-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gs-gold)", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1, transition: "transform 0.3s" }} title="Recargar productos">
          <RotateCcw size={20} style={{ transform: loading ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.5s linear" }} />
        </button>
      </header>

      <main style={{ padding: "0 20px" }}>
        {/* Search */}
        <div style={{ position: "relative", marginBottom: "16px" }}>
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "14px 14px 14px 44px", borderRadius: "16px", background: "var(--gs-surface)", border: "1px solid var(--gs-border)", color: "var(--gs-text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }}
          />
          <Search size={18} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--gs-muted)" }} />
        </div>

        {/* Filter + sort bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", background: "var(--gs-surface)", border: "1px solid var(--gs-border)", borderRadius: "16px", color: "var(--gs-text)", fontSize: "13px", cursor: "pointer" }}>
            <SlidersHorizontal size={14} /> Filtros
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--gs-muted)", fontSize: "13px", cursor: "pointer" }}>
            Ordenar: <span style={{ color: "var(--gs-text)", display: "flex", alignItems: "center", gap: "4px" }}>Relevancia <ChevronDown size={14} /></span>
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "16px", marginBottom: "8px", scrollbarWidth: "none" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{ padding: "8px 20px", borderRadius: "9999px", fontWeight: 600, fontSize: "12px", whiteSpace: "nowrap", background: activeFilter === f ? "rgba(245,166,35,0.15)" : "transparent", color: activeFilter === f ? "var(--gs-gold)" : "var(--gs-muted)", border: `1px solid ${activeFilter === f ? "var(--gs-gold)" : "var(--gs-border)"}`, cursor: "pointer", transition: "all 0.2s" }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grid */}
        {products.length === 0
          ? <p style={{ color: "var(--gs-gold)", textAlign: "center", padding: "40px 0" }}>Cargando...</p>
          : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "32px" }}>
              {displayed.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )
        }
      </main>

      <BottomNav />
    </div>
    </PageShell>
  );
}
