import { useState, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase.js";
import { genTicket } from "./utils/format.js";
import { useAuth } from "./hooks/useAuth.js";

import Toast from "./components/ui/Toast.jsx";
import AuthPage from "./components/auth/AuthPage.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import Dashboard from "./components/dashboard/Dashboard.jsx";
import NewOrder from "./components/orders/NewOrder.jsx";
import OrderList from "./components/orders/OrderList.jsx";
import ClientList from "./components/clients/ClientList.jsx";
import StaffManager, { AddStaffModal, EditPermsModal } from "./components/staff/StaffManager.jsx";
import AIReport from "./components/reports/AIReport.jsx";

export default function App() {
  const { session, profile, pressing, loading, isOwner, can, logout } = useAuth();

  const [page, setPage] = useState("dashboard");
  const [orders, setOrders] = useState([]);
  const [clients, setClients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [stats, setStats] = useState({ todayOrders: 0, todayRevenue: 0, pending: 0, ready: 0 });
  const [order, setOrder] = useState({ clientName: "", clientPhone: "", items: [], payment: "espèces", deposit: 0 });
  const [aiReport, setAiReport] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ fullName: "", email: "", password: "" });
  const [newPerms, setNewPerms] = useState({
    can_create_orders: true, can_view_orders: true, can_edit_orders: true,
    can_view_clients: true, can_manage_inventory: false,
    can_view_reports: false, can_manage_staff: false,
  });
  const [editPermsFor, setEditPermsFor] = useState(null);
  const [editPerms, setEditPerms] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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

  const addItem = (svc, item) => {
    const exist = order.items.find(x => x.item === item.name && x.service === svc.name);
    if (exist) {
      setOrder(p => ({ ...p, items: p.items.map(x => x.item === item.name && x.service === svc.name ? { ...x, quantity: x.quantity + 1 } : x) }));
    } else {
      setOrder(p => ({ ...p, items: [...p.items, { id: Date.now(), service: svc.name, item: item.name, price: item.price, quantity: 1 }] }));
    }
  };

  const createOrder = async () => {
    const total = order.items.reduce((s, i) => s + i.price * i.quantity, 0);
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
      const res = await fetch("/api/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportData }),
      });
      const parsed = await res.json();
      if (parsed.error) throw new Error(parsed.error);

      setAiReport({ ...parsed, raw: reportData });
      await supabase.from("monthly_reports").insert({
        month, year, pressing_id: pressing.id,
        report_data: reportData, ai_analysis: parsed.resume,
        ai_suggestions: JSON.stringify(parsed.suggestions),
      });
      showToast("Rapport IA généré !");
    } catch (e) { showToast("Erreur IA: " + e.message, "error"); }
    setAiLoading(false);
  };

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

      {showAddStaff && (
        <AddStaffModal
          newStaff={newStaff} setNewStaff={setNewStaff}
          newPerms={newPerms} setNewPerms={setNewPerms}
          addEmployee={addEmployee}
          onClose={() => setShowAddStaff(false)}
        />
      )}

      {editPermsFor && (
        <EditPermsModal
          employee={editPermsFor}
          editPerms={editPerms} setEditPerms={setEditPerms}
          savePermissions={savePermissions}
          onClose={() => setEditPermsFor(null)}
        />
      )}

      <Sidebar
        pressing={pressing} profile={profile} isOwner={isOwner}
        page={page} setPage={setPage} nav={nav} logout={logout}
      />

      <div style={{ flex: 1, overflow: "auto" }}>
        {page === "dashboard" && (
          <Dashboard profile={profile} stats={stats} orders={orders} clients={clients} />
        )}

        {page === "newOrder" && can("can_create_orders") && (
          <NewOrder order={order} setOrder={setOrder} addItem={addItem} createOrder={createOrder} />
        )}

        {page === "orders" && can("can_view_orders") && (
          <OrderList orders={orders} updateStatus={updateStatus} canEdit={can("can_edit_orders")} />
        )}

        {page === "clients" && can("can_view_clients") && (
          <ClientList clients={clients} />
        )}

        {page === "staff" && isOwner && (
          <StaffManager
            staff={staff}
            onAddClick={() => setShowAddStaff(true)}
            onEditPermsClick={(emp) => { setEditPermsFor(emp); setEditPerms(emp.permissions?.[0] || {}); }}
          />
        )}

        {page === "rapport" && (isOwner || can("can_view_reports")) && (
          <AIReport pressing={pressing} aiReport={aiReport} aiLoading={aiLoading} generateAIReport={generateAIReport} />
        )}
      </div>
    </div>
  );
                                                }
