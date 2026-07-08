import { PERMISSION_LABELS } from "../../data/services.js";
import Button from "../ui/Button.jsx";
import Input from "../ui/Input.jsx";
import Modal from "../ui/Modal.jsx";

export function AddStaffModal({ newStaff, setNewStaff, newPerms, setNewPerms, addEmployee, onClose }) {
  return (
    <Modal onClose={onClose}>
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
        <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Annuler</Button>
        <Button onClick={addEmployee} style={{ flex: 2 }}>✅ Ajouter l'employé</Button>
      </div>
    </Modal>
  );
}

export function EditPermsModal({ employee, editPerms, setEditPerms, savePermissions, onClose }) {
  return (
    <Modal maxWidth={440} onClose={onClose}>
      <h2 style={{ fontWeight: 700, marginBottom: 6, color: "#1e293b" }}>🔐 Permissions — {employee.full_name}</h2>
      <p style={{ color: "#64748b", fontSize: 13, marginBottom: 20 }}>Cochez les accès autorisés pour cet employé</p>
      {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
        <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}>
          <input type="checkbox" checked={editPerms[key] || false} onChange={e => setEditPerms(p => ({ ...p, [key]: e.target.checked }))}
            style={{ width: 16, height: 16, accentColor: "#2563eb" }} />
          <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
        </label>
      ))}
      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Annuler</Button>
        <Button onClick={savePermissions} style={{ flex: 2 }}>💾 Enregistrer</Button>
      </div>
    </Modal>
  );
}

export default function StaffManager({ staff, onAddClick, onEditPermsClick }) {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1e293b" }}>Personnel ({staff.length})</h1>
        <Button onClick={onAddClick}>➕ Ajouter un employé</Button>
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
                <Button variant="ghost" onClick={() => onEditPermsClick(emp)} style={{ fontSize: 12, padding: "7px 14px" }}>🔐 Permissions</Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
