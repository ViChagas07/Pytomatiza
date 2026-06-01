/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Communication — CommunicationContent (Client)
   Multi-channel message composer, channel selector, recipients,
   scheduling, and recent messages.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  MessageSquare,
  Sparkles,
  Send,
  Mail,
  MessageCircle,
  Hash,
  Smartphone,
  Zap,
  Users,
  Clock,
  Calendar,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Eye,
  Save,
  TestTube,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────────── */

interface ChannelDef {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface RecentMessage {
  id: string;
  channel: string;
  subject: string;
  sentAt: Date;
  status: "sent" | "scheduled" | "failed";
  recipients: number;
}

/* ── Channels ───────────────────────────────────────────────────── */

const channels: ChannelDef[] = [
  { id: "email", labelKey: "channels.email", icon: Mail, color: "var(--brand-python-blue)" },
  { id: "slack", labelKey: "channels.slack", icon: Hash, color: "var(--color-success)" },
  { id: "whatsapp", labelKey: "channels.whatsapp", icon: MessageCircle, color: "var(--color-info)" },
  { id: "teams", labelKey: "channels.teams", icon: Users, color: "var(--brand-accent)" },
  { id: "sms", labelKey: "channels.sms", icon: Smartphone, color: "var(--color-warning)" },
  { id: "discord", labelKey: "channels.discord", icon: Zap, color: "var(--color-danger)" },
];

/* ── Send mode options ──────────────────────────────────────────── */

type SendMode = "now" | "later" | "recurring";

/* ── Component ───────────────────────────────────────────────────── */

export function CommunicationContent() {
  const t = useTranslations("modules.communication");
  const [loaded, setLoaded] = React.useState(false);
  const [selectedChannels, setSelectedChannels] = React.useState<Set<string>>(new Set(["email"]));
  const [instruction, setInstruction] = React.useState("");
  const [subject, setSubject] = React.useState("");
  const [sendMode, setSendMode] = React.useState<SendMode>("now");
  const [isSending, setIsSending] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [recentMessages, setRecentMessages] = React.useState<RecentMessage[]>([
    { id: "m1", channel: "email", subject: "Lembrete: Fatura vencendo em 3 dias", sentAt: new Date(Date.now() - 3600000), status: "sent", recipients: 45 },
    { id: "m2", channel: "slack", subject: "Relatório semanal de vendas #team-vendas", sentAt: new Date(Date.now() - 86400000), status: "sent", recipients: 12 },
    { id: "m3", channel: "whatsapp", subject: "Confirmação de pedido #45921", sentAt: new Date(Date.now() - 172800000), status: "failed", recipients: 1 },
  ]);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const toggleChannel = (id: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    setIsSending(true);
    setError(null);
    setResult(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1800));
      const channelLabels = Array.from(selectedChannels).join(", ");
      setResult(t("results.sent", { channels: channelLabels }));

      const newMsg: RecentMessage = {
        id: `m${Date.now()}`,
        channel: Array.from(selectedChannels)[0],
        subject: subject || instruction.slice(0, 50) + "...",
        sentAt: new Date(),
        status: "sent",
        recipients: 1,
      };
      setRecentMessages((prev) => [newMsg, ...prev]);
    } catch {
      setError(t("errors.sendFailed"));
    } finally {
      setIsSending(false);
    }
  };

  const channelName = (id: string) => {
    const ch = channels.find((c) => c.id === id);
    return ch ? t(ch.labelKey) : id;
  };

  /* ── Additional handlers ─────────────────────────────────────── */
  const [toEmails, setToEmails] = React.useState<string[]>([""]);
  const [ccEmails, setCcEmails] = React.useState<string[]>([""]);

  const handlePreview = () => {
    const channelList = Array.from(selectedChannels).map(channelName).join(", ");
    alert(t("results.preview", { channels: channelList, subject: subject || t("composer.noSubject"), instruction }));
  };

  const handleSaveDraft = () => {
    alert(t("results.draftSaved"));
  };

  const handleTestSend = () => {
    if (toEmails[0]) {
      alert(t("results.testSent", { email: toEmails[0] }));
    } else {
      alert(t("errors.testNoRecipient"));
    }
  };

  const addRecipientField = (type: "to" | "cc") => {
    if (type === "to") setToEmails((prev) => [...prev, ""]);
    else setCcEmails((prev) => [...prev, ""]);
  };

  const updateRecipient = (type: "to" | "cc", index: number, value: string) => {
    if (type === "to") {
      setToEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
    } else {
      setCcEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
    }
  };

  if (!loaded) return null;

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Channel selector */}
          <section
            aria-labelledby="channels-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
                <MessageSquare className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <h2 id="channels-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                {t("channels.title")}
              </h2>
            </div>
            <div
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
              role="group"
              aria-label={t("channels.title")}
            >
              {channels.map((ch) => {
                const isSelected = selectedChannels.has(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={() => toggleChannel(ch.id)}
                    data-testid={`channel-${ch.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-all min-h-[44px]",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]",
                      isSelected
                        ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)]"
                        : "border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-1)]"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors",
                        isSelected ? "bg-white" : "bg-[var(--surface-1)]"
                      )}
                    >
                      <span style={isSelected ? { color: ch.color } : undefined}>
                        <ch.icon
                          className={cn("h-4 w-4", isSelected ? "" : "text-[var(--text-tertiary)]")}
                          aria-hidden="true"
                        />
                      </span>
                    </div>
                    <span className={cn("text-sm font-medium", isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]")}>
                      {t(ch.labelKey)}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Message composer */}
          <section
            aria-labelledby="composer-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
                <Sparkles className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <h2 id="composer-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                {t("composer.title")}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{t("composer.description")}</p>

            <form onSubmit={handleSend} noValidate className="space-y-4">
              {/* Subject */}
              <div>
                <label htmlFor="comm-subject" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  {t("composer.subjectLabel")}
                </label>
                <input
                  id="comm-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("composer.subjectPlaceholder")}
                  data-testid="comm-subject"
                  className={cn(
                    "w-full h-10 rounded-[var(--radius-md)] border px-3 text-sm",
                    "bg-[var(--surface-0)] placeholder:text-[var(--text-tertiary)]",
                    "border-[var(--border-default)] hover:border-[var(--border-strong)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                  )}
                />
              </div>

              {/* Instruction */}
              <div>
                <label htmlFor="comm-instruction" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                  {t("composer.instructionLabel")}
                </label>
                <textarea
                  id="comm-instruction"
                  rows={4}
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  placeholder={t("composer.instructionPlaceholder")}
                  aria-describedby="comm-helper comm-char-count"
                  data-testid="comm-instruction"
                  className={cn(
                    "w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm",
                    "bg-[var(--surface-0)] resize-y min-h-[100px]",
                    "placeholder:text-[var(--text-tertiary)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-1",
                    "focus-visible:outline-[var(--brand-accent)]",
                    "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                  )}
                />
                <div className="mt-1.5 flex items-center justify-between">
                  <p id="comm-helper" className="text-xs text-[var(--text-tertiary)]">{t("composer.instructionHelper")}</p>
                  <p id="comm-char-count" aria-live="polite" className={cn("text-xs", instruction.length > 450 ? "text-[var(--color-danger)] font-medium" : "text-[var(--text-tertiary)]")}>
                    {t("composer.charCount", { current: instruction.length, max: 500 })}
                  </p>
                </div>
              </div>

              {/* Send mode */}
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{t("schedule.title")}</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("schedule.title")}>
                  {[
                    { mode: "now" as const, label: t("schedule.sendNow"), icon: Send },
                    { mode: "later" as const, label: t("schedule.scheduleLater"), icon: Clock },
                    { mode: "recurring" as const, label: t("schedule.recurring"), icon: RefreshCw },
                  ].map(({ mode, label, icon: Icon }) => (
                    <button
                      key={mode}
                      type="button"
                      role="radio"
                      aria-checked={sendMode === mode}
                      onClick={() => setSendMode(mode)}
                      className={cn(
                        "flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm transition-colors min-h-[44px]",
                        "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]",
                        sendMode === mode
                          ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)] text-[var(--text-primary)]"
                          : "border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
                      )}
                      data-testid={`send-mode-${mode}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />{label}
                    </button>
                  ))}
                </div>
                {sendMode !== "now" && (
                  <div className="mt-3 p-3 rounded-[var(--radius-md)] bg-[var(--surface-1)] text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                    <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t("schedule.dateTimePlaceholder")}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" loading={isSending} disabled={!instruction.trim()} data-testid="comm-send">
                  <Send className="h-4 w-4" aria-hidden="true" />
                  {isSending ? t("actions.sending") : t("actions.send")}
                </Button>
                <Button type="button" variant="outline" disabled={!instruction.trim()} onClick={handlePreview} data-testid="comm-preview">
                  <Eye className="h-4 w-4" aria-hidden="true" />{t("actions.preview")}
                </Button>
                <Button type="button" variant="ghost" disabled={!instruction.trim()} onClick={handleSaveDraft} data-testid="comm-draft">
                  <Save className="h-4 w-4" aria-hidden="true" />{t("actions.saveDraft")}
                </Button>
              </div>
            </form>

            <div aria-live="polite">
              {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 px-4 py-3 text-sm text-[var(--color-danger)]">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{error}
                </div>
              )}
              {result && (
                <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-4 py-3 text-sm text-[var(--color-success)]">
                  <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{result}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar — recipients + quick test */}
        <aside className="space-y-6">
          {/* Recipients */}
          <section
            aria-labelledby="recipients-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="recipients-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t("recipients.title")}</h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{t("recipients.description")}</p>
            <div className="space-y-3">
              {toEmails.map((email, idx) => (
                <div key={`to-${idx}`}>
                  <label htmlFor={`comm-to-${idx}`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    {idx === 0 ? t("recipients.to") : `${t("recipients.to")} ${idx + 1}`}
                  </label>
                  <input
                    id={`comm-to-${idx}`}
                    type="text"
                    value={email}
                    onChange={(e) => updateRecipient("to", idx, e.target.value)}
                    placeholder={t("recipients.toPlaceholder")}
                    className={cn(
                      "w-full h-9 rounded-[var(--radius-md)] border px-3 text-xs",
                      "bg-[var(--surface-0)] placeholder:text-[var(--text-tertiary)]",
                      "border-[var(--border-default)] hover:border-[var(--border-strong)]",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                    )}
                  />
                </div>
              ))}
              {ccEmails.map((email, idx) => (
                <div key={`cc-${idx}`}>
                  <label htmlFor={`comm-cc-${idx}`} className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    {idx === 0 ? t("recipients.cc") : `${t("recipients.cc")} ${idx + 1}`}
                  </label>
                  <input
                    id={`comm-cc-${idx}`}
                    type="text"
                    value={email}
                    onChange={(e) => updateRecipient("cc", idx, e.target.value)}
                    placeholder={t("recipients.ccPlaceholder")}
                    className={cn(
                      "w-full h-9 rounded-[var(--radius-md)] border px-3 text-xs",
                      "bg-[var(--surface-0)] placeholder:text-[var(--text-tertiary)]",
                      "border-[var(--border-default)] hover:border-[var(--border-strong)]",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                    )}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => addRecipientField("to")}
                className={cn(
                  "text-xs font-medium flex items-center gap-1",
                  "text-[var(--brand-python-blue)] hover:underline",
                  "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                )}
              >
                + {t("recipients.addMore")}
              </button>
            </div>
          </section>

          {/* Test send */}
          <button
            type="button"
            onClick={handleTestSend}
            className={cn(
              "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)]",
              "bg-[var(--surface-1)] p-4 text-left transition-colors hover:bg-[var(--surface-2)]",
              "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-accent-light)]">
              <TestTube className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{t("actions.testSend")}</p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{t("actions.testSendDescription")}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[var(--text-tertiary)] shrink-0 ml-auto" aria-hidden="true" />
          </button>
        </aside>
      </div>

      {/* Recent messages */}
      <section aria-labelledby="recent-comm-heading">
        <h2 id="recent-comm-heading" className="text-lg font-semibold text-[var(--text-primary)] mb-3">{t("recentMessages.title")}</h2>
        {recentMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]" role="status">
            <MessageSquare className="h-10 w-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
            <p className="text-sm text-[var(--text-secondary)]">{t("recentMessages.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3" role="list">
            {recentMessages.map((msg) => {
              const ch = channels.find((c) => c.id === msg.channel);
              const ChannelIcon = ch?.icon || Mail;
              const chColor = ch?.color || "var(--text-tertiary)";
              return (
                <div
                  key={msg.id}
                  role="listitem"
                  className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-sm)]"
                  data-testid={`recent-msg-${msg.id}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-1)]">
                    <span style={{ color: chColor }}><ChannelIcon className="h-5 w-5" aria-hidden="true" /></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{msg.subject}</p>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                      <span>{channelName(msg.channel)}</span>
                      <span>{t("recentMessages.sentAt")}: {msg.sentAt.toLocaleString()}</span>
                      <span>{t("recentMessages.recipients", { count: msg.recipients })}</span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
                      msg.status === "sent" && "bg-[var(--color-success)]/10 text-[var(--color-success)]",
                      msg.status === "scheduled" && "bg-[var(--brand-accent-light)] text-[var(--brand-accent-hover)]",
                      msg.status === "failed" && "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                    )}
                    role="status"
                  >
                    {t("status." + msg.status)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
