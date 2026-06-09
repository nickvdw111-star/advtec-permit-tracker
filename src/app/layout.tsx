import "~/styles/globals.css";

import { type Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import { auth } from "~/server/auth";

export const metadata: Metadata = {
  title: "Advtech Permit Tracker",
  description: "Teacher permit compliance tracking for Advtech Schools",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={`${poppins.variable}`}>
      <body>
        {session && (
          <nav className="flex items-center gap-6 bg-[#1a3878] px-6 py-3 text-sm">
            <span className="font-semibold tracking-wide text-white">
              GIS · Permits
            </span>
            <div className="h-4 w-px bg-white/20" />
            <Link
              href="/dashboard"
              className="text-blue-100 transition-colors hover:text-[#f5c518]"
            >
              Dashboard
            </Link>
            <Link
              href="/teachers"
              className="text-blue-100 transition-colors hover:text-[#f5c518]"
            >
              Teachers
            </Link>
            <Link
              href="/reports/timeline"
              className="text-blue-100 transition-colors hover:text-[#f5c518]"
            >
              Timeline
            </Link>
            {session.user.role === "OPS_MANAGER" && (
              <Link
                href="/admin/schools"
                className="text-blue-100 transition-colors hover:text-[#f5c518]"
              >
                Schools
              </Link>
            )}
            <span className="ml-auto text-blue-300 text-xs">{session.user.name}</span>
          </nav>
        )}
        {children}
      </body>
    </html>
  );
}
