const ethers = require("ethers");
require("dotenv").config();
let rpc = process.env.RPC;
let contractAddress = process.env.OOFAddress; // replace with your contract address
const ABI = require("../abi/NostradamusSS.json");
const { Contract } = require("ethers");

// storage for last update timestamp
let pk = process.env.PK;
const args = process.argv.slice(2);
let minfee = process.env.MINFEE;
const fs = require("fs");
const readline = require("readline");

const flags = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("-")) {
    // If the next argument starts with '-', set the current flag's value to true.
    // Otherwise, set the current flag's value to the next argument's value.
    flags[args[i]] =
      args[i + 1] && !args[i + 1].startsWith("-") ? args[i + 1] : true;
  }
}

console.log("Parsed flags:", flags);

// Access individual flags like this:
const rpcFlag = flags["-r"];
const aFlag = flags["-a"];
const pkFlag = flags["-pk"];
if (rpcFlag != null) {
  rpc = rpcFlag;
}
if (aFlag != null) {
  contractAddress = aFlag;
}
if (pkFlag != null) {
  pk = pkFlag;
}
const provider = new ethers.providers.JsonRpcProvider(rpc);

const walletWithProvider = new ethers.Wallet(pk, provider);
const oofContract =
  !!ABI && !!walletWithProvider
    ? new Contract(contractAddress, ABI, walletWithProvider)
    : undefined;

let txa = [];

function hexToUtf8(hex) {
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    const v = parseInt(hex.substr(i, 2), 16);
    if (v) str += String.fromCharCode(v);
  }
  return str;
}

async function submit(feedId, value, fl) {
  let val;
  try {
    val = "";
    if (ethers.utils.isHexString(value)) {
      val = hexToUtf8(val);
    }
  } catch {
    val = value;
    value = 88888888;
    if (ethers.utils.isHexString(val)) {
      val = hexToUtf8(val);
    }
  }
  if (txa.length === 0 || fl === 1) {
    // If not, add the new feedId and value to the queue
    txa.unshift({ feedId: feedId, value: value });
    const gasPrice = await provider.getGasPrice();
    const tx_obk = { gasPrice };
    const gasLimit = await oofContract.estimateGas.submitFeed(
      [feedId],
      [value],
      [val],
      tx_obk,
    );
    const gasFee = gasLimit.mul(gasPrice);
    let sup = await oofContract.feedSupport(feedId);
    const ethProfit = sup - gasFee;

    console.log(
      "Gas fee:",
      ethers.utils.formatEther(gasFee.toString()),
      "ETH ",
      ethers.utils.formatUnits(gasPrice, "gwei") + " gwei",
    );
    console.log("Bounty ", ethers.utils.formatEther(sup));
    console.log("ETH Profit", ethers.utils.formatEther(ethProfit.toString()));

    if (ethProfit > 0 && ethProfit >= minfee) {
      console.log(
        "submitting with gas price: " +
          ethers.utils.formatUnits(gasPrice, "gwei") +
          " gwei",
      );
      console.log("submitting feeds...");
      const tx = await oofContract.submitFeed([feedId], [value], [val], tx_obk);
      console.log(
        `submitted feed id ${feedId} with value ${value} at ${Date.now()}`,
      );
      console.log("Transaction hash: " + tx.hash);
      await tx.wait();
      console.log(`Transaction confirmed at ${Date.now()}`);

      // Remove the processed value from the queue
      txa.shift();
      // Check if there are any values left in the queue
      if (txa.length > 0) {
        // Submit the next value in the queue
        const nextVal = txa[0];
        txa.shift();

        submit(nextVal.feedId, nextVal.value, 1);
      }
    } else {
      console.log("not profitable");

      // Remove the processed value from the queue
      txa.shift();
      // Check if there are any values left in the queue
      if (txa.length > 0) {
        // Submit the next value in the queue
        const nextVal = txa[0];
        txa.shift();
        await submit(nextVal.feedId, nextVal.value, 1);
      }
    }
  } else {
    // If not, add the new feedId and value to the queue
    if (txa.some((item) => item.feedId === feedId && item.value === value)) {
      console.log(`Feed id ${feedId} with value ${value} already in queue`);
    } else {
      txa.push({ feedId: feedId, value: value });
    }
    console.log(`Added feed id ${feedId} with value ${value} to queue`);
  }
}
async function node() {
  // Get synchronous input from the user
  function getUserInput(question) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer.toString());
      });
    });
  }

  // Process saved requests
  async function processSavedRequests() {
    const requests = fs
      .readFileSync("requests.txt", "utf-8")
      .trim()
      .split("\n");
    for (const request of requests) {
      const [endpointp, feedId] = request.split(",");

      // Ask the user for the answer
      console.log(
        "skip to skip the question, delete to delete the question from the tracked requests.",
      );
      const question = `Question: ${endpointp}: `;
      const answer = await getUserInput(question);
      if (answer.toLowerCase() !== "skip") {
        // Submit the answer on-chain
        await submit(feedId, answer, 0); // Assuming the answer is a string
        const remainingRequests = requests.filter((r) => r !== request);
        fs.writeFileSync("requests.txt", remainingRequests.join("\n"));
      }
      if (answer.toLowerCase() !== "delete") {
        // Remove processed request from the file
        const remainingRequests = requests.filter((r) => r !== request);
        fs.writeFileSync("requests.txt", remainingRequests.join("\n"));
      }
    }
  }
  await processSavedRequests();
}
node();
