import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import MainNav from "./components/navigation/MainNav";
import Footer from "./components/navigation/Footer";
import { Toaster } from "sonner";
import SessionProvider from "./components/providers/SessionProvider";
import ReactQueryProvider from "./components/providers/ReactQueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FPL Stakes",
  description: "Fantasy Premier League with real stakes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-gray-200 relative overflow-x-hidden`}
      >
        {/* Background gradients and effects */}
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-purple-900/20 to-gray-950 pointer-events-none"></div>
        <div className="fixed top-0 -left-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="fixed bottom-0 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <ReactQueryProvider>
          <SessionProvider>
            <div className="min-h-screen flex flex-col relative z-10">
              <MainNav />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
            <Toaster
              theme="dark"
              position="top-right"
              toastOptions={{
                style: {
                  background: 'rgba(17, 24, 39, 0.8)',
                  color: '#e2e8f0',
                  border: '1px solid rgba(75, 85, 99, 0.4)',
                  backdropFilter: 'blur(8px)',
                },
              }}
            />
          </SessionProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
