/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Accent Color Script
   Inline script to apply accent color to all 4 CSS variables
   before first paint (prevents FOUC). Must be in <head>.
   ═══════════════════════════════════════════════════════════════════ */

export function AccentColorScript() {
  const script = `
    (function () {
      try {
        var root = document.documentElement;

        /* Detect dark mode independently: check class OR system preference */
        var isDark = root.classList.contains("dark") ||
                     window.matchMedia("(prefers-color-scheme: dark)").matches;

        /* Read stored accent color; default to "yellow" on first visit */
        var key = "yellow";
        var stored = localStorage.getItem("pytomatiza-accent-color");
        if (stored) {
          var parsed = JSON.parse(stored);
          if (parsed && parsed.state && parsed.state.accentColor) {
            key = parsed.state.accentColor;
          }
        }

        var mainMap = isDark ? {
          yellow: "#FFE066", blue: "#4A9FD4", green: "#47d9a8",
          purple: "#7c73e0", orange: "#f59e6b", red: "#f87171", pink: "#f0abfc"
        } : {
          yellow: "#FFD43B", blue: "#3776AB", green: "#1d9e75",
          purple: "#534ab7", orange: "#e8732e", red: "#e24b4a", pink: "#d946ef"
        };

        var lightMap = isDark ? {
          yellow: "#2A2618", blue: "#1A2A35", green: "#1A2A24",
          purple: "#1D1B30", orange: "#2A2018", red: "#2A1A1A", pink: "#2A1A28"
        } : {
          yellow: "#FFF8E1", blue: "#E8F0F8", green: "#E8F5F0",
          purple: "#EDEBF8", orange: "#FDF0E8", red: "#FCEBEB", pink: "#FCE8FD"
        };

        var hoverMap = isDark ? {
          yellow: "#E6C84A", blue: "#3D8FBF", green: "#3AC894",
          purple: "#6A62CC", orange: "#E08D55", red: "#E55E5E", pink: "#E090F0"
        } : {
          yellow: "#E6BF36", blue: "#2E5F8A", green: "#178A64",
          purple: "#453CA0", orange: "#D1651F", red: "#D03A39", pink: "#C530E0"
        };

        /* Foreground: dark for yellow, white for all others */
        var fgMap = {
          yellow: "#1A1500", blue: "#ffffff", green: "#ffffff",
          purple: "#ffffff", orange: "#ffffff", red: "#ffffff", pink: "#ffffff"
        };

        root.style.setProperty("--brand-accent-dynamic", mainMap[key] || "#FFD43B");
        root.style.setProperty("--brand-accent", mainMap[key] || "#FFD43B");
        root.style.setProperty("--brand-accent-light", lightMap[key] || "#FFF8E1");
        root.style.setProperty("--brand-accent-hover", hoverMap[key] || "#E6BF36");
        root.style.setProperty("--brand-accent-foreground", fgMap[key] || "#ffffff");
      } catch (e) {
        // silent fail
      }
    })();
  `;

  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
