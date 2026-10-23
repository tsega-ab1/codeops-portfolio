/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // BASELINE=1 npm run build  -> measure "before" without image optimisation
    unoptimized: process.env.BASELINE === "1"
  }
};

export default nextConfig;
