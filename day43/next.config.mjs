/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Only these remote hosts may be optimised. Add your real image CDN here.
    remotePatterns: [{ protocol: "https", hostname: "cdn.addiseats.et" }],
  },

  // Static redirects belong in config, not in request-intercepting code.
  async redirects() {
    return [{ source: "/old-menu", destination: "/menu", permanent: true }];
  },

  /* config options here */
};

export default nextConfig;
