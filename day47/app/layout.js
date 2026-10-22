import "./globals.css";
import { Inter } from "next/font/google";
import Nav from "@/components/Nav";
import { SITE_URL, SITE_NAME } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s · Addis Eats",
    default: "Addis Eats — Ethiopian food delivery in Addis Ababa"
  },
  description: "Discover Ethiopian dishes from kitchens across Addis Ababa.",
  openGraph: { siteName: SITE_NAME, locale: "en_ET", type: "website" }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
          <Nav />
          <main>{children}</main>
          <footer style={{ marginTop: 48 }} className="muted">© Addis Eats</footer>
        </div>
      </body>
    </html>
  );
}
