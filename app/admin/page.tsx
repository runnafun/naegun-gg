"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type AdminUser = {
  id: string;
  username: string;
  role: "ADMIN" | "SUPER_ADMIN";
};

type AdminAccount = {
  id: string;
  username: string;
  role: string;
  status: string;
  createdAt: string;
};

export default function AdminPage() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [createMessage, setCreateMessage] = useState("");

  async function loadMe() {
    try {
      const res = await fetch("/api/auth/me", {
        cache: "no-store",
      });

      const data = await res.json();

      if (
        res.ok &&
        data?.authenticated &&
        data?.user &&
        (data.user.role === "ADMIN" ||
          data.user.role === "SUPER_ADMIN")
      ) {
        setUser({
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function loadAccounts() {
    try {
      const res = await fetch("/api/admin/accounts", {
        cache: "no-store",
      });

      const data = await res.json();

      if (res.ok) {
        setAccounts(data.accounts ?? []);
      }
    } catch {}
  }

  useEffect(() => {
    loadMe();
  }, []);

  useEffect(() => {
    if (user) {
      loadAccounts();
    }
  }, [user]);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setLoginError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setLoginError(
        data?.error ?? "로그인에 실패했습니다.",
      );
      return;
    }

    setUser(data.user);
    setPassword("");
  }

  async function handleCreateAdmin(e: FormEvent) {
    e.preventDefault();

    setCreateMessage("");

    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: newUsername,
        password: newPassword,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setCreateMessage(
        data?.error ?? "관리자 생성에 실패했습니다.",
      );
      return;
    }

    setCreateMessage("관리자 계정이 생성되었습니다.");
    setNewUsername("");
    setNewPassword("");

    await loadAccounts();
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    window.location.href = "/admin";
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>
          관리자 인증 확인 중...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.page}>
        <div style={styles.loginCard}>
          <div style={styles.brand}>내전.GG</div>

          <h1 style={styles.title}>
            관리자 로그인
          </h1>

          <p style={styles.desc}>
            관리자 계정으로 로그인해주세요.
          </p>

          <form
            onSubmit={handleLogin}
            style={styles.form}
          >
            <input
              style={styles.input}
              value={username}
              onChange={(e) =>
                setUsername(e.target.value)
              }
              placeholder="관리자 ID"
              autoComplete="username"
            />

            <input
              style={styles.input}
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="비밀번호"
              type="password"
              autoComplete="current-password"
            />

            {loginError && (
              <div style={styles.error}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              style={styles.primaryButton}
            >
              로그인
            </button>
          </form>

          <Link
            href="/"
            style={styles.homeLink}
          >
            사이트로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.dashboard}>
        <div style={styles.topbar}>
          <div>
            <div style={styles.brand}>
              내전.GG ADMIN
            </div>

            <div style={styles.userText}>
              {user.username} · {user.role}
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={styles.logoutButton}
          >
            로그아웃
          </button>
        </div>

        <section style={styles.grid}>
          <Link
            href="/admin/scrims"
            style={styles.menuCard}
          >
            <strong style={styles.menuTitle}>
              내전 관리
            </strong>

            <span style={styles.menuDesc}>
              현재 내전 확인 및 팀 배정
            </span>
          </Link>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>
            관리자 계정
          </h2>

          <div style={styles.accountList}>
            {accounts.map((account) => (
              <div
                key={account.id}
                style={styles.accountRow}
              >
                <strong>
                  {account.username}
                </strong>

                <span>
                  {account.role}
                </span>

                <span>
                  {account.status}
                </span>
              </div>
            ))}
          </div>

          {user.role === "SUPER_ADMIN" && (
            <form
              onSubmit={handleCreateAdmin}
              style={styles.createForm}
            >
              <h3 style={styles.createTitle}>
                관리자 추가
              </h3>

              <input
                style={styles.input}
                value={newUsername}
                onChange={(e) =>
                  setNewUsername(e.target.value)
                }
                placeholder="새 관리자 ID"
              />

              <input
                style={styles.input}
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                type="password"
                placeholder="새 관리자 비밀번호"
              />

              <button
                type="submit"
                style={styles.primaryButton}
              >
                관리자 생성
              </button>

              {createMessage && (
                <div style={styles.message}>
                  {createMessage}
                </div>
              )}
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#090a09",
    color: "#fff",
    padding: "60px 24px",
    fontFamily: "Arial, sans-serif",
  },

  loading: {
    textAlign: "center",
    marginTop: 120,
  },

  loginCard: {
    width: "100%",
    maxWidth: 420,
    margin: "100px auto 0",
    padding: 32,
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: 18,
    background: "rgba(255,255,255,.035)",
  },

  brand: {
    color: "#bbff19",
    fontWeight: 900,
    fontSize: 18,
  },

  title: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 30,
  },

  desc: {
    color: "rgba(255,255,255,.55)",
    fontSize: 14,
    marginBottom: 24,
  },

  form: {
    display: "grid",
    gap: 12,
  },

  input: {
    width: "100%",
    height: 46,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,.1)",
    background: "#111",
    color: "#fff",
    padding: "0 14px",
    outline: "none",
  },

  primaryButton: {
    height: 46,
    borderRadius: 10,
    border: 0,
    background: "#bbff19",
    color: "#111",
    fontWeight: 900,
    cursor: "pointer",
  },

  error: {
    color: "#ff8a8a",
    fontSize: 13,
  },

  homeLink: {
    display: "block",
    marginTop: 18,
    color: "rgba(255,255,255,.5)",
    fontSize: 13,
    textAlign: "center",
  },

  dashboard: {
    width: "100%",
    maxWidth: 1100,
    margin: "0 auto",
  },

  topbar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  },

  userText: {
    marginTop: 6,
    color: "rgba(255,255,255,.55)",
    fontSize: 13,
  },

  logoutButton: {
    border: "1px solid rgba(255,255,255,.1)",
    background: "transparent",
    color: "#fff",
    padding: "10px 14px",
    borderRadius: 8,
    cursor: "pointer",
  },

  grid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 16,
    marginBottom: 32,
  },

  menuCard: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: 24,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.035)",
    textDecoration: "none",
    color: "#fff",
  },

  menuTitle: {
    fontSize: 18,
  },

  menuDesc: {
    color: "rgba(255,255,255,.5)",
    fontSize: 13,
  },

  section: {
    padding: 24,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.08)",
    background: "rgba(255,255,255,.025)",
  },

  sectionTitle: {
    marginTop: 0,
    fontSize: 20,
  },

  accountList: {
    display: "grid",
    gap: 8,
  },

  accountRow: {
    display: "grid",
    gridTemplateColumns: "1fr 130px 100px",
    gap: 12,
    padding: "12px 14px",
    borderRadius: 8,
    background: "rgba(255,255,255,.035)",
    fontSize: 13,
  },

  createForm: {
    display: "grid",
    gap: 12,
    maxWidth: 420,
    marginTop: 28,
  },

  createTitle: {
    marginBottom: 2,
  },

  message: {
    fontSize: 13,
    color: "#bbff19",
  },
};
