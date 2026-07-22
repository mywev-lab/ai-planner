/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Hide the framework fingerprint from casual scanners.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Keep the whole app out of search indexes and AI corpora.
          {
            key: "X-Robots-Tag",
            value:
              "noindex, nofollow, noarchive, nosnippet, noimageindex, noai, noimageai",
          },
          // Baseline hardening.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
