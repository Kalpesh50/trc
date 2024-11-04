import { Poppins } from "next/font/google";
import "./globals.css";
import { headers } from 'next/headers'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
});

export const metadata = {
  title: "TRC Checker",
  description: "Check wallets for Flash USDT & illicit funds"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins antialiased`}>{children}</body>
    </html>
  );
}