"use client";

import * as React from "react";
import Link from "next/link";
import {
  Shield,
  Database,
  Eye,
  Share2,
  HardDrive,
  UserCheck,
  Trash2,
  Lock,
  Globe,
  Mail,
  FileText,
  ExternalLink,
  ChevronRight,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Section definitions ────────────────────────────────────────── */

interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
}

export function PrivacyContent() {
  const [activeSection, setActiveSection] = React.useState("intro");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    document.querySelectorAll("[data-section]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-[var(--surface-0)]">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="border-b border-[var(--border-default)] bg-[var(--surface-0)]/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)] hover:text-[var(--brand-accent)] transition-colors">
            <Shield className="h-5 w-5 text-[var(--brand-accent)]" />
            Pytomatiza+
          </Link>
          <span className="text-xs text-[var(--text-tertiary)]">Política de Privacidade & Termos de Uso</span>
        </div>
      </header>

      {/* ── Main layout ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 lg:px-6 py-10 lg:py-16">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-12">
          {/* Sidebar nav */}
          <aside className="hidden lg:block">
            <nav className="sticky top-20 space-y-0.5" aria-label="Navegação da política">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-3 px-3">
                Nesta página
              </p>
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => scrollTo(s.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-sm transition-all",
                    activeSection === s.id
                      ? "bg-[var(--brand-accent-light)] text-[var(--brand-accent)] font-medium"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-1)]"
                  )}
                >
                  <s.icon className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{s.title}</span>
                  {activeSection === s.id && <ChevronRight className="h-3 w-3 ml-auto shrink-0" />}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <main className="min-w-0">
            {/* Hero */}
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-accent-light)] px-4 py-1.5 text-xs font-medium text-[var(--brand-accent)] mb-4">
                <Shield className="h-3.5 w-3.5" />
                LGPD · GDPR · SaaS Compliance
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)] lg:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                Política de Privacidade
                <span className="block text-lg font-normal text-[var(--text-secondary)] mt-2">
                  & Termos de Uso do Pytomatiza+
                </span>
              </h1>
              <p className="mt-3 text-sm text-[var(--text-tertiary)]">
                Última atualização: 18 de Junho de 2026
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-16">
              {sections.map((s) => (
                <section key={s.id} id={s.id} data-section className="scroll-mt-20">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
                      <s.icon className="h-5 w-5 text-[var(--brand-accent)]" />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">{s.title}</h2>
                  </div>
                  <div className="prose prose-sm max-w-none text-[var(--text-secondary)] leading-relaxed space-y-4">
                    {s.content}
                  </div>
                </section>
              ))}
            </div>

            {/* Footer note */}
            <div className="mt-16 pt-8 border-t border-[var(--border-default)]">
              <p className="text-xs text-[var(--text-tertiary)]">
                © {new Date().getFullYear()} Pytomatiza+. Todos os direitos reservados.
                Para solicitações de privacidade, entre em contato em{" "}
                <a href="mailto:privacy@pytomatiza.com" className="text-[var(--brand-accent)] hover:underline">
                  privacy@pytomatiza.com
                </a>.
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   CONTENT
   ═══════════════════════════════════════════════════════════════════ */

const ThirdPartyLink = ({ name, url }: { name: string; url: string }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1 text-[var(--brand-accent)] hover:underline"
  >
    {name} <ExternalLink className="h-3 w-3" />
  </a>
);

const sections: Section[] = [
  {
    id: "intro",
    title: "Introdução",
    icon: Shield,
    content: (
      <>
        <p>
          O <strong>Pytomatiza+</strong> é uma plataforma de automação inteligente que permite a criação,
          execução e monitoramento de workflows automatizados integrados com serviços de terceiros como
          Google, Discord, Telegram, Meta (Facebook/WhatsApp), Trello e Jira.
        </p>
        <p>
          Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos seus
          dados pessoais, em conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD —
          Lei nº 13.709/2018)</strong> e boas práticas internacionais de privacidade.
        </p>
        <p>
          Ao utilizar o Pytomatiza+, você concorda com esta política e com os Termos de Uso descritos
          ao final desta página.
        </p>
      </>
    ),
  },
  {
    id: "data-collected",
    title: "Dados Coletados",
    icon: Database,
    content: (
      <>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-6 mb-2">Dados de Autenticação</h3>
        <p>
          Quando você se autentica via <strong>Google OAuth</strong>, <strong>Discord</strong> ou{" "}
          <strong>Facebook</strong>, podemos acessar:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Nome completo</li>
          <li>Endereço de e-mail</li>
          <li>Foto de perfil (quando disponível)</li>
          <li>Identificador único do provedor (Google ID, Discord ID, Facebook ID)</li>
        </ul>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-6 mb-2">Dados de Uso</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Logs de execução de automações</li>
          <li>Métricas de uso da plataforma</li>
          <li>Preferências de configuração</li>
          <li>Histórico de workflows executados</li>
        </ul>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-6 mb-2">Dados Enviados pelo Usuário</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Documentos (PDFs, planilhas, arquivos de texto)</li>
          <li>Imagens submetidas para OCR ou processamento</li>
          <li>Conteúdo de e-mails processados via Gmail</li>
          <li>Arquivos enviados para Google Drive</li>
        </ul>
      </>
    ),
  },
  {
    id: "usage",
    title: "Uso dos Dados",
    icon: Eye,
    content: (
      <>
        <p>Utilizamos seus dados exclusivamente para as seguintes finalidades:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>Autenticação:</strong> identificar e autorizar seu acesso à plataforma.</li>
          <li><strong>Execução de Automações:</strong> processar workflows que você configurou, incluindo envio de mensagens, processamento de documentos, integração com serviços terceiros.</li>
          <li><strong>Melhoria da Plataforma:</strong> análise anonimizada de métricas para aprimorar a experiência.</li>
          <li><strong>Prevenção de Abuso:</strong> detectar e prevenir atividades maliciosas, spam ou uso não autorizado.</li>
          <li><strong>Segurança:</strong> monitoramento de integridade do sistema e proteção contra acessos indevidos.</li>
        </ul>
        <p className="mt-4">
          <strong>Não vendemos, alugamos ou comercializamos seus dados pessoais.</strong>
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Compartilhamento de Dados",
    icon: Share2,
    content: (
      <>
        <p>
          Seus dados podem ser compartilhados com serviços terceiros apenas quando estritamente
          necessário para executar os fluxos de automação que você solicitou:
        </p>
        <div className="grid gap-2 sm:grid-cols-2 mt-3">
          {[
            { name: "Google (Drive, Gmail, Gemini)", url: "https://policies.google.com/privacy" },
            { name: "Meta (Facebook, WhatsApp)", url: "https://www.facebook.com/privacy/policy" },
            { name: "Discord", url: "https://discord.com/privacy" },
            { name: "Telegram", url: "https://telegram.org/privacy" },
            { name: "Trello (Atlassian)", url: "https://www.atlassian.com/legal/privacy-policy" },
            { name: "Jira (Atlassian)", url: "https://www.atlassian.com/legal/privacy-policy" },
          ].map((svc) => (
            <div key={svc.name} className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2 text-sm">
              <ThirdPartyLink name={svc.name} url={svc.url} />
            </div>
          ))}
        </div>
        <p className="mt-4">
          O compartilhamento ocorre exclusivamente via APIs oficiais, utilizando tokens OAuth
          gerenciados pelo usuário. Você pode revogar o acesso a qualquer momento.
        </p>
      </>
    ),
  },
  {
    id: "storage",
    title: "Armazenamento e Proteção",
    icon: HardDrive,
    content: (
      <>
        <p>Seus dados são armazenados utilizando infraestrutura segura:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li><strong>PostgreSQL:</strong> banco de dados relacional com criptografia em repouso.</li>
          <li><strong>Redis:</strong> cache e filas com isolamento por tenant.</li>
          <li><strong>AWS S3:</strong> armazenamento de arquivos com criptografia AES-256 (quando aplicável).</li>
        </ul>
        <p className="mt-4">
          Implementamos controles de acesso baseados em função (RBAC), autenticação multifator (JWT + OAuth),
          e monitoramento contínuo contra acessos não autorizados.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Direitos do Titular (LGPD)",
    icon: UserCheck,
    content: (
      <>
        <p>
          Em conformidade com a LGPD (Art. 18), você tem os seguintes direitos sobre seus dados pessoais:
        </p>
        <div className="grid gap-3 sm:grid-cols-2 mt-3">
          {[
            { title: "Acesso", desc: "Confirmar a existência de tratamento e acessar seus dados." },
            { title: "Correção", desc: "Solicitar a correção de dados incompletos ou desatualizados." },
            { title: "Exclusão", desc: "Solicitar a remoção definitiva dos seus dados pessoais." },
            { title: "Anonimização", desc: "Solicitar a anonimização ou bloqueio de dados desnecessários." },
            { title: "Portabilidade", desc: "Solicitar a transferência dos seus dados para outro fornecedor." },
            { title: "Revogação", desc: "Revogar consentimento a qualquer momento." },
          ].map((right) => (
            <div key={right.title} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] p-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{right.title}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{right.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-4">
          Para exercer qualquer um desses direitos, entre em contato em{" "}
          <a href="mailto:privacy@pytomatiza.com" className="text-[var(--brand-accent)] hover:underline">
            privacy@pytomatiza.com
          </a>.
        </p>
      </>
    ),
  },
  {
    id: "deletion",
    title: "Exclusão de Conta",
    icon: Trash2,
    content: (
      <>
        <p>
          Você pode solicitar a exclusão da sua conta e de todos os dados associados a qualquer momento.
          O processo segue as seguintes etapas:
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-sm">
          <li>Envie uma solicitação para <strong>privacy@pytomatiza.com</strong> com o assunto "Exclusão de Conta".</li>
          <li>Sua identidade será verificada em até 48 horas.</li>
          <li>Após confirmação, todos os seus dados serão removidos em até 30 dias.</li>
          <li>Dados necessários para obrigações legais (como registros fiscais) podem ser retidos pelo período exigido por lei.</li>
        </ol>
      </>
    ),
  },
  {
    id: "security",
    title: "Segurança",
    icon: Lock,
    content: (
      <>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li><strong>Criptografia:</strong> todas as comunicações utilizam TLS 1.3. Tokens e credenciais são armazenados com criptografia AES-256.</li>
          <li><strong>Autenticação:</strong> utilizamos JWT com rotação de chaves e OAuth 2.0 para integrações com terceiros.</li>
          <li><strong>Controle de Acesso:</strong> cada usuário acessa exclusivamente seus próprios dados (isolamento por tenant).</li>
          <li><strong>Monitoramento:</strong> logs de auditoria, alertas de segurança e detecção de anomalias em tempo real.</li>
          <li><strong>Backups:</strong> backups diários automatizados com retenção de 30 dias.</li>
        </ul>
      </>
    ),
  },
  {
    id: "terms",
    title: "Termos de Uso",
    icon: Scale,
    content: (
      <>
        <p>
          Ao utilizar o Pytomatiza+, você concorda com os seguintes Termos de Uso. O não cumprimento
          destes termos poderá resultar na suspensão ou exclusão da sua conta.
        </p>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-6 mb-2">Uso Aceitável</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Você é responsável por todas as automações configuradas em sua conta.</li>
          <li>Você deve possuir autorização para acessar e processar quaisquer dados submetidos à plataforma.</li>
          <li>O uso da plataforma deve estar em conformidade com as leis aplicáveis, incluindo LGPD e GDPR.</li>
        </ul>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-6 mb-2">Proibições</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Envio de spam ou mensagens não solicitadas.</li>
          <li>Criação de automações abusivas que sobrecarreguem serviços terceiros.</li>
          <li>Uso malicioso para phishing, fraudes ou atividades ilegais.</li>
          <li>Compartilhamento de credenciais de acesso com terceiros não autorizados.</li>
          <li>Mineração de dados ou raspagem não autorizada.</li>
          <li>Distribuição de malware, ransomware ou código malicioso.</li>
        </ul>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-6 mb-2">Limitação de Responsabilidade</h3>
        <p>
          O Pytomatiza+ é fornecido "como está" (as-is). Não nos responsabilizamos por danos indiretos,
          incidentais ou consequenciais decorrentes do uso da plataforma, incluindo perda de dados,
          interrupção de serviços ou falhas em integrações com terceiros.
        </p>

        <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-6 mb-2">Modificações</h3>
        <p>
          Reservamo-nos o direito de modificar estes Termos de Uso a qualquer momento. Alterações
          significativas serão comunicadas com antecedência mínima de 30 dias.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contato",
    icon: Mail,
    content: (
      <>
        <p>Para solicitações relacionadas à privacidade, exercício de direitos ou dúvidas sobre estes termos:</p>
        <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)] p-5 mt-3 space-y-2">
          <p className="text-sm">
            📧 <strong>E-mail:</strong>{" "}
            <a href="mailto:privacy@pytomatiza.com" className="text-[var(--brand-accent)] hover:underline">
              privacy@pytomatiza.com
            </a>
          </p>
          <p className="text-sm">
            🌐 <strong>Website:</strong>{" "}
            <a href="https://pytomatiza.com" className="text-[var(--brand-accent)] hover:underline">
              pytomatiza.com
            </a>
          </p>
          <p className="text-xs text-[var(--text-tertiary)] mt-3">
            Responderemos à sua solicitação no prazo máximo de 15 dias, conforme estabelecido pela LGPD.
          </p>
        </div>
      </>
    ),
  },
];
