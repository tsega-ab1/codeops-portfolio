import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-container">
      <h1 className="page-title">Page Not Found</h1>
      <p>Sorry, the page you requested does not exist.</p>
      <Link href="/" className="primary-button">
        Return Home
      </Link>
    </main>
  );
}
