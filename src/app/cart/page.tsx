"use client";
import { useState, useEffect } from "react";
import { ArrowLeft, Trash2, Plus, Minus, Check, CreditCard, MapPin, ChevronDown } from "lucide-react";
import PressButton from "@/components/PressButton";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import BottomNav from "@/components/BottomNav";
import PageShell from "@/components/PageShell";

type Receipt = {
  items: Array<{ id: string; name: string; category: string; price: number; image: string; quantity: number; size?: string }>;
  subtotal: string;
  discountAmount: number;
  shipping: number;
  total: number;
};

export default function CartPage() {
  const router = useRouter();
  const { cart, loading: cartLoading, updateCart, removeCartItem, fetchCart } = useCart();
  const [discountCode, setDiscountCode] = useState("GUNSTYLE");
  const [appliedDiscount, setAppliedDiscount] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (cartLoading || cart.length === 0) { setReceipt(null); return; }
    setLoading(true);
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart, discountCode: appliedDiscount }),
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setReceipt(d.receipt); })
      .finally(() => setLoading(false));
  }, [cart, appliedDiscount, cartLoading]);

  const applyDiscount = () => {
    fetch("/api/discounts/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: discountCode }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) { setAppliedDiscount(discountCode); setErrorMsg(""); }
        else { setErrorMsg(d.message); setAppliedDiscount(null); }
      });
  };

  const completeCheckout = () => {
    setLoading(true);
    setTimeout(() => { fetchCart(); router.push("/"); }, 1200);
  };

  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  return (
    <PageShell>
    <div style={{ minHeight: "100vh", color: "var(--gs-text)", paddingBottom: "120px" }}>
      {/* Header */}
      <header style={{ padding: "24px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.back()} style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--gs-surface)", border: "1px solid var(--gs-border)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--gs-text)", cursor: "pointer" }}>
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0, letterSpacing: "2px", textTransform: "uppercase" }}>Mi Carrito</h1>
        </div>
        <span style={{ background: "rgba(245,166,35,0.15)", color: "var(--gs-gold)", padding: "8px 16px", borderRadius: "9999px", fontSize: "13px", fontWeight: 600, border: "1px solid rgba(245,166,35,0.3)" }}>
          {totalItems} items
        </span>
      </header>

      <main style={{ padding: "0 20px" }}>
        {cartLoading && <p style={{ color: "var(--gs-gold)", textAlign: "center", padding: "40px 0" }}>Sincronizando carrito...</p>}
        {!cartLoading && cart.length === 0 && (
          <p style={{ color: "var(--gs-muted)", textAlign: "center", padding: "60px 0" }}>El carrito está vacío.</p>
        )}

        {receipt?.items.map((item) => (
          <div key={item.id} style={{ background: "var(--gs-surface)", borderRadius: "24px", padding: "16px", display: "flex", gap: "16px", marginBottom: "16px", alignItems: "center", border: "1px solid var(--gs-border)" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "16px", overflow: "hidden", flexShrink: 0 }}>
              <img src={item.image} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 600, margin: 0 }}>{item.name}</h3>
                <span style={{ fontWeight: 800, fontSize: "16px" }}>${item.price.toFixed(0)}</span>
              </div>
              <p style={{ fontSize: "12px", color: "var(--gs-muted)", margin: "0 0 12px 0" }}>
                {item.category} {item.size && <span style={{ color: "var(--gs-gold)", fontWeight: 600 }}>• Talle: {item.size}</span>}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: "9999px" }}>
                  <PressButton onClick={() => updateCart(item.id, item.quantity - 1, item.size)} style={{ background: "none", border: "none", color: "var(--gs-muted)", cursor: "pointer", display: "flex" }}><Minus size={14} /></PressButton>
                  <span style={{ fontSize: "14px", fontWeight: 600 }}>{item.quantity}</span>
                  <PressButton onClick={() => updateCart(item.id, item.quantity + 1, item.size)} style={{ background: "none", border: "none", color: "var(--gs-muted)", cursor: "pointer", display: "flex" }}><Plus size={14} /></PressButton>
                </div>
                <PressButton onClick={() => removeCartItem(item.id, item.size)} style={{ background: "rgba(255,77,79,0.1)", border: "1px solid rgba(255,77,79,0.2)", color: "#ff4d4f", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", borderRadius: "50%" }}>
                  <Trash2 size={16} />
                </PressButton>
              </div>
            </div>
          </div>
        ))}

        {receipt && (
          <>
            {/* Discount */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ fontSize: "11px", color: "var(--gs-muted)", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "10px" }}>Código de descuento</p>
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} style={{ flex: 1, background: "var(--gs-surface)", border: "1px solid var(--gs-border)", padding: "14px 16px", borderRadius: "9999px", color: "var(--gs-text)", fontSize: "14px", outline: "none" }} />
                <button onClick={applyDiscount} style={{ background: "var(--gs-gold)", color: "#0d0d0d", border: "none", padding: "0 20px", borderRadius: "9999px", fontWeight: 700, cursor: "pointer", fontSize: "13px" }}>Aplicar</button>
              </div>
              {errorMsg && <p style={{ color: "#ff4d4f", fontSize: "12px", marginTop: "8px" }}>{errorMsg}</p>}
              {appliedDiscount && (
                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "6px", color: "#00e676", fontSize: "12px", fontWeight: 700, background: "rgba(0,230,118,0.1)", padding: "8px 14px", borderRadius: "9999px", width: "max-content" }}>
                  <Check size={14} strokeWidth={3} /> {appliedDiscount} APLICADO
                </div>
              )}
            </div>

            {/* Summary */}
            <div style={{ background: "var(--gs-surface)", padding: "24px", borderRadius: "24px", border: "1px solid var(--gs-border)", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", color: "var(--gs-muted)" }}>
                <span>Subtotal</span><span style={{ color: "var(--gs-text)" }}>${receipt.subtotal}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", fontSize: "14px", color: receipt.discountAmount > 0 ? "#00e676" : "var(--gs-muted)" }}>
                <span>Descuento</span><span>-${receipt.discountAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "14px", color: "var(--gs-muted)" }}>
                <span>Envío</span><span style={{ color: "var(--gs-gold)", fontWeight: 600 }}>{receipt.shipping === 0 ? "GRATIS" : `$${receipt.shipping}`}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "16px", borderTop: "1px solid var(--gs-border)" }}>
                <span style={{ fontSize: "16px", fontWeight: 600 }}>Total</span>
                <span style={{ fontSize: "26px", color: "var(--gs-gold)", fontWeight: 800 }}>${receipt.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Shipping address */}
            <div style={{ background: "var(--gs-surface)", borderRadius: "24px", display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px", marginBottom: "16px", border: "1px solid var(--gs-border)" }}>
              <MapPin size={20} color="var(--gs-muted)" />
              <div style={{ flex: 1 }}>
                <p style={{ margin: "0 0 2px 0", fontSize: "10px", color: "var(--gs-muted)", textTransform: "uppercase", letterSpacing: "1px" }}>Dirección de envío</p>
                <p style={{ margin: 0, fontSize: "14px", fontWeight: 500 }}>Calle Principal 123, Madrid</p>
              </div>
              <ChevronDown size={18} color="var(--gs-muted)" />
            </div>

            {/* Payment */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              <button style={{ flex: 1, padding: "18px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", border: "1px solid var(--gs-gold)", background: "rgba(245,166,35,0.1)", color: "var(--gs-gold)", borderRadius: "20px", cursor: "pointer" }}>
                <CreditCard size={22} /><span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "1px" }}>CARD</span>
              </button>
              <button style={{ flex: 1, padding: "18px 12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", border: "1px solid var(--gs-border)", background: "var(--gs-surface)", color: "var(--gs-muted)", borderRadius: "20px", cursor: "pointer" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, fontStyle: "italic", lineHeight: 1 }}>P</span><span style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "1px" }}>PAYPAL</span>
              </button>
            </div>

            <button
              onClick={completeCheckout}
              disabled={loading}
              style={{ width: "100%", padding: "18px 24px", background: "var(--gs-gold)", border: "none", borderRadius: "9999px", color: "#0d0d0d", fontSize: "15px", fontWeight: 800, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", opacity: loading ? 0.6 : 1, letterSpacing: "1px" }}
            >
              <span>CONFIRMAR PEDIDO</span>
              <span>${receipt.total.toFixed(2)}</span>
            </button>
          </>
        )}
      </main>

      <BottomNav />
    </div>
    </PageShell>
  );
}
