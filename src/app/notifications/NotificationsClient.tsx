"use client";

import React, { useState } from "react";

interface Notif {
  id: string;
  text: string;
  type: string;
  read: boolean;
  createdAt: string;
  taskId?: string | null;
  metadata?: string | null;
}

const TYPE_COLOR: Record<string, string> = {
  TASK_APPROVED: "var(--green)",
  TASK_REJECTED: "var(--red)",
  TASK_ABANDONED: "var(--red)",
  TASK_ASSIGNED: "var(--accent)",
  TASK_SUBMITTED: "var(--accent)",
  TASK_REOPENED: "var(--amber)",
  TASK_REMINDER: "var(--amber)",
  TASK_PICKED_UP: "var(--t3)",
  BROADCAST: "var(--amber)",
  BROADCAST_ACK: "var(--green)",
  OPEN_QUEUE_POST: "#14B8A6",
  PAYMENT_REMINDER: "var(--red)",
  DEFAULT: "var(--t3)",
};

const TYPE_ICON: Record<string, string> = {
  TASK_APPROVED: "✓",
  TASK_REJECTED: "✕",
  TASK_ASSIGNED: "◎",
  TASK_SUBMITTED: "↑",
  TASK_ABANDONED: "⊘",
  TASK_REOPENED: "↺",
  TASK_PICKED_UP: "⊙",
  TASK_REMINDER: "◷",
  BROADCAST: "⊛",
  BROADCAST_ACK: "◎",
  OPEN_QUEUE_POST: "◈",
  PAYMENT_REMINDER: "⊘",
  DEFAULT: "⚐",
};

function BroadcastRow({ notif }: { notif: Notif }) {
  const [response, setResponse] = useState<string>("");
  const [sending, setSending] = useState(false);

  const meta = notif.metadata ? (() => { try { return JSON.parse(notif.metadata!); } catch { return {}; } })() : {};
  const alreadyAcked = Array.isArray(meta.acknowledgedBy) && meta.acknowledgedBy.length > 0;

  const handleAck = async (resValue: "yes" | "no") => {
    setSending(true);
    try {
      await fetch(`/api/broadcast/${notif.id}/ack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: resValue, replyText: response.trim() }),
      });
      setStatus(resValue);
    } catch {}
    setSending(false);
  };

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      {status !== "idle" || alreadyAcked ? (
        <span
          style={{
            fontSize: 12,
            fontFamily: "var(--font-mono), monospace",
            color: "var(--green)",
            padding: "3px 10px",
            border: "1px solid var(--green)44",
            borderRadius: 6,
          }}
        >
          ✓ Acknowledged {status !== "idle" ? `(${status.toUpperCase()})` : ""}
        </span>
      ) : (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <textarea
            placeholder="Type your reply back to the admin..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            style={{
              width: "100%",
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "8px 12px",
              color: "var(--t1)",
              fontSize: 13,
              fontFamily: "var(--font-sans), sans-serif",
              resize: "none",
              outline: "none",
            }}
            rows={2}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleAck("yes")}
              disabled={sending}
              style={{
                fontSize: 12,
                fontFamily: "var(--font-mono), monospace",
                background: "rgba(34,197,94,.12)",
                border: "1px solid rgba(34,197,94,.4)",
                color: "#22C55E",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: sending ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {sending ? "..." : "✓ Send Acknowledge (Yes)"}
            </button>
            <button
              onClick={() => handleAck("no")}
              disabled={sending}
              style={{
                fontSize: 12,
                fontFamily: "var(--font-mono), monospace",
                background: "rgba(239,68,68,.12)",
                border: "1px solid rgba(239,68,68,.4)",
                color: "#EF4444",
                padding: "6px 14px",
                borderRadius: 6,
                cursor: sending ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {sending ? "..." : "✕ No / Can't Do"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RenewRow({ notif, meta }: { notif: Notif; meta: any }) {
  const [status, setStatus] = useState<"idle" | "renewed" | "loading">("idle");
  const [newDate, setNewDate] = useState<string | null>(null);

  const handleRenew = async () => {
    setStatus("loading");
    try {
      const res = await fetch(`/api/credentials/${meta.credentialId}/renew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notifId: notif.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setNewDate(data.newRenewalDate);
        setStatus("renewed");
      } else {
        setStatus("idle");
      }
    } catch {
      setStatus("idle");
    }
  };

  if (status === "renewed") {
    return (
      <div
        style={{
          marginTop: 10,
          fontSize: 12,
          fontFamily: "var(--font-mono), monospace",
          color: "var(--green)",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>✓ Marked as renewed</span>
        {newDate && (
          <span style={{ color: "var(--t3)" }}>
            → next renewal: <strong style={{ color: "var(--t1)" }}>{newDate}</strong>
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 10, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontSize: 12, fontFamily: "var(--font-mono), monospace", color: "var(--t3)" }}>
        Has this been paid?
      </span>
      <button
        onClick={handleRenew}
        disabled={status === "loading"}
        style={{
          fontSize: 12,
          fontFamily: "var(--font-mono), monospace",
          background: "rgba(34,197,94,.12)",
          border: "1px solid rgba(34,197,94,.4)",
          color: "#22C55E",
          padding: "4px 14px",
          borderRadius: 6,
          cursor: status === "loading" ? "not-allowed" : "pointer",
        }}
      >
        {status === "loading" ? "◌ Updating…" : "✓ Yes, Renewed"}
      </button>
      <button
        onClick={async () => {
          // Just mark read, don't renew
          await fetch(`/api/notifications/unread`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: [notif.id] }),
          }).catch(() => {});
          setStatus("renewed");
          setNewDate(null);
        }}
        style={{
          fontSize: 12,
          fontFamily: "var(--font-mono), monospace",
          background: "transparent",
          border: "1px solid var(--border)",
          color: "var(--t4)",
          padding: "4px 14px",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        ✕ Not yet
      </button>
    </div>
  );
}

export default function NotificationsClient({ notifs }: { notifs: Notif[] }) {
  const fmtRel = (s: string) => {
    const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
    return m < 1 ? "just now" : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.floor(m / 60)}h ago` : `${Math.floor(m / 1440)}d ago`;
  };

  const meta = (n: Notif) => {
    try { return n.metadata ? JSON.parse(n.metadata) : {}; } catch { return {}; }
  };

  return (
    <div style={{ padding: "30px 40px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--font-sans), sans-serif", fontSize: 24, fontWeight: 700, color: "var(--t1)", letterSpacing: "-.4px", marginBottom: 6 }}>
        Notifications
      </h1>
      <p style={{ fontSize: 14, color: "var(--t3)", marginBottom: 24 }}>Your recent alerts and task updates.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {notifs.map((n) => {
          const color = TYPE_COLOR[n.type] ?? TYPE_COLOR.DEFAULT;
          const icon = TYPE_ICON[n.type] ?? TYPE_ICON.DEFAULT;
          const m = meta(n);

          return (
            <div
              key={n.id}
              style={{
                background: n.read ? "var(--bg1)" : "var(--accent-dim)",
                border: `1px solid ${n.read ? "var(--border)" : color + "33"}`,
                borderLeft: `3px solid ${color}`,
                borderRadius: 12,
                padding: "16px 20px",
                display: "flex",
                gap: 14,
              }}
            >
              {/* Unread dot */}
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: n.read ? "transparent" : color,
                  marginTop: 6,
                  flexShrink: 0,
                  border: n.read ? "1px solid var(--border)" : "none",
                }}
              />

              <div style={{ flex: 1 }}>
                {/* Header row */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 16, color }}>{icon}</span>
                  {n.type === "PAYMENT_REMINDER" && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono), monospace",
                        background: "rgba(239,68,68,.15)",
                        border: "1px solid rgba(239,68,68,.4)",
                        color: "var(--red)",
                        padding: "1px 6px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      Payment Due
                    </span>
                  )}
                  {n.type === "BROADCAST" && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono), monospace",
                        background: "rgba(245,158,11,.15)",
                        border: "1px solid rgba(245,158,11,.4)",
                        color: "#F59E0B",
                        padding: "1px 6px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      Broadcast
                    </span>
                  )}
                  {n.type === "OPEN_QUEUE_POST" && (
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono), monospace",
                        background: "rgba(20,184,166,.12)",
                        border: "1px solid rgba(20,184,166,.35)",
                        color: "#14B8A6",
                        padding: "1px 6px",
                        borderRadius: 4,
                        textTransform: "uppercase",
                        letterSpacing: ".06em",
                      }}
                    >
                      Open Queue
                    </span>
                  )}
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono), monospace", color: "var(--t4)", marginLeft: "auto" }}>
                    {fmtRel(n.createdAt)}
                  </span>
                </div>

                {/* Main text */}
                <div style={{ fontSize: 15, color: "var(--t1)", lineHeight: 1.6 }}>{n.text}</div>

                {/* Extra meta for PAYMENT_REMINDER */}
                {n.type === "PAYMENT_REMINDER" && m.renewalDate && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: "8px 12px",
                      background: "rgba(239,68,68,.06)",
                      border: "1px solid rgba(239,68,68,.2)",
                      borderRadius: 8,
                      display: "flex",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, fontFamily: "var(--font-mono), monospace", color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Tool</div>
                      <div style={{ fontSize: 13, fontFamily: "var(--font-mono), monospace", color: "var(--t1)", marginTop: 2 }}>{m.toolName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontFamily: "var(--font-mono), monospace", color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Renewal</div>
                      <div style={{ fontSize: 13, fontFamily: "var(--font-mono), monospace", color: "var(--red)", fontWeight: 600, marginTop: 2 }}>{m.renewalDate}</div>
                    </div>
                    {m.monthlyCost > 0 && (
                      <div>
                        <div style={{ fontSize: 10, fontFamily: "var(--font-mono), monospace", color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Amount</div>
                        <div style={{ fontSize: 13, fontFamily: "var(--font-mono), monospace", color: "var(--accent)", fontWeight: 600, marginTop: 2 }}>₹{m.monthlyCost?.toLocaleString("en-IN")}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 10, fontFamily: "var(--font-mono), monospace", color: "var(--t4)", textTransform: "uppercase", letterSpacing: ".06em" }}>Alert</div>
                      <div style={{ fontSize: 13, fontFamily: "var(--font-mono), monospace", color: "var(--amber)", marginTop: 2 }}>{m.daysUntil}d away</div>
                    </div>
                  </div>
                )}

                {/* Renew action for PAYMENT_REMINDER */}
                {n.type === "PAYMENT_REMINDER" && <RenewRow notif={n} meta={m} />}

                {/* Broadcast Yes/No acknowledge */}
                {n.type === "BROADCAST" && <BroadcastRow notif={n} />}

                {/* ACK response summary */}
                {n.type === "BROADCAST_ACK" && m.response && (
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      fontFamily: "var(--font-mono), monospace",
                      color: m.response === "yes" ? "var(--green)" : "var(--red)",
                    }}
                  >
                    {m.response === "yes" ? "✓" : "✕"} {m.responderName} said "{m.response.toUpperCase()}"
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {notifs.length === 0 && (
          <div
            style={{
              padding: 40,
              textAlign: "center",
              color: "var(--t4)",
              fontSize: 14,
              background: "var(--bg1)",
              borderRadius: 12,
            }}
          >
            You have no notifications.
          </div>
        )}
      </div>
    </div>
  );
}
