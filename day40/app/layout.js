import "./globals.css";
import Header from "../components/Header";
import Providers from "../components/Providers";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          {children}
          <footer className="site-footer">
            <p>© 2026 Addis Eats</p>
            <p>Delicious food from Addis Ababa.</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
