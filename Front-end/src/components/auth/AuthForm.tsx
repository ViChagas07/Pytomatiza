/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Auth — Main Form with Sign In / Sign Up tabs
   Full WCAG 2.2 AA compliance: tablist pattern, keyboard nav,
   error linking, focus management, loading states.

   Layout: snake banner (native 2125:740 ratio) + compact form below.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter } from "@/i18n/navigation";
import {
  loginSchema,
  signUpSchema,
  type LoginInput,
  type SignUpInput,
} from "@/lib/validations/auth";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Button } from "@/components/ui/Button";
import { GoogleButton } from "./GoogleButton";
import { cn } from "@/lib/utils";

type AuthTab = "signin" | "signup";

export function AuthForm() {
  const tSignIn = useTranslations("auth.signIn");
  const tSignUp = useTranslations("auth.signUp");
  const tAuth = useTranslations("auth");
  const router = useRouter();

  const [activeTab, setActiveTab] = React.useState<AuthTab>("signin");
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const tabListRef = React.useRef<HTMLDivElement>(null);

  /* ── Tab keyboard navigation (Arrow keys) ──────────────────── */
  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const tabs: AuthTab[] = ["signin", "signup"];
    const currentIndex = tabs.indexOf(activeTab);
    let nextIndex = currentIndex;

    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }

    if (nextIndex !== currentIndex) {
      setActiveTab(tabs[nextIndex]);
      const tabButtons = tabListRef.current?.querySelectorAll<HTMLButtonElement>(
        '[role="tab"]'
      );
      tabButtons?.[nextIndex]?.focus();
    }
  };

  /* ── Sign In Form ──────────────────────────────────────────── */
  const signInForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSignIn = async (data: LoginInput) => {
    setGlobalError(null);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setGlobalError(tAuth("errors.invalidCredentials"));
        return;
      }

      router.push("/dashboard");
    } catch {
      setGlobalError(tAuth("errors.generic"));
    }
  };

  /* ── Sign Up Form ──────────────────────────────────────────── */
  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSignUp = async (data: SignUpInput) => {
    setGlobalError(null);
    try {
      // TODO: Call backend registration API
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setGlobalError(tAuth("errors.generic"));
        return;
      }

      router.push("/dashboard");
    } catch {
      setGlobalError(tAuth("errors.generic"));
    }
  };

  /* ── Google Sign-In ────────────────────────────────────────── */
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGlobalError(null);
    try {
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch {
      setGlobalError(tAuth("errors.generic"));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /* ── Tab switch resets global error ────────────────────────── */
  const switchTab = (tab: AuthTab) => {
    setGlobalError(null);
    setActiveTab(tab);
  };

  return (
    <div
      data-testid="auth-form"
      className="relative w-full max-w-2xl overflow-hidden rounded-[var(--radius-lg)] shadow-2xl"
    >
      {/* ════════════════════════════════════════════════════════════
          SNAKE BANNER — Imagem da cobra em proporção nativa 2125:740
          ════════════════════════════════════════════════════════════ */}
      <div
        className="relative w-full min-h-[160px] sm:min-h-[200px]"
        style={{ aspectRatio: "2125 / 740" }}
      >
        <Image
          src="/Pytomatiza_Login_Form.png"
          alt=""
          fill
          priority
          sizes="(max-width: 672px) 100vw, 672px"
          className="object-cover object-center"
          quality={95}
          aria-hidden="true"
        />

        {/* Gradiente sutil na base para transição com a área do form */}
        <div
          className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/35 to-transparent"
          aria-hidden="true"
        />

      </div>

      {/* ════════════════════════════════════════════════════════════
          FORM AREA — escuro semi-transparente com blur
          ════════════════════════════════════════════════════════════ */}
      <div className="bg-black/55 backdrop-blur-md px-5 py-7 sm:px-10 sm:py-9">
        {/* ── Tabs ──────────────────────────────────────────────── */}
        <div
          ref={tabListRef}
          role="tablist"
          aria-label={tAuth("authenticationForm")}
          onKeyDown={handleTabKeyDown}
          className="flex rounded-[var(--radius-md)] bg-white/10 p-1 mb-6"
        >
          {(["signin", "signup"] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              id={`tab-${tab}`}
              aria-selected={activeTab === tab}
              aria-controls={`panel-${tab}`}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => switchTab(tab)}
              data-testid={`auth-tab-${tab}`}
              className={cn(
                "flex-1 rounded-[var(--radius-sm)] py-2 text-sm font-medium transition-all",
                "focus-visible:outline-2 focus-visible:outline-offset-1",
                "focus-visible:outline-white",
                activeTab === tab
                  ? "bg-white text-[var(--brand-python-blue)] shadow-[var(--shadow-sm)]"
                  : "text-white/70 hover:text-white"
              )}
            >
              {tab === "signin" ? tSignIn("submit") : tSignUp("submit")}
            </button>
          ))}
        </div>

        {/* ── Global Error ──────────────────────────────────────── */}
        {globalError && (
          <div
            role="alert"
            className="mb-5 rounded-[var(--radius-md)] bg-red-500/20 border border-red-400/40 px-4 py-2.5 text-sm text-white backdrop-blur-sm"
            data-testid="auth-global-error"
          >
            {globalError}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            SIGN IN PANEL
            ══════════════════════════════════════════════════════════ */}
        <div
          role="tabpanel"
          id="panel-signin"
          aria-labelledby="tab-signin"
          hidden={activeTab !== "signin"}
          tabIndex={0}
        >
          {activeTab === "signin" && (
            <>
              <h1 className="text-xl font-semibold tracking-tight text-white mb-1">
                {tSignIn("title")}
              </h1>
              <p className="text-sm text-white/60 mb-5">
                {tSignIn("subtitle")}
              </p>

              <form
                onSubmit={signInForm.handleSubmit(onSignIn)}
                noValidate
                className="space-y-3.5"
              >
                <Input
                  label={tSignIn("emailLabel")}
                  labelClassName="text-white/85"
                  placeholder={tSignIn("emailPlaceholder")}
                  type="email"
                  autoComplete="email"
                  error={
                    signInForm.formState.errors.email
                      ? tAuth(signInForm.formState.errors.email.message as "auth.errors.invalidEmail")
                      : undefined
                  }
                  {...signInForm.register("email")}
                  data-testid="signin-email"
                />

                <div>
                  <PasswordInput
                    label={tSignIn("passwordLabel")}
                    labelClassName="text-white/85"
                    placeholder={tSignIn("passwordPlaceholder")}
                    error={
                      signInForm.formState.errors.password
                        ? tAuth(signInForm.formState.errors.password.message as "auth.errors.passwordTooShort")
                        : undefined
                    }
                    {...signInForm.register("password")}
                    data-testid="signin-password"
                  />
                  <div className="mt-1 text-right">
                    <a
                      href="#"
                      className="text-xs text-white/75 hover:text-white hover:underline transition-colors"
                    >
                      {tSignIn("forgotPassword")}
                    </a>
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={signInForm.formState.isSubmitting}
                  className="w-full mt-1"
                  data-testid="signin-submit"
                >
                  {tSignIn("submit")}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            SIGN UP PANEL
            ══════════════════════════════════════════════════════════ */}
        <div
          role="tabpanel"
          id="panel-signup"
          aria-labelledby="tab-signup"
          hidden={activeTab !== "signup"}
          tabIndex={0}
        >
          {activeTab === "signup" && (
            <>
              <h1 className="text-xl font-semibold tracking-tight text-white mb-1">
                {tSignUp("title")}
              </h1>
              <p className="text-sm text-white/60 mb-5">
                {tSignUp("subtitle")}
              </p>

              <form
                onSubmit={signUpForm.handleSubmit(onSignUp)}
                noValidate
                className="space-y-3.5"
              >
                <Input
                  label={tSignUp("nameLabel")}
                  labelClassName="text-white/85"
                  placeholder={tSignUp("namePlaceholder")}
                  autoComplete="name"
                  error={
                    signUpForm.formState.errors.name
                      ? tAuth(signUpForm.formState.errors.name.message as "auth.errors.nameTooShort")
                      : undefined
                  }
                  {...signUpForm.register("name")}
                  data-testid="signup-name"
                />

                <Input
                  label={tSignUp("emailLabel")}
                  labelClassName="text-white/85"
                  placeholder={tSignUp("emailPlaceholder")}
                  type="email"
                  autoComplete="email"
                  error={
                    signUpForm.formState.errors.email
                      ? tAuth(signUpForm.formState.errors.email.message as "auth.errors.invalidEmail")
                      : undefined
                  }
                  {...signUpForm.register("email")}
                  data-testid="signup-email"
                />

                <PasswordInput
                  label={tSignUp("passwordLabel")}
                  labelClassName="text-white/85"
                  placeholder={tSignUp("passwordPlaceholder")}
                  autoComplete="new-password"
                  error={
                    signUpForm.formState.errors.password
                      ? tAuth(signUpForm.formState.errors.password.message as "auth.errors.passwordTooShort")
                      : undefined
                  }
                  {...signUpForm.register("password")}
                  data-testid="signup-password"
                />

                <PasswordInput
                  label={tSignUp("confirmPasswordLabel")}
                  labelClassName="text-white/85"
                  placeholder={tSignUp("confirmPasswordPlaceholder")}
                  autoComplete="new-password"
                  error={
                    signUpForm.formState.errors.confirmPassword
                      ? tAuth(signUpForm.formState.errors.confirmPassword.message as "auth.errors.passwordsDoNotMatch")
                      : undefined
                  }
                  {...signUpForm.register("confirmPassword")}
                  data-testid="signup-confirm-password"
                />

                <Button
                  type="submit"
                  loading={signUpForm.formState.isSubmitting}
                  className="w-full mt-1"
                  data-testid="signup-submit"
                >
                  {tSignUp("submit")}
                </Button>
              </form>
            </>
          )}
        </div>

        {/* ── Divider ────────────────────────────────────────────── */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/15" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-black/40 backdrop-blur-sm px-3 text-white/50 rounded-full">
              {tAuth("divider")}
            </span>
          </div>
        </div>

        {/* ── Google OIDC ────────────────────────────────────────── */}
        <GoogleButton
          onClick={handleGoogleSignIn}
          loading={isGoogleLoading}
        />

        {/* ── Footer text ────────────────────────────────────────── */}
        <p className="mt-5 text-center text-sm text-white/60">
          {activeTab === "signin" ? (
            <>
              {tSignIn("noAccount")}{" "}
              <button
                type="button"
                onClick={() => switchTab("signup")}
                className="font-medium text-white hover:underline transition-colors"
              >
                {tSignIn("createOne")}
              </button>
            </>
          ) : (
            <>
              {tSignUp("haveAccount")}{" "}
              <button
                type="button"
                onClick={() => switchTab("signin")}
                className="font-medium text-white hover:underline transition-colors"
              >
                {tSignUp("signIn")}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
