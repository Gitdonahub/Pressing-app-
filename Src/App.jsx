import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase.js";

const SERVICES = [
  { id: 1, name: "Nettoyage à sec", items: [
    { name: "Pantalon", price: 2500 }, { name: "Chemise", price: 2000 },
    { name: "Veste", price: 3500 }, { name: "Robe", price: 4000 },
    { name: "Costume complet", price: 8000 }, { name: "Manteau", price: 5000 },
  ]},
  { id: 2, name: "Repassage", items: [
    { name: "Pantalon", price: 1000 }, { name: "Chemise", price: 800 },
    { name: "Robe", price: 1500 }, { name: "Drap", price: 1200 },
  ]},
  { id: 3, name: "Lavage", items: [
    { name: "Kg de linge", price: 1500 }, { name: "Couverture", price: 3000 },
    { name: "Rideau", price: 2500 }, { name: "Tapis", price: 4000 },
  ]},
];

const genTicket = () => {
  const d = new Date();
  return `EL${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}${Math.floor(Math.random()*9999).toString().padStart(4,"0")}`;
};
const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, pending: 0, ready: 0 });
  const [order, setOrder] = useState({ clientName: "", clientPhone: "", items: [], payment: "espèces", deposit: 0 });
  const [search, setSearch] = useState("");
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: o }, { data: c }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("clients").select("*").order("total_spent", { ascending: false }),
      ]);
      setOrders(o || []);
      setClients(c || []);
      const today = new Date().toDateString();
      const tod = (o || []).filter(x => new Date(x.created_at).toDateString() === today);
      setStats({
        todayOrders: tod.length,
        todayRevenue: tod.reduce((s, x) => s + Number(x.total), 0),
        pending: (o || []).filter(x => x.status === "En cours").length,
        ready: (o || []).filter(x => x.status === "Prêt").length,
      });
    } catch (e) {
      showToast("Erreur de connexion", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0);

  const addItem = (svc, item) => {
    const exist = order.items.find(x => x.item === item.name && x.service === svc.name);
    if (exist) {
      setOrder(p => ({ ...p, items: p.items.map(x => x.item === item.name && x.service === svc.name ? { ...x, quantity: x.quantity + 1 } : x) }));
    } else {
      setOrder(p => ({ ...p, items: [...p.items, { id: Date.now(), service: svc.name, item: item.name, price: item.price, quantity: 1 }] }));
    }
  };

  const createOrder = async () => {
    if (!order.clientName || !order.clientPhone || order.items.length === 0) {
      showToast("Remplissez tous les champs obligatoires", "error"); return;
    }
    const ticket = genTicket();
    const points = Math.floor(total / 1000);
    try {
      const { data: existing } = await supabase.from("clients").select("*").eq("phone", order.clientPhone).single();
      let clientId = null;
      if (existing) {
        clientId = existing.id;
        await supabase.from("clients").update({
          points: existing.points + points,
          total_spent: Number(existing.total_spent) + total,
          total_orders: existing.total_orders + 1,
        }).eq("id", existing.id);
      } else {
        const { data: nc } = await supabase.from("clients").insert({
          name: order.clientName, phone: order.clientPhone,
          points, total_spent: total, total_orders: 1,
        }).select().single();
        clientId = nc?.id;
      }
      await supabase.from("orders").insert({
        ticket_number: ticket,
        client_id: clientId,
        client_name: order.clientName,
        client_phone: order.clientPhone,
        items: order.items,
        total,
        deposit: order.deposit,
        remaining: total - order.deposit,
        payment_method: order.payment,
        points_earned: points,
        pickup_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      });
      showToast(`✅ Commande ${ticket} créée ! +${points} pts`);
      setOrder({ clientName: "", clientPhone: "", items: [], payment: "espèces", deposit: 0 });
      fetchAll();
      setPage("orders");
    } catch (e) {
      showToast("Erreur lors de la création", "error");
    }
  };

  const updateStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    fetchAll();
  };

  const generateAIReport = async () => {
    setAiLoading(true);
    setAiReport(null);
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
    const totalRev = monthOrders.reduce((s, o) => s + Number(o.total), 0);
    const byService = {};
    monthOrders.forEach(o => (o.items || []).forEach(i => {
      byService[i.service] = (byService[i.service] || 0) + i.price * i.quantity;
    }));
    const statuses = { "En cours": 0, "Prêt": 0, "Récupéré": 0 };
    monthOrders.forEach(o => { statuses[o.status] = (statuses[o.status] || 0) + 1; });
    const reportData = {
      mois: `${month}/${year}`,
      totalCommandes: monthOrders.length,
      chiffreAffaires: totalRev,
      acomptesReçus: monthOrders.reduce((s, o) => s + Number(o.deposit), 0),
      resteAPercevoir: monthOrders.reduce((s, o) => s + Number(o.remaining), 0),
      revenusParService: byService,
      statutsCommandes: statuses,
      totalClients: clients.length,
      nouveauxClients: clients.filter(c => {
        const d = new Date(c.created_at);
        return d.getMonth() + 1 === month && d.getFullYear() === year;
      }).length,
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: `Tu es un analyste financier expert pour PME africaines. Analyse les données d'Elynis Pressing au Togo.
Réponds UNIQUEMENT en JSON valide (sans markdown) avec:
- resume: résumé exécutif (2-3 phrases)
- points_forts: tableau 3 points positifs
- points_faibles: tableau 3 points à améliorer
- suggestions: tableau 5 suggestions concrètes
- objectif_mois_prochain: un objectif chiffré`,
          messages: [{ role: "user", content: `Données du mois ${reportData.mois}:\n${JSON.stringify(reportData, null, 2)}` }],
        }),
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || "{}";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setAiReport({ ...parsed, raw: reportData });
      await supabase.from("monthly_reports").insert({
        month, year, report_data: reportData,
        ai_analysis: parsed.resume,
        ai_suggestions: JSON.stringify(parsed.suggestions),
        sent_to_email: ownerEmail || null,
      });
      showToast("Rapport IA généré et sauvegardé !");
    } catch (e) {
      showToast("Erreur lors de la génération IA", "error");
    }
    setAiLoading(false);
  };

  const filteredOrders = search
    ? orders.filter(o => o.ticket_number?.toLowerCase().includes(search.toLowerCase()) || o.client_name?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "newOrder", label: "Nouvelle commande", icon: "➕" },
    { id: "orders", label: "Commandes", icon: "📦" },
    { id: "clients", label: "Clients", icon: "👥" },
    { id: "rapport", label: "Rapport IA", icon: "🤖" },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI',sans-serif", background: "#f1f5f9" }}>
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "error" ? "#ef4444" : "#22c55e",
          color: "#fff", padding: "12px 20px", borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,.2)", fontWeight: 600, fontSize: 14,
        }}>{toast.msg}</div>
      )}

      {/* Sidebar */}
      <div style={{ width: 210, background: "#1e3a5f", display: "flex", flexDirection: "column", padding: "20px 0", flexShrink: 0 }}>
        <div style={{ textAlign: "center", padding: "0 16px 20px", borderBottom: "1px solid #2d4f7c" }}>
          <div style={{ fontSize: 32 }}>🧺</div>
          <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginTop: 6 }}>Elynis Pressing</div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>Système de gestion</div>
        </div>
        <nav style={{ padding: "14px 10px", flex: 1 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{
              width: "100%", textAlign: "left", padding: "10px 12px", marginBottom: 3,
              borderRadius: 8, border: "none", cursor: "pointer",
              background: page === n.id ? "#2563eb" : "transparent",
              color: page === n.id ? "#fff" : "#94a3b8",
              fontWeight: page === n.id ? 700 : 400,
              fontSize: 13, display: "flex", alignItems: "center", gap: 9,
            }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 12, borderTop: "1px solid #2d4f7c", color: "#64748b", fontSize: 11, textAlign: "center" }}>
          {new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12, color: "#64748b" }}>
            <div style={{ fontSize: 40 }}>⏳</div>
            <div style={{ fontSize: 16 }}>Connexion à Elynis Pressing...</div>
          </div>
        ) : (
          <>
            {page === "dashboard" && (
              <div style={{ padding: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>Tableau de Bord</h1>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                  {[
                    { icon: "📦", label: "Commandes aujourd'hui", val: stats.todayOrders, bg: "#2563eb" },
                    { icon: "💰", label: "Revenu du jour", val: fmt(stats.todayRevenue), bg: "#16a34a" },
                    { icon: "⏳", label: "En cours", val: stats.pending, bg: "#ea580c" },
                    { icon: "✅", label: "Prêts", val: stats.ready, bg: "#7c3aed" },
                  ].map((c, i) => (
                    <div key={i} style={{ background: c.bg, borderRadius: 14, padding: "20px 24px", color: "#fff", boxShadow: "0 4px 15px rgba(0,0,0,.12)" }}>
                      <div style={{ fontSize: 28 }}>{c.icon}</div>
                      <div style={{ fontSize: 12, opacity: .85, marginTop: 8 }}>{c.label}</div>
                      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{c.val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                  <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#1e293b" }}>Commandes récentes</h2>
                    {orders.slice(0, 5).map(o => (
                      <div key={o.id} style={{ borderLeft: "4px solid #2563eb", paddingLeft: 12, marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 12, color: "#2563eb", fontFamily: "monospace" }}>{o.ticket_number}</div>
                            <div style={{ fontSize: 13, color: "#475569" }}>{o.client_name}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <span style={{
                              background: o.status === "Prêt" ? "#dcfce7" : o.status === "En cours" ? "#fef3c7" : "#dbeafe",
                              color: o.status === "Prêt" ? "#16a34a" : o.status === "En cours" ? "#d97706" : "#2563eb",
                              padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                            }}>{o.status}</span>
                            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 3 }}>{fmt(o.total)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>Aucune commande</div>}
                  </div>
                  <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, color: "#1e293b" }}>Top clients</h2>
                    {clients.slice(0, 5).map((c, i) => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.total_orders} commandes</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt(c.total_spent)}</div>
                          <div style={{ fontSize: 11, color: "#2563eb" }}>{c.points} pts</div>
                        </div>
                      </div>
                    ))}
                    {clients.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: "20px 0" }}>Aucun client</div>}
                  </div>
                </div>
              </div>
            )}

            {page === "newOrder" && (
              <div style={{ padding: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>Nouvelle Commande</h1>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18 }}>
                  <div>
                    <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                      <h2 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Informations client</h2>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        {[["Nom du client *", "clientName", "text", "Nom complet"], ["Téléphone *", "clientPhone", "tel", "+228 XX XX XX XX"]].map(([lbl, key, type, ph]) => (
                          <div key={key}>
                            <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 5, color: "#374151" }}>{lbl}</label>
                            <input type={type} value={order[key]} placeholder={ph}
                              onChange={e => setOrder(p => ({ ...p, [key]: e.target.value }))}
                              style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                      <h2 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Services</h2>
                      {SERVICES.map(svc => (
                        <div key={svc.id} style={{ marginBottom: 18 }}>
                          <div style={{ fontWeight: 700, color: "#2563eb", marginBottom: 8, fontSize: 14 }}>{svc.name}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                            {svc.items.map((item, i) => (
                              <button key={i} onClick={() => addItem(svc, item)} style={{
                                border: "2px solid #bfdbfe", borderRadius: 10, padding: "10px 12px",
                                background: "#fff", cursor: "pointer", textAlign: "left",
                              }}>
                                <div style={{ fontSize: 12, fontWeight: 600 }}>{item.name}</div>
                                <div style={{ fontSize: 13, color: "#2563eb", fontWeight: 700, marginTop: 2 }}>{fmt(item.price)}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.06)", alignSelf: "start", position: "sticky", top: 20 }}>
                    <h2 style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>Récapitulatif</h2>
                    {order.items.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8" }}>
                        <div style={{ fontSize: 36 }}>🛒</div>
                        <div style={{ marginTop: 8, fontSize: 13 }}>Aucun article</div>
                      </div>
                    ) : (
                      <div style={{ maxHeight: 260, overflowY: "auto", marginBottom: 12 }}>
                        {order.items.map(item => (
                          <div key={item.id} style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 10, marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 600 }}>{item.item}</div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.service}</div>
                              </div>
                              <button onClick={() => setOrder(p => ({ ...p, items: p.items.filter(x => x.id !== item.id) }))}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", fontSize: 18 }}>×</button>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <button onClick={() => setOrder(p => ({ ...p, items: p.items.map(x => x.id === item.id ? { ...x, quantity: Math.max(1, x.quantity - 1) } : x) }))}
                                  style={{ width: 26, height: 26, border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", background: "#f8fafc", fontWeight: 700 }}>−</button>
                                <span style={{ fontWeight: 700 }}>{item.quantity}</span>
                                <button onClick={() => setOrder(p => ({ ...p, items: p.items.map(x => x.id === item.id ? { ...x, quantity: x.quantity + 1 } : x) }))}
                                  style={{ width: 26, height: 26, border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", background: "#f8fafc", fontWeight: 700 }}>+</button>
                              </div>
                              <span style={{ fontWeight: 700, color: "#2563eb", fontSize: 13 }}>{fmt(item.price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div style={{ borderTop: "2px solid #f1f5f9", paddingTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                        <span>TOTAL</span><span style={{ color: "#2563eb" }}>{fmt(total)}</span>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Acompte versé</label>
                        <input type="number" value={order.deposit} min={0} max={total}
                          onChange={e => setOrder(p => ({ ...p, deposit: Number(e.target.value) }))}
                          style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 14, boxSizing: "border-box" }} />
                        {total > 0 && <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>Reste: {fmt(total - order.deposit)}</div>}
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 4 }}>Mode de paiement</label>
                        <select value={order.payment} onChange={e => setOrder(p => ({ ...p, payment: e.target.value }))}
                          style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", fontSize: 14 }}>
                          <option value="espèces">Espèces</option>
                          <option value="mobile money">Mobile Money</option>
                        </select>
                      </div>
                      <button onClick={createOrder} style={{
                        width: "100%", background: "#2563eb", color: "#fff",
                        border: "none", borderRadius: 10, padding: "12px",
                        fontSize: 14, fontWeight: 700, cursor: "pointer",
                      }}>✅ Créer la commande</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {page === "orders" && (
              <div style={{ padding: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>Commandes ({orders.length})</h1>
                <div style={{ background: "#fff", borderRadius: 14, padding: 14, marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="🔍 Rechercher par ticket ou client..."
                    style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, boxSizing: "border-box", outline: "none" }} />
                </div>
                <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Ticket", "Client", "Date", "Articles", "Total", "Statut"].map(h => (
                          <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => (
                        <tr key={o.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "13px 14px", fontFamily: "monospace", fontWeight: 700, color: "#2563eb", fontSize: 12 }}>{o.ticket_number}</td>
                          <td style={{ padding: "13px 14px" }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{o.client_name}</div>
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{o.client_phone}</div>
                          </td>
                          <td style={{ padding: "13px 14px", fontSize: 12, color: "#475569" }}>{new Date(o.created_at).toLocaleDateString("fr-FR")}</td>
                          <td style={{ padding: "13px 14px", fontSize: 13 }}>{(o.items || []).length} art.</td>
                          <td style={{ padding: "13px 14px" }}>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt(o.total)}</div>
                            {Number(o.remaining) > 0 && <div style={{ fontSize: 11, color: "#ef4444" }}>Reste: {fmt(o.remaining)}</div>}
                          </td>
                          <td style={{ padding: "13px 14px" }}>
                            <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} style={{
                              border: "none", borderRadius: 20, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer",
                              background: o.status === "Prêt" ? "#dcfce7" : o.status === "En cours" ? "#fef3c7" : "#dbeafe",
                              color: o.status === "Prêt" ? "#16a34a" : o.status === "En cours" ? "#d97706" : "#2563eb",
                            }}>
                              <option>En cours</option><option>Prêt</option><option>Récupéré</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredOrders.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucune commande</div>}
                </div>
              </div>
            )}

            {page === "clients" && (
              <div style={{ padding: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>Clients ({clients.length})</h1>
                <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["#", "Nom", "Téléphone", "Commandes", "Total dépensé", "Points", "Réduction"].map(h => (
                          <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((c, i) => {
                        const disc = Math.floor(c.points / 100) * 5;
                        return (
                          <tr key={c.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "13px 14px", fontWeight: 700, color: "#94a3b8" }}>{i + 1}</td>
                            <td style={{ padding: "13px 14px", fontWeight: 600, fontSize: 13 }}>{c.name}</td>
                            <td style={{ padding: "13px 14px", fontSize: 13, color: "#475569" }}>{c.phone}</td>
                            <td style={{ padding: "13px 14px", textAlign: "center", fontWeight: 600 }}>{c.total_orders}</td>
                            <td style={{ padding: "13px 14px", fontWeight: 700, color: "#16a34a", fontSize: 13 }}>{fmt(c.total_spent)}</td>
                            <td style={{ padding: "13px 14px" }}>
                              <span style={{ background: "#dbeafe", color: "#2563eb", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{c.points} pts</span>
                            </td>
                            <td style={{ padding: "13px 14px" }}>
                              {disc > 0
                                ? <span style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{disc}% off</span>
                                : <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {clients.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Aucun client</div>}
                </div>
              </div>
            )}

            {page === "rapport" && (
              <div style={{ padding: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6, color: "#1e293b" }}>🤖 Rapport IA Mensuel</h1>
                <p style={{ color: "#64748b", marginBottom: 20, fontSize: 14 }}>Analyse financière — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
                <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 18, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, display: "block", marginBottom: 6 }}>📧 Email du propriétaire</label>
                      <input type="email" value={ownerEmail} onChange={e => setOwnerEmail(e.target.value)}
                        placeholder="proprietaire@gmail.com"
                        style={{ width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 14, boxSizing: "border-box" }} />
                    </div>
                    <button onClick={generateAIReport} disabled={aiLoading} style={{
                      background: aiLoading ? "#94a3b8" : "#7c3aed", color: "#fff",
                      border: "none", borderRadius: 10, padding: "11px 20px",
                      fontSize: 14, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", whiteSpace: "nowrap",
                    }}>
                      {aiLoading ? "⏳ Analyse..." : "🤖 Générer le rapport"}
                    </button>
                  </div>
                </div>
                {aiReport && (
                  <div style={{ display: "grid", gap: 16 }}>
                    <div style={{ background: "linear-gradient(135deg,#7c3aed,#2563eb)", borderRadius: 14, padding: 22, color: "#fff" }}>
                      <div style={{ fontSize: 11, opacity: .8, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Résumé exécutif</div>
                      <p style={{ fontSize: 15, lineHeight: 1.7 }}>{aiReport.resume}</p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                        <h3 style={{ fontWeight: 700, color: "#16a34a", marginBottom: 12, fontSize: 14 }}>✅ Points forts</h3>
                        {(aiReport.points_forts || []).map((p, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <span style={{ color: "#16a34a", fontWeight: 700 }}>+</span>
                            <span style={{ fontSize: 13 }}>{p}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                        <h3 style={{ fontWeight: 700, color: "#dc2626", marginBottom: 12, fontSize: 14 }}>⚠️ À améliorer</h3>
                        {(aiReport.points_faibles || []).map((p, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                            <span style={{ color: "#dc2626", fontWeight: 700 }}>!</span>
                            <span style={{ fontSize: 13 }}>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                      <h3 style={{ fontWeight: 700, color: "#2563eb", marginBottom: 12, fontSize: 14 }}>💡 Suggestions</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        {(aiReport.suggestions || []).map((s, i) => (
                          <div key={i} style={{ background: "#eff6ff", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10 }}>
                            <span style={{ background: "#2563eb", color: "#fff", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                            <span style={{ fontSize: 13 }}>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: "#fef3c7", border: "2px solid #f59e0b", borderRadius: 14, padding: 18 }}>
                      <h3 style={{ fontWeight: 700, color: "#d97706", marginBottom: 8, fontSize: 14 }}>🎯 Objectif mois prochain</h3>
                      <p style={{ fontSize: 14, color: "#92400e" }}>{aiReport.objectif_mois_prochain}</p>
                    </div>
                  </div>
                )}
                {!aiReport && !aiLoading && (
                  <div style={{ textAlign: "center", padding: "50px 0", color: "#94a3b8" }}>
                    <div style={{ fontSize: 56 }}>🤖</div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginTop: 12 }}>Prêt à analyser vos données</div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>Cliquez sur "Générer le rapport" pour commencer</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
    }
