import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { auth } from "~/server/auth";

export const metadata: Metadata = {
  title: "Advtech Permit Tracker",
  description: "Teacher permit compliance tracking for Advtech Schools",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        {session && (
          <nav className="flex items-center gap-6 border-b bg-white px-6 py-3 text-sm">
            <span className="font-semibold text-slate-800">
              Advtech Permits
            </span>
            <Link
              href="/dashboard"
              className="text-slate-600 hover:text-slate-900"
            >
              Dashboard
            </Link>
            <Link
              href="/teachers"
              className="text-slate-600 hover:text-slate-900"
            >
              Teachers
            </Link>
            {session.user.role === "OPS_MANAGER" && (
              <Link
                href="/admin/schools"
                className="text-slate-600 hover:text-slate-900"
              >
                Schools
              </Link>
            )}
            <span className="ml-auto text-slate-400">{session.user.name}</span>
          </nav>
        )}
        {children}
      </body>
    </html>
  );
}
