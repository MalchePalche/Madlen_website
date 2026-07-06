import type { Metadata, Viewport } from "next";
import { Manrope, Prata } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/config";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ServiceWorkerRegister } from "@/components/pwa/ServiceWorkerRegister";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const prata = Prata({
  subsets: ["latin", "cyrillic"],
  variable: "--font-prata",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Минималистична българска модна марка. Мъжко и дамско облекло, наложен платеж, доставка в цялата страна.",
  metadataBase: new URL("https://noem-studio.com"),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: BRAND.name,
  },
  openGraph: {
    title: BRAND.name,
    description: BRAND.tagline,
    locale: "bg_BG",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  // Extend under the iPhone notch/home indicator so safe-area insets resolve.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bg" className={`${manrope.variable} ${prata.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <SiteFrame>{children}</SiteFrame>
        </AuthProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
