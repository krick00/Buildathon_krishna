import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { getSessionUser } from "@/lib/auth/currentUser";

export const metadata: Metadata = {
  title: "Booklog — your social reading diary",
  description: "A Letterboxd-style social reading diary for books.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  return (
    <html lang="en">
      <body>
        <Nav user={user} />
        <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-10">{children}</main>
      </body>
    </html>
  );
}
