import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chili Cook-Off Voting System",
  description: "Vote for your favorite chili at the UIF Chili Cook-Off 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
