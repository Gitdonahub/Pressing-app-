import { useState } from "react";
import { supabase } from "../../lib/supabase.js";
import Input from "../ui/Input.jsx";
import Button from "../ui/Button.jsx";

export default function AuthPage({ showToast }) {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", password: "",
    pressingName: "", city: "", phone: "",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      showToast("Remplissez tous les champs", "error");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });
    if (error) showToast(error.message, "error");
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!form.pressingName || !form.city) {
      showToast("Remplissez les infos du pressing", "error");
      return;
    }
    if (!form.fullName || !form.email || !form.password) {
      showToast("Remplissez toutes les infos du compte", "error");
      return;
    }
    if (form.password.length < 6) {
      showToast("Mot de passe trop court (min. 6 caractères)", "error");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
      });
      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("Erreur lors de la création du compte");

      const { data: pressing, error: pErr } = await supabase
        .from("pressings")
        .insert({
          name: form.pressingName.trim(),
          email: form.email.trim(),
          phone: form.phone || "",
          city: form.city.trim(),
          country: "Togo",
          owner_id: userId,
          is_active: true,
        })
        .select()
        .single();
      if (pErr) throw new Error("Erreur pressing: " + pErr.message);

      const { error: profErr } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          pressing_id: pressing.id,
          full_name: form.fullName.trim(),
          email: form.email.trim(),
          role: "owner",
          is_active: true,
        });
      if (profErr) throw new Error("Erreur profil: " + profErr.message);

      showToast("✅ Compte créé ! Connectez-vous maintenant.");
      setMode("login");
      setStep(1);
    } catch (e) {
      showToast(e.message, "error");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#1e3a5f,#2563eb)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "#fff", borderRadius: 20, padding: 36,
        width: "100%", maxWidth: 420,
        boxShadow: "0 20px 60px rgba(0,0,0,.2)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48 }}>🧺</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#1e3a5f", margin: "8px 0 4px" }}>
            QuickWash
          </h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Plateforme de gestion de pressing
          </p>
        </div>

        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          {[["login", "Connexion"], ["register", "Inscription"]].map(([m, lbl]) => (
            <button key={m} onClick={() => { setMode(m); setStep(1); }} style={{
              flex: 1, padding: "8px", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === m ? "#fff" : "transparent",
              color: mode === m ? "#1e3a5f" : "#64748b",
              fontWeight: mode === m ? 700 : 400, fontSize: 14,
              boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,.08)" : "none",
            }}>
              {lbl}
            </button>
          ))}
        </div>

        {mode === "login" ? (
          <>
            <Input label="Email" type="email" placeholder="votre@email.com"
              value={form.email} onChange={e => set("email", e.target.value)} />
            <Input label="Mot de passe" type="password" placeholder="••••••••"
              value={form.password} onChange={e => set("password", e.target.value)} />
            <Button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: 12, fontSize: 15 }}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 20, gap: 8 }}>
              {[1, 2].map(s => (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, flex: s < 2 ? 1 : "none" }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: step >= s ? "#2563eb" : "#e2e8f0",
                    color: step >= s ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 13,
                  }}>
                    {s}
                  </div>
                  <span style={{ fontSize: 12, color: step >= s ? "#2563eb" : "#94a3b8", fontWeight: step === s ? 700 : 400 }}>
                    {s === 1 ? "Votre compte" : "Votre pressing"}
                  </span>
                  {s < 2 && <div style={{ flex: 1, height: 2, background: step > s ? "#2563eb" : "#e2e8f0", borderRadius: 2 }} />}
                </div>
              ))}
            </div>

            {step === 1 ? (
              <>
                <Input label="Nom complet *" placeholder="Jean Dupont"
                  value={form.fullName} onChange={e => set("fullName", e.target.value)} />
                <Input label="Email *" type="email" placeholder="votre@email.com"
                  value={form.email} onChange={e => set("email", e.target.value)} />
                <Input label="Mot de passe *" type="password" placeholder="Min. 6 caractères"
                  value={form.password} onChange={e => set("password", e.target.value)} />
                <Button onClick={() => {
                  if (!form.fullName || !form.email || !form.password) {
                    showToast("Remplissez tous les champs", "error");
                    return;
                  }
                  setStep(2);
                }} style={{ width: "100%", padding: 12 }}>
                  Suivant →
                </Button>
              </>
            ) : (
              <>
                <Input label="Nom du pressing *" placeholder="Ex: Elynis Pressing"
                  value={form.pressingName} onChange={e => set("pressingName", e.target.value)} />
                <Input label="Ville *" placeholder="Ex: Lomé"
                  value={form.city} onChange={e => set("city", e.target.value)} />
                <Input label="Téléphone" placeholder="+228 XX XX XX XX"
                  value={form.phone} onChange={e => set("phone", e.target.value)} />
                <div style={{ display: "flex", gap: 10 }}>
                  <Button variant="ghost" onClick={() => setStep(1)} style={{ flex: 1, padding: 12 }}>
                    ← Retour
                  </Button>
                  <Button onClick={handleRegister} disabled={loading} style={{ flex: 2, padding: 12 }}>
                    {loading ? "Création..." : "🚀 Créer mon pressing"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
