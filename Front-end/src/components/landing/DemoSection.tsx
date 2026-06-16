"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import * as Tabs from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const tabs = ["workflows", "dashboard", "editor", "automations"] as const;

export function DemoSection() {
  const t = useTranslations("landing");
  const [activeTab, setActiveTab] = React.useState<string>(tabs[0]);

  return (
    <section aria-labelledby="demo-heading" className="py-16 md:py-24 bg-[var(--surface-1)]/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <h2
            id="demo-heading"
            className="text-3xl font-bold md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("demo.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            {t("demo.subtitle")}
          </p>
        </div>

        <Tabs.Root
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-10"
        >
          <Tabs.List
            className="flex justify-center gap-1 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-1 w-fit mx-auto"
            aria-label={t("demo.tabsLabel")}
          >
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab}
                value={tab}
                className={cn(
                  "rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-all",
                  "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  "data-[state=active]:bg-[var(--surface-0)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--shadow-xs)]"
                )}
              >
                {t(`demo.${tab}`)}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {tabs.map((tab) => (
            <Tabs.Content key={tab} value={tab} className="mt-8 outline-none">
              <DemoMockup tab={tab} />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}

function DemoMockup({ tab }: { tab: string }) {
  return (
    <div className="mx-auto max-w-4xl rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-md)] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-accent)]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
        <div className="ml-4 h-6 flex-1 max-w-xs rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
      </div>

      <div className="p-6">
        {tab === "workflows" && <MockupWorkflows />}
        {tab === "dashboard" && <MockupDashboard />}
        {tab === "editor" && <MockupEditor />}
        {tab === "automations" && <MockupAutomations />}
      </div>
    </div>
  );
}

function MockupWorkflows() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border-default)] p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
            <div className="h-5 w-5 rounded-full border-2 border-[var(--brand-accent)]" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 rounded bg-[var(--surface-2)]" />
            <div className="h-2 w-32 rounded bg-[var(--surface-2)]" />
          </div>
          <div className="flex gap-2">
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-6 w-6 rounded-full bg-[var(--surface-2)]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function MockupDashboard() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`rounded-[var(--radius-md)] border border-[var(--border-default)] p-4 ${i >= 3 ? "col-span-3 sm:col-span-1" : ""}`}
        >
          <div className="h-2 w-16 rounded bg-[var(--surface-2)]" />
          <div className="mt-3 h-8 w-full rounded bg-gradient-to-r from-[var(--brand-accent)]/30 to-transparent" />
          <div className="mt-2 flex items-center gap-2">
            <div className="h-4 w-4 rounded-full bg-[var(--color-success)]" />
            <div className="h-2 w-12 rounded bg-[var(--surface-2)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MockupEditor() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-[var(--brand-accent)]" />
        <div className="h-3 w-24 rounded bg-[var(--surface-2)]" />
      </div>
      <div className="space-y-2 rounded-[var(--radius-md)] bg-[var(--surface-1)] p-4 font-mono text-sm">
        {[
          "trigger: email.received",
          "  condition: subject.contains('invoice')",
          "  actions:",
          "    - extract.attachments",
          "    - save.to('google/drive/invoices')",
          "    - notify.slack('#finance')",
        ].map((line, i) => (
          <div key={i} className="flex">
            <span className="w-6 text-[var(--text-tertiary)]">{i + 1}</span>
            <span className={i === 0 ? "text-[var(--brand-accent)]" : "text-[var(--text-secondary)]"}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupAutomations() {
  return (
    <div className="space-y-3">
      {["Email Processing", "Data Sync", "Report Generation", "Backup"].map((name, i) => (
        <div
          key={name}
          className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--border-default)] p-3"
        >
          <div
            className={`h-3 w-3 rounded-full ${i % 2 === 0 ? "bg-[var(--color-success)]" : "bg-[var(--brand-accent)]"}`}
          />
          <div className="flex-1">
            <div className="h-3 w-36 rounded bg-[var(--surface-2)]" />
          </div>
          <div className="flex -space-x-1">
            {[0, 1, 2].map((j) => (
              <div key={j} className="h-6 w-6 rounded-full border-2 border-[var(--surface-0)] bg-[var(--surface-2)]" />
            ))}
          </div>
          <div className="h-5 w-12 rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]" />
        </div>
      ))}
    </div>
  );
}
