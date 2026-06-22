import type { Metadata } from "next";
import { Manrope, Prata } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/config";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { AuthProvider } from "@/components/auth/AuthProvider";

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
  metadataBase: new URL("https://madlen.bg"),
  openGraph: {
    title: BRAND.name,
    description: BRAND.tagline,
    locale: "bg_BG",
    type: "website",
  },
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
      </body>
    </html>
  );
}
