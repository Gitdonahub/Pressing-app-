import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase.js";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pressing, setPressing] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => {
      if (mounted) setSession(s);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setPressing(null);
      setPermissions(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const loadProfile = async () => {
      try {
        const { data: prof, error: profErr } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (profErr || !prof) {
          setLoading(false);
          return;
        }

        setProfile(prof);

        if (prof.pressing_id) {
          const { data: press } = await supabase
            .from("pressings")
            .select("*")
            .eq("id", prof.pressing_id)
            .maybeSingle();
          if (!cancelled) setPressing(press);

          if (prof.role === "employee") {
            const { data: perms } = await supabase
              .from("permissions")
              .select("*")
              .eq("employee_id", prof.id)
              .maybeSingle();
            if (!cancelled) setPermissions(perms);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfile();
    return () => { cancelled = true; };
  }, [session]);

  const isOwner = profile?.role === "owner";
  const can = (perm) => isOwner || permissions?.[perm] === true;

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setPressing(null);
    setPermissions(null);
  };

  return { session, profile, pressing, permissions, loading, isOwner, can, logout };
            }
