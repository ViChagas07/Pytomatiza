/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI — Google Service Icons
   Minimal SVG representations of Google Drive & Google Photos.
   ═══════════════════════════════════════════════════════════════════ */

interface IconProps {
  className?: string;
}

/** Google Drive — triangular logo (green/yellow/blue) */
export function GoogleDriveIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M8.5 2L2 13.5L5.25 19L15.5 19L22 7.5L18.75 2H8.5Z" fill="#3776AB" />
      <path d="M8.5 2L5.25 7.5L8.5 13L15.5 7.5L18.75 2H8.5Z" fill="#FFD43B" />
      <path d="M22 7.5L15.5 19L12 13L15.5 7.5H22Z" fill="#1D9E75" />
    </svg>
  );
}

/** Google Photos — pinwheel logo (red/blue/green/yellow) */
export function GooglePhotosIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C12 2 8 6 8 10C8 12 9 14 12 14C15 14 16 12 16 10C16 6 12 2 12 2Z" fill="#E24B4A" />
      <path d="M12 22C12 22 16 18 16 14C16 12 15 10 12 10C9 10 8 12 8 14C8 18 12 22 12 22Z" fill="#3776AB" />
      <path d="M2 12C2 12 6 8 10 8C12 8 14 9 14 12C14 15 12 16 10 16C6 16 2 12 2 12Z" fill="#1D9E75" />
      <path d="M22 12C22 12 18 16 14 16C12 16 10 15 10 12C10 9 12 8 14 8C18 8 22 12 22 12Z" fill="#FFD43B" />
    </svg>
  );
}

/** Gmail — envelope logo */
export function GmailIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <img
      src="/gmail-logo.png"
      alt="Gmail"
      className={className}
      style={{ objectFit: "contain" }}
      aria-hidden="true"
    />
  );
}
