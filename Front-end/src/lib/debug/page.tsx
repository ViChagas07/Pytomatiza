export default function DebugPage() {
  return (
    <div>
      <p>AUTH_GOOGLE_ID: {process.env.AUTH_GOOGLE_ID ? "EXISTS" : "MISSING"}</p>

      <p>NEXTAUTH_URL: {process.env.NEXTAUTH_URL}</p>

      <p>AUTH_URL: {process.env.AUTH_URL}</p>
    </div>
  );
}