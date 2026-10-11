import Script from "next/script";

// Non-critical third-party JS loads at browser idle time (lazyOnload).
// Renders nothing unless NEXT_PUBLIC_ANALYTICS_SRC is set, so there is no broken request.
export default function ThirdPartyScripts() {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC;
  if (!src) return null;
  return <Script src={src} strategy="lazyOnload" />;
}
