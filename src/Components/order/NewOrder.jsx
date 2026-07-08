import { SERVICES } from "../../data/services.js";
import { fmt } from "../../utils/format.js";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";

export default function NewOrder({ order, setOrder, addItem, createOrder }) {
  const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>Nouvelle Commande</h1>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
            <h2 style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Informations client</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Nom *" placeholder="Nom complet" value={order.clientName}
                onChange={e => setOrder(p => ({ ...p, clientName: e.target.value }))} />
              <Input label="Téléphone *" placeholder="+228 XX XX XX XX" value={order.clientPhone}
                onChange={e => setOrder(p => ({ ...p, clientPhone: e.target.value }))} />
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
            <h2 style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Services</h2>
            {SERVICES.map(svc => (
              <div key={svc.id} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, color: "#2563eb", marginBottom: 8, fontSize: 13 }}>{svc.name}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                  {svc.items.map((item, i) => (
                    <button key={i} onClick={() => addItem(svc, item)} style={{
                      border: "2px solid #bfdbfe", borderRadius: 8, padding: "9px 10px",
                      background: "#fff", cursor: "pointer", textAlign: "left",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 700 }}>{fmt(item.price)}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,.06)", alignSelf: "start", position: "sticky", top: 20 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Récapitulatif</h2>
          {order.items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
              <div style={{ fontSize: 32 }}>🛒</div>
              <div style={{ marginTop: 6, fontSize: 12 }}>Aucun article</div>
            </div>
          ) : (
            <div style={{ maxHeight: 240, overflowY: "auto", marginBottom: 10 }}>
              {order.items.map(item => (
                <div key={item.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 8, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{item.item}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{item.service}</div>
                    </div>
                    <button onClick={() => setOrder(p => ({ ...p, items: p.items.filter(x => x.id !== item.id) }))}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}>×</button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button onClick={() => setOrder(p => ({ ...p, items: p.items.map(x => x.id === item.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x) }))}
                        style={{ width: 24, height: 24, border: "1px solid #e2e8f0", borderRadius: 5, cursor: "pointer", background: "#f8fafc" }}>−</button>
                      <span style={{ fontWeight: 700, fontSize: 12 }}>{item.quantity}</span>
                      <button onClick={() => setOrder(p => ({ ...p, items: p.items.map(x => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x) }))}
                        style={{ width: 24, height: 24, border: "1px solid #e2e8f0", borderRadius: 5, cursor: "pointer", background: "#f8fafc" }}>+</button>
                    </div>
                    <span style={{ fontWeight: 700, color: "#2563eb", fontSize: 12 }}>{fmt(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 14, marginBottom: 10 }}>
              <span>TOTAL</span><span style={{ color: "#2563eb" }}>{fmt(total)}</span>
            </div>
            <Input label="Acompte" type="number" value={order.deposit} min={0} max={total}
              onChange={e => setOrder(p => ({ ...p, deposit: Number(e.target.value) }))} />
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Paiement</label>
              <select value={order.payment} onChange={e => setOrder(p => ({ ...p, payment: e.target.value }))}
                style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 13 }}>
                <option value="espèces">Espèces</option>
                <option value="mobile money">Mobile Money</option>
              </select>
            </div>
            <Button onClick={createOrder} style={{ width: "100%", padding: 11 }}>✅ Créer la commande</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
