import withPWA from "next-pwa";

const nextConfig = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})({
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ldb-phinf.pstatic.net",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "search.pstatic.net",
        pathname: "/**",
      },
    ],
  },
});

export default nextConfig;
