import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Zion TeCHer Freelance",
    template: "%s · Zion TeCHer Freelance"
  },
  description:
    "Production-grade global freelance marketplace for clients and top freelancers."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

