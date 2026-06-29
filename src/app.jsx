import { useState, useEffect, useCallback } from "react";
import { supabase } from "./Lib/supabase.js";

// ─── CONSTANTES ───────────────────────────────────────────────
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

const PERMISSION_LABELS = {
  can_create_orders: "Créer des commandes",
  can_view_orders: "Voir les commandes",
  can_edit_orders: "Modifier le statut des commandes",
  can_view_clients: "Voir les clients",
  can_manage_inventory: "Gérer les stocks",
  can_view_reports: "Voir les rapports financiers",
  can_manage_staff: "Gérer le personnel",
};

const genTicket = () => {
  const d = new Date();
  return `QW${d.getFullYear().toString().slice(-2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}${Math.floor(Math.random()*9999).toString().padStart(4,"0")}`;
};
const fmt = (n) => Number(n || 0).toLocaleString("fr-FR") + " FCFA";

// ─── COMPOSANTS UI ────────────────────────────────────────────
const Toast = ({ toast }) => toast ? (
  <div style={{
    position: "fixed", top: 20, right: 20, zIndex: 9999,
    background: toast.type === "error" ? "#ef4444" : "#22c55e",
    color: "#fff", padding: "12px 20px", borderRadius: 10,
    boxShadow: "0 4px 20px rgba(0,0,0,.2)", fontWeight: 600, fontSize: 14,
    maxWidth: 320,
  }}>{toast.msg}</div>
) : null;

const Input = ({ label, ...props }) => (
  <div style={{ marginBottom: 14 }}>
    {label && <label style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 5, color: "#374151" }}>{label}</label>}
    <input {...props} style={{
      width: "100%", border: "1.5px solid #e2e8f0", borderRadius: 8,
      padding: "10px 14px", fontSize: 14, boxSizing: "border-box", outline: "none",
      fontFamily: "inherit", ...props.style
    }} />
  </div>
);

const Btn = ({ children, variant = "primary", ...props }) => {
  const bg = variant === "primary" ? "#2563eb" : variant === "danger" ? "#ef4444" : variant === "purple" ? "#7c3aed" : "#f1f5f9";
  const color = variant === "ghost" ? "#374151" : "#fff";
  return (
    <button {...props} style={{
      background: props.disabled ? "#94a3b8" : bg, color,
      border: "none", borderRadius: 8, padding: "10px 18px",
      fontSize: 14, fontWeight: 600, cursor: props.disabled ? "not-allowed" : "pointer",
      transition: "opacity .2s", ...props.style,
    }}>{children}</button>
  );
};

// ─── PAGE AUTH ────────────────────────────────────────────────
const AuthPage = ({ showToast }) => {
  const [mode, setMode] = useState("login"); // login | register
  const [step, setStep] = useState(1); // register: 1=compte, 2=pressing
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "",
    pressingName: "", city: "", phone: "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.password) { showToast("Remplissez tous les champs", "error"); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (error) showToast(error.message, "error");
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!form.pressingName || !form.city) { showToast("Remplissez les infos du pressing", "error"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (error) throw error;
      const userId = data.user?.id;

      // Créer le pressing
      const { data: pressing, error: pErr } = await supabase.from("pressings").insert({
        name: form.pressingName, email: form.email,
        phone: form.phone, city: form.city,
        owner_id: userId,
      }).select().single();
      if (pErr) throw pErr;

      // Créer le profil propriétaire
      await supabase.from("profiles").insert({
        id: userId, pressing_id: pressing.id,
        full_name: form.fullName, email: form.email, role: "owner",
      });

      showToast("Compte créé avec succès ! Connectez-vous.");
      setMode("login");
    } catch (e) {
      showToast(e.message, "error");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#1e3a5f,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: 36, width: "100%", maxWidth: 420, boxShadow: "0 20px 60px rgba(0,0,0,.2)" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🧺</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e3a5f", margin: "8px 0 4px" }}>QuickWash</h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>Plateforme de gestion de pressing</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {[["login","Connexion"],["register","Inscription"]].map(([m, lbl]) => (
            <button key={m} onClick={() => { setMode(m); setStep(1); }} style={{
              flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#1e3a5f" : "#64748b",
              fontWeight: mode === m ? 700 : 400, fontSize: 14,
              boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,.08)" : "none",
            }}>{lbl}</button>
          ))}
        </div>

        {mode === "login" ? (
          <>
            <Input label="Email" type="email" placeholder="votre@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
            <Input label="Mot de passe" type="password" placeholder="••••••••" value={form.password} onChange={e => set("password", e.target.value)} />
            <Btn onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: 12, fontSize: 15 }}>
              {loading ? "Connexion..." : "Se connecter"}
            </Btn>
          </>
        ) : (
          <>
            {/* Indicateur d'étape */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 8 }}>
              {[1, 2].map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, flex: s < 2 ? 1 : "none" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: step >= s ? "#2563eb" : "#e2e8f0",
                    color: step >= s ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 13,
                  }}>{s}</div>
                  <span style={{ fontSize: 12, color: step >= s ? "#2563eb" : "#94a3b8", fontWeight: step === s ? 700 : 400 }}>
                    {s === 1 ? "Votre compte" : "Votre pressing"}
                  </span>
                  {s < 2 && <div style={{ flex: 1, height: 2, background: step > s ? "#2563eb" : "#e2e8f0", borderRadius: 2 }} />}
                </div>
              ))}
            </div>

            {step === 1 ? (
              <>
                <Input label="Nom complet *" placeholder="Jean Dupont" value={form.fullName} onChange={e => set("fullName", e.target.value)} />
                <Input label="Email *" type="email" placeholder="votre@email.com" value={form.email} onChange={e => set("email", e.target.value)} />
                <Input label="Mot de passe *" type="password" placeholder="Min. 6 caractères" value={form.password} onChange={e => set("password", e.target.value)} />
                <Btn onClick={() => {
                  if (!form.fullName || !form.email || !form.password) { showToast("Remplissez tous les champs", "error"); return; }
                  setStep(2);
                }} style={{ width: "100%", padding: 12 }}>
                  Suivant →
                </Btn>
              </>
            ) : (
              <>
                <Input label="Nom du pressing *" placeholder="Ex: Pressing Moderne" value={form.pressingName} onChange={e => set("pressingName", e.target.value)} />
                <Input label="Ville *" placeholder="Ex: Lomé" value={form.city} onChange={e => set("city", e.target.value)} />
                <Input label="Téléphone" placeholder="+228 XX XX XX XX" value={form.phone} onChange={e => set("phone", e.target.value)} />
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn variant="ghost" onClick={() => setStep(1)} style={{ flex: 1, padding: 12 }}>← Retour</Btn>
                  <Btn onClick={handleRegister} disabled={loading} style={{ flex: 2, padding: 12 }}>
                    {loading ? "Création..." : "🚀 Créer mon pressing"}
                  </Btn>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// ─── APP PRINCIPALE ──────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pressing, setPressing] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, pending: 0, ready: 0 });
  const [order, setOrder] = useState({ clientName: "", clientPhone: "", items: [], payment: "espèces", deposit: 0 });
  const [search, setSearch] = useState("");
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal ajout employé
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ fullName: "", email: "", password: "" });
  const [newPerms, setNewPerms] = useState({
    can_create_orders: true, can_view_orders: true, can_edit_orders: true,
    can_view_clients: true, can_manage_inventory: false,
    can_view_reports: false, can_manage_staff: false,
  });
  // Modal édition permissions
  const [editPermsFor, setEditPermsFor] = useState(null);
  const [editPerms, setEditPerms] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Charger profil & pressing
  useEffect(() => {
    if (!session) { setLoading(false); return; }
    const loadProfile = async () => {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", session.user.id).single();
      setProfile(prof);
      if (prof?.pressing_id) {
        const { data: press } = await supabase.from("pressings").select("*").eq("id", prof.pressing_id).single();
        setPressing(press);
        if (prof.role === "employee") {
          const { data: perms } = await supabase.from("permissions").select("*").eq("employee_id", prof.id).single();
          setPermissions(perms);
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, [session]);

  const isOwner = profile?.role === "owner";
  const can = (perm) => isOwner || permissions?.[perm] === true;

  // Charger données
  const fetchAll = useCallback(async () => {
    if (!pressing?.id) return;
    const [{ data: o }, { data: c }, { data: s }] = await Promise.all([
      supabase.from("orders").select("*").eq("pressing_id", pressing.id).order("created_at", { ascending: false }),
      supabase.from("clients").select("*").eq("pressing_id", pressing.id).order("total_spent", { ascending: false }),
      supabase.from("profiles").select("*, permissions(*)").eq("pressing_id", pressing.id).eq("role", "employee"),
    ]);
    setOrders(o || []);
    setClients(c || []);
    setStaff(s || []);
    const today = new Date().toDateString();
    const tod = (o || []).filter(x => new Date(x.created_at).toDateString() === today);
    setStats({
      todayOrders: tod.length,
      todayRevenue: tod.reduce((s, x) => s + Number(x.total), 0),
      pending: (o || []).filter(x => x.status === "En cours").length,
      ready: (o || []).filter(x => x.status === "Prêt").length,
    });
  }, [pressing?.id]);

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
      showToast("Remplissez tous les champs", "error"); return;
    }
    const ticket = genTicket();
    const points = Math.floor(total / 1000);
    try {
      const { data: existing } = await supabase.from("clients").select("*").eq("phone", order.clientPhone).eq("pressing_id", pressing.id).single();
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
          pressing_id: pressing.id, points, total_spent: total, total_orders: 1,
        }).select().single();
        clientId = nc?.id;
      }
      await supabase.from("orders").insert({
        ticket_number: ticket, client_id: clientId,
        client_name: order.clientName, client_phone: order.clientPhone,
        pressing_id: pressing.id, items: order.items, total,
        deposit: order.deposit, remaining: total - order.deposit,
        payment_method: order.payment, points_earned: points,
        pickup_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      });
      showToast(`✅ Commande ${ticket} créée ! +${points} pts`);
      setOrder({ clientName: "", clientPhone: "", items: [], payment: "espèces", deposit: 0 });
      fetchAll(); setPage("orders");
    } catch (e) { showToast("Erreur lors de la création", "error"); }
  };

  const updateStatus = async (id, status) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    fetchAll();
  };

  const addEmployee = async () => {
    if (!newStaff.fullName || !newStaff.email || !newStaff.password) {
      showToast("Remplissez tous les champs", "error"); return;
    }
    try {
      const { data, error } = await supabase.auth.signUp({ email: newStaff.email, password: newStaff.password });
      if (error) throw error;
      const empId = data.user?.id;
      await supabase.from("profiles").insert({
        id: empId, pressing_id: pressing.id,
        full_name: newStaff.fullName, email: newStaff.email, role: "employee",
      });
      await supabase.from("permissions").insert({ ...newPerms, pressing_id: pressing.id, employee_id: empId });
      showToast("Employé ajouté avec succès !");
      setShowAddStaff(false);
      setNewStaff({ fullName: "", email: "", password: "" });
      fetchAll();
    } catch (e) { showToast(e.message, "error"); }
  };

  const savePermissions = async () => {
    await supabase.from("permissions").update(editPerms).eq("employee_id", editPermsFor.id);
    showToast("Permissions mises à jour !");
    setEditPermsFor(null);
    fetchAll();
  };

  const generateAIReport = async () => {
    setAiLoading(true); setAiReport(null);
    const now = new Date();
    const month = now.getMonth() + 1, year = now.getFullYear();
    const monthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
    const byService = {};
    monthOrders.forEach(o => (o.items || []).forEach(i => {
      byService[i.service] = (byService[i.service] || 0) + i.price * i.quantity;
    }));
    const reportData = {
      pressing: pressing?.name, mois: `${month}/${year}`,
      totalCommandes: monthOrders.length,
      chiffreAffaires: monthOrders.reduce((s, o) => s + Number(o.total), 0),
      acomptesReçus: monthOrders.reduce((s, o) => s + Number(o.deposit), 0),
      resteAPercevoir: monthOrders.reduce((s, o) => s + Number(o.remaining), 0),
      revenusParService: byService,
      totalClients: clients.length,
      totalEmployes: staff.length,
    };
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6", max_tokens: 1000,
          system: `Tu es un analyste financier expert pour PME africaines. Analyse les données de ${pressing?.name} sur la plateforme QuickWash au Togo. Réponds UNIQUEMENT en JSON valide sans markdown avec: resume, points_forts (array 3), points_faibles (array 3), suggestions (array 5), objectif_mois_prochain`,
          messages: [{ role: "user", content: JSON.stringify(reportData) }],
        }),
      });
      const data = await res.json();
      const parsed = JSON.parse(data.content?.[0]?.text?.replace(/```json|```/g, "").trim() || "{}");
      setAiReport({ ...parsed, raw: reportData });
      await supabase.from("monthly_reports").insert({
        month, year, pressing_id: pressing.id,
        report_data: reportData, ai_analysis: parsed.resume,
        ai_suggestions: JSON.stringify(parsed.suggestions),
      });
      showToast("Rapport IA généré !");
    } catch (e) { showToast("Erreur IA", "error"); }
    setAiLoading(false);
  };

  const logout = async () => { await supabase.auth.signOut(); setProfile(null); setPressing(null); };
  const filteredOrders = search
    ? orders.filter(o => o.ticket_number?.toLowerCase().includes(search.toLowerCase()) || o.client_name?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  // Navigation selon rôle et permissions
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "📊", show: true },
    { id: "newOrder", label: "Nouvelle commande", icon: "➕", show: can("can_create_orders") },
    { id: "orders", label: "Commandes", icon: "📦", show: can("can_view_orders") },
    { id: "clients", label: "Clients", icon: "👥", show: can("can_view_clients") },
    { id: "staff", label: "Personnel", icon: "👔", show: isOwner },
    { id: "rapport", label: "Rapport IA", icon: "🤖", show: isOwner || can("can_view_reports") },
  ].filter(n => n.show);

  if (!session) return <AuthPage showToast={showToast} />;
  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", flexDirection: "column", gap: 12, color: "#64748b" }}>
      <div style={{ fontSize: 40 }}>⏳</div>
      <div>Chargement de QuickWash...</div>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Segoe UI',sans-serif", background: "#f1f5f9" }}>
      <Toast toast={toast} />

      {/* Modal ajout employé */}
      {showAddStaff && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>👔 Ajouter un employé</h2>
            <Input label="Nom complet *" value={newStaff.fullName} onChange={e => setNewStaff(p => ({ ...p, fullName: e.target.value }))} placeholder="Nom de l'employé" />
            <Input label="Email *" type="email" value={newStaff.email} onChange={e => setNewStaff(p => ({ ...p, email: e.target.value }))} placeholder="email@exemple.com" />
            <Input label="Mot de passe *" type="password" value={newStaff.password} onChange={e => setNewStaff(p => ({ ...p, password: e.target.value }))} placeholder="Min. 6 caractères" />
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 10, color: "#374151" }}>🔐 Permissions</label>
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
                  <input type="checkbox" checked={newPerms[key]} onChange={e => setNewPerms(p => ({ ...p, [key]: e.target.checked }))}
                    style={{ width: 16, height: 16, accentColor: "#2563eb" }} />
                  <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              <Btn variant="ghost" onClick={() => setShowAddStaff(false)} style={{ flex: 1 }}>Annuler</Btn>
              <Btn onClick={addEmployee} style={{ flex: 2 }}>✅ Ajouter l'employé</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Modal édition permissions */}
      {editPermsFor && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 6, color: "#1e293b" }}>🔐 Permissions — {editPermsFor.full_name}</h2>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Cochez les accès autorisés pour cet employé</p>
            {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
                <input type="checkbox" checked={editPerms[key] || false} onChange={e => setEditPerms(p => ({ ...p, [key]: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: "#2563eb" }} />
                <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
              </label>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <Btn variant="ghost" onClick={() => setEditPermsFor(null)} style={{ flex: 1 }}>Annuler</Btn>
              <Btn onClick={savePermissions} style={{ flex: 2 }}>💾 Enregistrer</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div style={{ width: 220, background: "#1e3a5f", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "24px 16px 20px", borderBottom: "1px solid #2d4f7c", textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>🧺</div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginTop: 6 }}>QuickWash</div>
          <div style={{ color: "#60a5fa", fontSize: 12, marginTop: 2, fontWeight: 600 }}>{pressing?.name}</div>
          <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{pressing?.city}</div>
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
              <span>{n.icon}</span> {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid #2d4f7c" }}>
          <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 8 }}>
            <div style={{ fontWeight: 600, color: "#cbd5e1" }}>{profile?.full_name}</div>
            <div style={{ fontSize: 11 }}>{isOwner ? "👑 Propriétaire" : "👷 Employé"}</div>
          </div>
          <button onClick={logout} style={{ width: "100%", background: "#dc2626", color: "#fff", border: "none", borderRadius: 6, padding: "7px", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            🚪 Déconnexion
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, overflow: "auto" }}>

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>
              Bonjour {profile?.full_name?.split(" ")[0]} 👋
            </h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { icon: "📦", label: "Commandes aujourd'hui", val: stats.todayOrders, bg: "#2563eb" },
                { icon: "💰", label: "Revenu du jour", val: fmt(stats.todayRevenue), bg: "#16a34a" },
                { icon: "⏳", label: "En cours", val: stats.pending, bg: "#ea580c" },
                { icon: "✅", label: "Prêts", val: stats.ready, bg: "#7c3aed" },
              ].map((c, i) => (
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
        )}

        {/* NOUVELLE COMMANDE */}
        {page === "newOrder" && can("can_create_orders") && (
          <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20, color: "#1e293b" }}>Nouvelle Commande</h1>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 18 }}>
              <div>
                <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 16, boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                  <h2 style={{ fontWeight: 700, marginBottom: 14, fontSize: 14 }}>Informations client</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <Input label="Nom *" placeholder="Nom complet" value={order.clientName} onChange={e => setOrder(p => ({ ...p, clientName: e.target.value }))} />
                    <Input label="Téléphone *" placeholder="+228 XX XX XX XX" value={order.clientPhone} onChange={e => setOrder(p => ({ ...p, clientPhone: e.target.value }))} />
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
                  <Btn onClick={createOrder} style={{ width: "100%", padding: 11 }}>✅ Créer la commande</Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COMMANDES */}
        {page === "orders" && can("can_view_orders") && (
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
                        {can("can_edit_orders") ? (
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
        )}

        {/* CLIENTS */}
        {page === "clients" && can("can_view_clients") && (
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
        )}

        {/* PERSONNEL */}
        {page === "staff" && isOwner && (
          <div style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>Personnel ({staff.length})</h1>
              <Btn onClick={() => setShowAddStaff(true)}>➕ Ajouter un employé</Btn>
            </div>
            {staff.length === 0 ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 48, textAlign: "center", color: "#94a3b8", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👔</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>Aucun employé</div>
                <div style={{ fontSize: 13 }}>Ajoutez votre premier employé</div>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                {staff.map(emp => {
                  const perms = emp.permissions?.[0] || {};
                  const activePerms = Object.entries(PERMISSION_LABELS).filter(([k]) => perms[k]);
                  return (
                    <div key={emp.id} style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.06)", display: "flex", alignItems: "start", gap: 16 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                        {emp.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{emp.full_name}</div>
                        <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>{emp.email}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {activePerms.map(([k, lbl]) => (
                            <span key={k} style={{ background: "#dcfce7", color: "#16a34a", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>✅ {lbl}</span>
                          ))}
                          {activePerms.length === 0 && <span style={{ color: "#94a3b8", fontSize: 12 }}>Aucune permission active</span>}
                        </div>
                      </div>
                      <Btn variant="ghost" onClick={() => {
                        setEditPermsFor(emp);
                        setEditPerms(emp.permissions?.[0] || {});
                      }} style={{ fontSize: 12, padding: "7px 14px" }}>🔐 Permissions</Btn>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* RAPPORT IA */}
        {page === "rapport" && (isOwner || can("can_view_reports")) && (
          <div style={{ padding: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: "#1e293b" }}>🤖 Rapport IA Mensuel</h1>
            <p style={{ color: "#64748b", marginBottom: 20, fontSize: 13 }}>
              Analyse de {pressing?.name} — {new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </p>
            <div style={{ background: "#fff", borderRadius: 14, padding: 20, marginBottom: 18, boxShadow: "0 2px 8px rgba(0,0,0,.06)", display: "flex", justifyContent: "flex-end" }}>
              <Btn variant="purple" onClick={generateAIReport} disabled={aiLoading} style={{ padding: "11px 24px" }}>
                {aiLoading ? "⏳ Analyse en cours..." : "🤖 Générer le rapport"}
              </Btn>
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
        )}
      </div>
    </div>
  );
}
