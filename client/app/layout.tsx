import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import { initAuthListener } from "./auth-observer";
import { AuthProvider } from "./context";
import NavBar from "./_components/navbar/navbar.tsx";

// Removed because this is supposed to run on the clientside
// // Initialize the auth listener to monitor auth state changes
// initAuthListener();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Circuit Link",
  description: "Circuit Link by Blue Circuit Inc",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
        {/* TODO: Fix <NavBar/> */}
        <AuthProvider>
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}

