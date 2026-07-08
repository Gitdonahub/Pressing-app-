import { useState } from "react";

export default function Sidebar({ pressing, profile, isOwner, page, setPage, nav, logout }) {
  const [open, setOpen] = useState(true);

  return (
    <>
      {/* Bouton toggle - toujours visible */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: "fixed", top: 16, left: open ? 232 : 12, zIndex: 1100,
          width: 36, height: 36, borderRadius: 8, border: "none",
          background: "#1e3a5f", color: "#fff", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, boxShadow: "0 2px 8px rgba(0,0,0,.2)",
          transition: "left .2s ease",
        }}
        aria-label={open ? "Cacher le menu" : "Afficher le menu"}
      >
        {open ? "‹" : "☰"}
      </button>

      {/* Overlay mobile quand ouvert */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.35)",
            zIndex: 999, display: "none",
          }}
          className="sidebar-overlay"
        />
      )}

      <div style={{
        width: open ? 220 : 0, background: "#1e3a5f", display: "flex",
        flexDirection: "column", flexShrink: 0, overflow: "hidden",
        transition: "width .2s ease", position: "relative", zIndex: 1000,
      }}>
        <div style={{ width: 220, padding: "24px 16px 20px", borderBottom: "1px solid #2d4f7c", textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>🧺</div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginTop: 6 }}>QuickWash</div>
          <div style={{ color: "#60a5fa", fontSize: 12, marginTop: 2, fontWeight: 600 }}>{pressing?.name}</div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{pressing?.city}</div>
        </div>
        <nav style={{ width: 220, padding: "14px 10px", flex: 1 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); if (window.innerWidth < 768) setOpen(false); }} style={{
              width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 3,
              borderRadius: 8, border: "none", cursor: "pointer",
              background: page === n.id ? "#2563eb" : "transparent",
              color: page === n.id ? "#fff" : "#94a3b8",
              fontWeight: page === n.id ? 700 : 400,
              fontSize: 13, display: "flex", alignItems: "center", gap: 9,
              whiteSpace: "nowrap",
            }}>
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div style={{ width: 220, padding: "12px 16px", borderTop: "1px solid #2d4f7c" }}>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>
            <div style={{ fontWeight: 600, color: "#cbd5e1" }}>{profile?.full_name}</div>
            <div style={{ fontSize: 11 }}>{isOwner ? "👑 Propriétaire" : "👷 Employé"}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "7px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            🚪 Déconnexion
          </button>
        </div>
      </div>
    </>
  );
}
