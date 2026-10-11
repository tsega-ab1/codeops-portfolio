import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";
import ThirdPartyScripts from "./_components/ThirdPartyScripts";

// next/font downloads the font at build time and serves it from our own domain:
// no request to Google at runtime, and a size-matched fallback to limit layout shift.
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Addis Eats",
  description: "Ethiopian food ordering application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Providers>{children}</Providers>
        <ThirdPartyScripts />
      </body>
    </html>
  );
}
