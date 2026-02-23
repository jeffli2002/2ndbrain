"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Brain, Lock, Eye, EyeOff } from "lucide-react";

const ADMIN_PASSWORD = "jeff2026";

export default function Login() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    await new Promise(resolve => setTimeout(resolve, 500));
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("secondbrain_auth", "true");
      router.push("/");
    } else {
      setError(true);
      setPassword("");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#0a0a0c",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      {/* Background Effects */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: 0, left: "25%", width: "384px", height: "384px", backgroundColor: "rgba(139, 92, 246, 0.1)", borderRadius: "9999px", filter: "blur(96px)" }} />
        <div style={{ position: "absolute", bottom: 0, right: "25%", width: "384px", height: "384px", backgroundColor: "rgba(147, 51, 234, 0.1)", borderRadius: "9999px", filter: "blur(96px)" }} />
      </div>

      <div style={{
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "24px",
        padding: "40px",
        position: "relative",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            background: "linear-gradient(135deg, #8b5cf6, #9333ea)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <Brain size={32} color="#fff" />
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#fff", marginBottom: "8px" }}>
            第二大脑
          </h1>
          <p style={{ color: "#71717a", fontSize: "14px" }}>
            请输入访问密码
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", color: "#a1a1aa", fontSize: "14px", marginBottom: "8px" }}>
              访问密码
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#71717a" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="请输入密码"
                style={{
                  width: "100%",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: error ? "1px solid #ef4444" : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "14px 48px 14px 48px",
                  color: "#fff",
                  fontSize: "16px",
                  outline: "none",
                  transition: "all 0.2s",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#71717a",
                  cursor: "pointer",
                  padding: "4px",
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {error && (
              <p style={{ color: "#ef4444", fontSize: "14px", marginTop: "8px" }}>
                密码错误，请重试
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!password || loading}
            style={{
              width: "100%",
              background: password ? "linear-gradient(135deg, #8b5cf6, #9333ea)" : "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "12px",
              padding: "14px",
              color: password ? "#fff" : "#71717a",
              fontSize: "16px",
              fontWeight: "600",
              cursor: password ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "验证中..." : "登录"}
          </button>
        </form>

        <p style={{ color: "#52525b", fontSize: "12px", textAlign: "center", marginTop: "24px" }}>
          仅限授权用户访问
        </p>
      </div>
    </div>
  );
}
