import { SITE_URL, SITE_NAME } from "./lib/site";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s · Addis Eats",
    default: "Addis Eats — Ethiopian food delivery in Addis Ababa"
  },
  description: "Discover Ethiopian dishes from kitchens across Addis Ababa.",
  openGraph: {
    siteName: SITE_NAME,
    locale: "en_ET",
    type: "website"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: 24 }}>
        <header>
          <nav style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <a href="/">Home</a>
            <a href="/menu">Menu</a>
            <a href="/cart">Cart</a>
          </nav>
        </header>
        {children}
        <footer style={{ marginTop: 48, color: "#666" }}>© Addis Eats</footer>
      </body>
    </html>
  );
}
