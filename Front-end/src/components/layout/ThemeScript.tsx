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
              var stored = localStorage.getItem('pytomatiza-theme');
              var mode;

              if (stored) {
                var parsed = JSON.parse(stored);
                if (parsed && parsed.state && parsed.state.theme) {
                  mode = parsed.state.theme;
                }
              }

              /* If no stored preference (first visit), fall back to system */
              var isDark;
              if (mode === 'dark') {
                isDark = true;
              } else if (mode === 'light') {
                isDark = false;
              } else {
                /* 'system' or first visit: check OS/browser preference */
                isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
              }

              document.documentElement.classList.toggle('dark', isDark);
            } catch(e) {}
          })();
        `,
      }}
    />
  );
}
