import { fmt } from "../../utils/format.js";

export default function Dashboard({ profile, stats, orders, clients }) {
  const cards = [
    { icon: "📦", label: "Commandes aujourd'hui", val: stats.todayOrders, bg: "#2563eb" },
    { icon: "💰", label: "Revenu du jour", val: fmt(stats.todayRevenue), bg: "#16a34a" },
    { icon: "⏳", label: "En cours", val: stats.pending, bg: "#ea580c" },
    { icon: "✅", label: "Prêts", val: stats.ready, bg: "#7c3aed" },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>
        Bonjour {profile?.full_name?.split(" ")[0]} 👋
      </h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: c.bg, borderRadius: 14, padding: "18px 20px", color: "#fff", boxShadow: "0 4px 15px rgba(0,0,0,.1)" }}>
            <div style={{ fontSize: 26 }}>{c.icon}</div>
            <div style={{ fontSize: 11, opacity: .85, marginTop: 6 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{c.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Commandes récentes</h2>
          {orders.slice(0, 5).map(o => (
            <div key={o.id} style={{ borderLeft: "3px solid #2563eb", paddingLeft: 10, marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 11, color: "#2563eb", fontFamily: "monospace" }}>{o.ticket_number}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{o.client_name}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span style={{
                    background: o.status === "Prêt" ? "#dcfce7" : o.status === "En cours" ? "#fef3c7" : "#dbeafe",
                    color: o.status === "Prêt" ? "#16a34a" : o.status === "En cours" ? "#d97706" : "#2563eb",
                    padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                  }}>{o.status}</span>
                  <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{fmt(o.total)}</div>
                </div>
              </div>
            </div>
          ))}
          {orders.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: "16px 0", fontSize: 13 }}>Aucune commande</div>}
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Top clients</h2>
          {clients.slice(0, 5).map((c, i) => (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.total_orders} cmd</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, fontSize: 12 }}>{fmt(c.total_spent)}</div>
                <div style={{ fontSize: 11, color: "#2563eb" }}>{c.points} pts</div>
              </div>
            </div>
          ))}
          {clients.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: "16px 0", fontSize: 13 }}>Aucun client</div>}
        </div>
      </div>
    </div>
  );
}
