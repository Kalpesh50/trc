'use client'
import { Poppins } from "next/font/google";
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks';
import { WalletModalProvider } from '@tronweb3/tronwallet-adapter-react-ui';
import { useMemo } from "react";
import { TronLinkAdapter } from '@tronweb3/tronwallet-adapters';



import "./globals.css";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-poppins',
});




export default function RootLayout({ children }) {
  // Set up the wallet adapters
  const adapters = useMemo(() => {
    const tronLink = new TronLinkAdapter();
    return [tronLink]; // Use TronLink as the adapter
  }, []);

  return (
    <html lang="en">
      <body className={`${poppins.variable} font-poppins antialiased`}>
        {/* Wrap your app in WalletProvider and WalletModalProvider */}
        <WalletProvider adapters={adapters}>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
