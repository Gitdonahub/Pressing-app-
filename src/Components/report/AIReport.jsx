import Button from "../ui/Button.jsx";

export default function AIReport({ pressing, aiReport, aiLoading, generateAIReport }) {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: "#1e293b" }}>🤖 Rapport IA Mensuel</h1>
      <p style={{ color: "#64748b", marginBottom: 20, fontSize: 13 }}>
        Analyse de {pressing?.name} — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
      </p>
      <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 18, boxShadow: "0 2px 8px rgba(0,0,0,.06)", display: "flex", justifyContent: "flex-end" }}>
        <Button variant="purple" onClick={generateAIReport} disabled={aiLoading} style={{ padding: "11px 24px" }}>
          {aiLoading ? "⏳ Analyse en cours..." : "🤖 Générer le rapport"}
        </Button>
      </div>

      {aiReport && (
        <div style={{ display: "grid", gap: 14 }}>
          <div style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)", borderRadius: 14, padding: 22, color: "#fff" }}>
            <div style={{ fontSize: 11, opacity: .8, marginBottom: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Résumé exécutif</div>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>{aiReport.resume}</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
              <h3 style={{ fontWeight: 700, color: "#16a34a", marginBottom: 10, fontSize: 13 }}>✅ Points forts</h3>
              {(aiReport.points_forts || []).map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                  <span style={{ color: "#16a34a", fontWeight: 700 }}>+</span>
                  <span style={{ fontSize: 12 }}>{p}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
              <h3 style={{ fontWeight: 700, color: "#dc2626", marginBottom: 10, fontSize: 13 }}>⚠️ À améliorer</h3>
              {(aiReport.points_faibles || []).map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
                  <span style={{ color: "#dc2626", fontWeight: 700 }}>!</span>
                  <span style={{ fontSize: 12 }}>{p}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
            <h3 style={{ fontWeight: 700, color: "#2563eb", marginBottom: 12, fontSize: 13 }}>💡 Suggestions</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {(aiReport.suggestions || []).map((s, i) => (
                <div key={i} style={{ background: "#eff6ff", borderRadius: 10, padding: "11px 13px", display: "flex", gap: 10 }}>
                  <span style={{ background: "#2563eb", color: "#fff", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: 12 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: "#fef3c7", border: "2px solid #f59e0b", borderRadius: 14, padding: 18 }}>
            <h3 style={{ fontWeight: 700, color: "#d97706", marginBottom: 6, fontSize: 13 }}>🎯 Objectif mois prochain</h3>
            <p style={{ fontSize: 13, color: "#92400e" }}>{aiReport.objectif_mois_prochain}</p>
          </div>
        </div>
      )}

      {!aiReport && !aiLoading && (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
          <div style={{ fontSize: 52 }}>🤖</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>Prêt à analyser</div>
          <div style={{ fontSize: 12, marginTop: 6 }}>Cliquez sur "Générer le rapport"</div>
        </div>
      )}
    </div>
  );
}
