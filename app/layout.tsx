import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Elektron — Fleet operations",
  description:
    "Hiraya Renewables · A simulated renewable energy operations workspace and interactive digital twin. Built by Bryl Lim with Engr. Will Delos Reyes.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <body>{children}</body>
    </html>
  );
}
