const { ethers } = require("ethers");
require("dotenv").config();
const rpc = process.env.RPC;
const pk = process.env.PK;
const oofAddress = process.env.OOFAddress;
const ABI = require("../abi/Morpeus.json");
const provider = new ethers.providers.JsonRpcProvider(rpc);
const walletWithProvider = new ethers.Wallet(pk, provider);
const signers = [""];
const threshold = 1;

async function init() {
  // Create a contract object
  const contract = new ethers.Contract(oofAddress, ABI, walletWithProvider);
  try {
    let tx = await contract.initialize(
      signers,
      threshold,
      "0x0000000000000000000000000000000000000000",
      0,
      "0x3c7d411cd262d3Fe4c0432C7412341aFc33efd11",
    );
    const { cumulativeGasUsed, gasUsed, transactionHash } = await tx.wait();
    console.log(`Cumulative: ${cumulativeGasUsed.toNumber()}`);
    console.log(`Gas: ${gasUsed.toNumber()}`);
    console.log(`hash: ${transactionHash.toString()}`);
    console.log("oracle ready");
  } catch (e) {
    console.log(e);
  }
}

// Example usage
init();
