import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { DialogProvider } from "@/components/providers/DialogProvider";
import { GlobalErrorCatcher } from "@/components/GlobalErrorCatcher";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    template: 'COMERZA — %s',
    default: 'COMERZA',
  },
  description: "Punto de venta y administración en la nube",
  icons: {
    icon: "/logo.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${spaceGrotesk.variable}`}>
      <body>
        <GlobalErrorCatcher />
        <DialogProvider>
          {children}
        </DialogProvider>
      </body>
    </html>
  );
}
