import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase.js";

export function useAuth() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [pressing, setPressing] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(0); // évite les races entre chargements concurrents

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return;
      // Ignore les rafraîchissements de token silencieux qui ne changent pas l'utilisateur
      setSession(prev => {
        if (prev?.user?.id === s?.user?.id && event === "TOKEN_REFRESHED") return prev;
        return s;
      });
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

    const myLoadId = ++loadingRef.current;
    let cancelled = false;
    setLoading(true);

    const loadProfile = async () => {
      // Petite retry loop : juste après signUp/insert, il peut y avoir un décalage
      // de réplication très court côté Supabase. On réessaie jusqu'à 3 fois.
      let prof = null;
      for (let attempt = 0; attempt < 3 && !prof; attempt++) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
        if (data) { prof = data; break; }
        if (attempt < 2) await new Promise(r => setTimeout(r, 400));
      }

      if (cancelled || loadingRef.current !== myLoadId) return;

      if (!prof) {
        setProfile(null);
        setPressing(null);
        setPermissions(null);
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
        if (cancelled || loadingRef.current !== myLoadId) return;
        setPressing(press);

        if (prof.role === "employee") {
          const { data: perms } = await supabase
            .from("permissions")
            .select("*")
            .eq("employee_id", prof.id)
            .maybeSingle();
          if (cancelled || loadingRef.current !== myLoadId) return;
          setPermissions(perms || {});
        } else {
          setPermissions(null);
        }
      }

      if (!cancelled && loadingRef.current === myLoadId) setLoading(false);
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
