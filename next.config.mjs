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
              "img-src 'self' data: blob: https://orxegahrhbwosbhfvvtc.supabase.co https://scontent*.cdninstagram.com https://images.unsplash.com https://*.basemaps.cartocdn.com",
              "media-src 'self' blob:",
              "font-src 'self'",
              "connect-src 'self' https://orxegahrhbwosbhfvvtc.supabase.co wss://orxegahrhbwosbhfvvtc.supabase.co",
              "frame-ancestors 'none'",
            ].join('; ')
          },
        ],
      },
    ]
  },
};

export default nextConfig;
