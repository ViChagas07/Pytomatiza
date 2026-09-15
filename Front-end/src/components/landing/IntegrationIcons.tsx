/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Landing — Integration Icons
   Monochrome, brand-faithful glyphs for the integrations trust bar.
   Rendered in grayscale via CSS (grayscale + opacity) to follow the
   RedSun "logo bar" pattern without using any external assets.
   ═══════════════════════════════════════════════════════════════════ */

interface IconProps {
  className?: string;
}

export function GmailGlyph({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M4 5.5h16v13H4v-13Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M4 6.5 12 12l8-5.5"
        stroke="var(--surface-0)"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DriveGlyph({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M8.5 3 2.5 13.5 5.5 19 15.5 19 21.5 7.5 18.5 3H8.5Z" fill="currentColor" />
      <path d="M8.5 3 5.5 7.5 8.5 13 15.5 7.5 18.5 3H8.5Z" fill="var(--surface-0)" opacity="0.55" />
      <path d="M21.5 7.5 15.5 19 12 13 15.5 7.5H21.5Z" fill="var(--surface-0)" opacity="0.75" />
    </svg>
  );
}

export function SheetsGlyph({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M6 3h9l3 3v15H6V3Z" fill="currentColor" />
      <path d="M15 3v3h3" fill="var(--surface-0)" opacity="0.6" />
      <path d="M9 10h6M9 13h6M9 16h6" stroke="var(--surface-0)" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function SlackGlyph({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="3.5" fill="currentColor" />
      <path
        d="M9 8.5a1 1 0 1 1-1-1h1v1Zm0 1v4a1 1 0 1 1-2 0v-4h2Zm1 0h4a1 1 0 1 0 1-1h-5v1Zm0-1v-1a1 1 0 1 1 2 0v1h-2Zm1 3.5a1 1 0 1 1 1 1h-1v-1Zm0-1v-4a1 1 0 1 1 2 0v4h-2Zm-1 0H6a1 1 0 1 0-1 1h5v-1Zm0 1v1a1 1 0 1 1-2 0v-1h2Z"
        fill="var(--surface-0)"
        opacity="0.95"
        transform="translate(2.5 1.5)"
      />
    </svg>
  );
}

export function TwitterGlyph({ className = "h-6 w-6" }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M3 4h5l3.5 5L15 4h4l-6.5 8L19 20h-5l-4-5.5L5.5 20H2l7-8.5L3 4Z"
        fill="currentColor"
      />
    </svg>
  );
}
