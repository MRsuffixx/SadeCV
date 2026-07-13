import "~/styles/globals.css";

import { type Metadata } from "next";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_DOMAIN),
  title: {
    default: "SadeCV — Your story, clearly told",
    template: "%s · SadeCV",
  },
  description:
    "Build a focused, beautifully structured CV that is easy to edit, share, and remember.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "SadeCV — Your story, clearly told",
    description:
      "A calm, intelligent workspace for creating exceptional professional CVs.",
    type: "website",
    siteName: "SadeCV",
    images: [
      {
        url: "/og.png",
        width: 1792,
        height: 921,
        alt: "SadeCV — Your story, clearly told.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SadeCV — Your story, clearly told",
    description:
      "A calm, intelligent workspace for creating exceptional professional CVs.",
    images: ["/og.png"],
  },
  other: {
    "darkreader-lock": "true",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#f7f7f2] text-[#171a18] antialiased">
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
