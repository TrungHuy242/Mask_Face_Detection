import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

export const metadata = {
  title: "MaskGuard AI - Phát hiện khẩu trang",
  description: "AI phát hiện người đeo khẩu trang đúng/sai/không đeo - Real-time & Upload",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col transition-colors" suppressHydrationWarning={true}>
        <Navbar />
        <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}