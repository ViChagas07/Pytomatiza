/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Layout — ThemeScript
   Inline script injected into <head> to apply dark mode class
   before first paint, preventing FOUC.
   Uses next/script with strategy="beforeInteractive" to satisfy
   React 19's security requirements for script tags.
   ═══════════════════════════════════════════════════════════════════ */

import Script from "next/script";

export function ThemeScript() {
  return (
    <Script
      id="theme-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = JSON.parse(localStorage.getItem('pytomatiza-theme'));
              if (!theme || !theme.state || !theme.state.theme) return;
              var mode = theme.state.theme;
              var isDark = mode === 'dark' ||
                (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
              if (isDark) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            } catch(e) {}
          })();
        `,
      }}
    />
  );
}
