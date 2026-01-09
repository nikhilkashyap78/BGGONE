import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bggone.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "BGGONE - Free AI Background Remover | Instant Transparent PNG",
  description: "Remove image backgrounds instantly for free with BGGONE. 100% automatic AI tool. Download high-quality transparent PNGs. No signup required.",
  keywords: ["background remover", "remove background", "transparent png", "free background remover", "ai background removal", "image editor", "online photo editor"],
  authors: [{ name: "BGGONE" }],
  robots: "index, follow",

  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "BGGONE - Free AI Background Remover",
    description: "Remove backgrounds from images instantly with our free AI tool. No signup needed.",
    siteName: "BGGONE",
    images: [
      {
        url: "/favicon.png",
        width: 512,
        height: 512,
        alt: "BGGONE Logo",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "BGGONE - Free AI Background Remover",
    description: "Remove backgrounds from images instantly with our free AI tool. No signup needed.",
    images: ["/favicon.png"],
  },

  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Structured Data - WebSite Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "BGGONE",
    "url": SITE_URL,
    "description": "Free AI-powered background remover tool",
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${SITE_URL}?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  // Structured Data - Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "BGGONE",
    "url": SITE_URL,
    "logo": `${SITE_URL}/favicon.png`,
    "sameAs": []
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured Data */}
        <Script
          id="website-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-9BJ6CX76MW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-9BJ6CX76MW');
          `}
        </Script>
      </head>
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  );
}
