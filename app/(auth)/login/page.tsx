"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const LIME = "#C5F73A";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string|null>(null);
  const router   = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div style={{
      minHeight:"100vh", background:"#0c0c0d",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:24, fontFamily:"inherit",
    }}>
      {/* Subtle dot grid background */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none",
        backgroundImage:"radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
        backgroundSize:"26px 26px",
      }} />

      {/* Lime glow */}
      <div style={{
        position:"fixed", top:"-20%", left:"50%", transform:"translateX(-50%)",
        width:600, height:400, borderRadius:"50%",
        background:"radial-gradient(ellipse, rgba(197,247,58,0.06) 0%, transparent 70%)",
        pointerEvents:"none",
      }} />

      <div style={{ width:"100%", maxWidth:400, position:"relative", zIndex:1 }}>

        {/* Brand */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{
            display:"inline-flex", alignItems:"center", justifyContent:"center",
            width:58, height:58, borderRadius:18,
            background:"linear-gradient(160deg,#1b1b1d,#141416)",
            border:"1px solid rgba(197,247,58,0.25)",
            boxShadow:"0 0 32px rgba(197,247,58,0.12)",
            marginBottom:16,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 19V9m5 10V5m5 14v-7m5 7V8"
                stroke={LIME} strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <h1 style={{ color:"#f3f3f4", fontSize:22, fontWeight:700, letterSpacing:-0.5 }}>LVIF Group</h1>
          <p style={{ color:"#6b6b70", fontSize:13, marginTop:5 }}>Control Center</p>
        </div>

        {/* Card */}
        <div style={{
          background:"linear-gradient(160deg,#1b1b1d,#141416)",
          border:"1px solid rgba(255,255,255,0.07)", borderRadius:24,
          padding:"32px 28px",
          boxShadow:"0 24px 48px rgba(0,0,0,0.4)",
        }}>
          <h2 style={{ color:"#f3f3f4", fontSize:17, fontWeight:700, marginBottom:22 }}>Connexion</h2>

          <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:16 }}>
            <div>
              <label style={{ display:"block", color:"#8b8b8f", fontSize:12, fontWeight:600, marginBottom:7, textTransform:"uppercase", letterSpacing:0.6 }}>
                Email
              </label>
              <input
                type="email" required value={email}
                onChange={(e)=>setEmail(e.target.value)}
                placeholder="vous@lvif.fr"
                style={{
                  width:"100%", background:"rgba(255,255,255,0.05)",
                  border:"1px solid rgba(255,255,255,0.1)", borderRadius:12,
                  color:"#f3f3f4", fontSize:14, padding:"11px 14px",
                  outline:"none", fontFamily:"inherit", boxSizing:"border-box",
                }}
              />
            </div>

            <div>
              <label style={{ display:"block", color:"#8b8b8f", fontSize:12, fontWeight:600, marginBottom:7, textTransform:"uppercase", letterSpacing:0.6 }}>
                Mot de passe
              </label>
              <input
                type="password" required value={password}
                onChange={(e)=>setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width:"100%", background:"rgba(255,255,255,0.05)",
                  border:"1px solid rgba(255,255,255,0.1)", borderRadius:12,
                  color:"#f3f3f4", fontSize:14, padding:"11px 14px",
                  outline:"none", fontFamily:"inherit", boxSizing:"border-box",
                }}
              />
            </div>

            {error && (
              <div style={{
                background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)",
                borderRadius:10, padding:"10px 14px",
              }}>
                <p style={{ color:"#fca5a5", fontSize:13 }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              marginTop:4,
              background: loading ? "rgba(197,247,58,0.4)" : "linear-gradient(180deg,#C5F73A,#a9da22)",
              color:"#0c0c0d", border:"none", borderRadius:30, padding:"14px",
              fontSize:14, fontWeight:800, fontFamily:"inherit", cursor:"pointer",
              boxShadow: loading ? "none" : "0 8px 24px rgba(197,247,58,0.28)",
              transition:"all 0.15s",
            }}>
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>

        <p style={{ textAlign:"center", color:"rgba(107,107,112,0.6)", fontSize:11, marginTop:20 }}>
          © 2025 LVIF Group — Usage interne uniquement
        </p>
      </div>
    </div>
  );
}
