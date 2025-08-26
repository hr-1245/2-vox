import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/_components/blocks/layouts/ClientLayout";

export const metadata: Metadata = {
  title: "VOX Live Chat Portal",
  description: "VOX Live Chat Portal -Manage your chat transcripts -  VOX and Zendesk",
  icons: {
    icon: [
      // { url: '/brand_c2.ico' },
    ]
  }

};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}

export const dynamic = "force-dynamic";
