import { useState } from "react";
import { fmt } from "../../utils/format.js";

export default function OrderList({ orders, updateStatus, canEdit }) {
  const [search, setSearch] = useState("");

  const filteredOrders = search
    ? orders.filter(o =>
        o.ticket_number?.toLowerCase().includes(search.toLowerCase()) ||
        o.client_name?.toLowerCase().includes(search.toLowerCase())
      )
    : orders;

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>Commandes ({orders.length})</h1>
      <div style={{ background: "#fff", borderRadius: 14, padding: 12, marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Ticket ou nom client..."
          style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 14px", fontSize: 13, boxSizing: "border-box", outline: "none" }} />
      </div>
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Ticket", "Client", "Date", "Total", "Statut"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(o => (
              <tr key={o.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: 700, color: "#2563eb", fontSize: 11 }}>{o.ticket_number}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 600, fontSize: 12 }}>{o.client_name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{o.client_phone}</div>
                </td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ fontWeight: 700, fontSize: 12 }}>{fmt(o.total)}</div>
                  {Number(o.remaining) > 0 && <div style={{ fontSize: 10, color: "#ef4444" }}>Reste: {fmt(o.remaining)}</div>}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  {canEdit ? (
                    <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} style={{
                      border: "none", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                      background: o.status === "Prêt" ? "#dcfce7" : o.status === "En cours" ? "#fef3c7" : "#dbeafe",
                      color: o.status === "Prêt" ? "#16a34a" : o.status === "En cours" ? "#d97706" : "#2563eb",
                    }}>
                      <option>En cours</option><option>Prêt</option><option>Récupéré</option>
                    </select>
                  ) : (
                    <span style={{
                      background: o.status === "Prêt" ? "#dcfce7" : o.status === "En cours" ? "#fef3c7" : "#dbeafe",
                      color: o.status === "Prêt" ? "#16a34a" : o.status === "En cours" ? "#d97706" : "#2563eb",
                      padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                    }}>{o.status}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && <div style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>Aucune commande</div>}
      </div>
    </div>
  );
}
