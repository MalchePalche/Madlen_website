// Supabase host used in the CSP below. Derived from the public env var so a
// project migration only needs the env changed, not this file; the current
// production project is the fallback when the var isn't set at build time.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://orxegahrhbwosbhfvvtc.supabase.co";
const SUPABASE_HOST = new URL(SUPABASE_URL).host;

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob: https://${SUPABASE_HOST} https://scontent*.cdninstagram.com https://images.unsplash.com https://*.basemaps.cartocdn.com`,
              "media-src 'self' blob:",
              "font-src 'self'",
              `connect-src 'self' https://${SUPABASE_HOST} wss://${SUPABASE_HOST}`,
              "frame-ancestors 'none'",
            ].join('; ')
          },
        ],
      },
    ]
  },
};

export default nextConfig;
