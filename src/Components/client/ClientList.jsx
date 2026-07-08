import { fmt } from "../../utils/format.js";

export default function ClientList({ clients }) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>Clients ({clients.length})</h1>
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["#", "Nom", "Téléphone", "Commandes", "Total", "Points", "Réduction"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => {
              const disc = Math.floor(c.points / 100) * 5;
              return (
                <tr key={c.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "12px 14px", color: "#94a3b8", fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 600, fontSize: 13 }}>{c.name}</td>
                  <td style={{ padding: "12px 14px", fontSize: 12, color: "#475569" }}>{c.phone}</td>
                  <td style={{ padding: "12px 14px", textAlign: "center", fontWeight: 600, fontSize: 13 }}>{c.total_orders}</td>
                  <td style={{ padding: "12px 14px", fontWeight: 700, color: "#16a34a", fontSize: 12 }}>{fmt(c.total_spent)}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span style={{ background: "#dbeafe", color: "#2563eb", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{c.points} pts</span>
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    {disc > 0
                      ? <span style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{disc}% off</span>
                      : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {clients.length === 0 && <div style={{ textAlign: "center", padding: 36, color: "#94a3b8" }}>Aucun client</div>}
      </div>
    </div>
  );
}
