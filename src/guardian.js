const ethers = require("ethers");
require("dotenv").config();
let rpc = process.env.RPC;
let contractAddress = process.env.OOFAddress; // replace with your contract address
const ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "requestID",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "bounty",
        type: "uint256",
      },
    ],
    name: "dataCallbackRequested",
    type: "event",
  },
  {
    inputs: [
      { internalType: "string", name: "str1", type: "string" },
      { internalType: "string", name: "str2", type: "string" },
    ],
    name: "compareStrings",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "ID", type: "uint256" }],
    name: "fillRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "morpheus", type: "address[]" },
      { internalType: "uint256[]", name: "IDs", type: "uint256[]" },
      { internalType: "uint256", name: "threshold", type: "uint256" },
    ],
    name: "getFeeds",
    outputs: [
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "string", name: "valStr", type: "string" },
      { internalType: "bytes", name: "valBytes", type: "bytes" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "morpheus", type: "address[]" },
      { internalType: "uint256[]", name: "IDs", type: "uint256[]" },
      { internalType: "uint256", name: "threshold", type: "uint256" },
      { internalType: "uint256", name: "quorum", type: "uint256" },
    ],
    name: "getFeedsQuorum",
    outputs: [
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "string", name: "valStr", type: "string" },
      { internalType: "bytes", name: "valBytes", type: "bytes" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "string[]", name: "arr", type: "string[]" }],
    name: "mostUsedString",
    outputs: [
      { internalType: "string", name: "", type: "string" },
      { internalType: "uint256", name: "quorum", type: "uint256" },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "ID", type: "uint256" },
      { internalType: "uint256", name: "guardianBounty", type: "uint256" },
    ],
    name: "refillRequest",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "request",
    outputs: [
      { internalType: "address", name: "target", type: "address" },
      { internalType: "uint256", name: "bounty", type: "uint256" },
      { internalType: "uint256", name: "threshold", type: "uint256" },
      { internalType: "uint256", name: "quorum", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "morpheus", type: "address[]" },
      { internalType: "string", name: "APIendpoint", type: "string" },
      { internalType: "string", name: "APIendpointPath", type: "string" },
      { internalType: "uint256", name: "decimals", type: "uint256" },
      { internalType: "uint256[]", name: "bounties", type: "uint256[]" },
    ],
    name: "requestFeed",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "morpheus", type: "address[]" },
      { internalType: "string", name: "APIendpoint", type: "string" },
      { internalType: "string", name: "APIendpointPath", type: "string" },
      { internalType: "uint256", name: "decimals", type: "uint256" },
      { internalType: "uint256[]", name: "bounties", type: "uint256[]" },
      { internalType: "uint256", name: "threshold", type: "uint256" },
      { internalType: "uint256", name: "quorum", type: "uint256" },
      { internalType: "address", name: "receiveAddrs", type: "address" },
      { internalType: "uint256", name: "bountyGuardian", type: "uint256" },
    ],
    name: "requestFeedCallback",
    outputs: [
      { internalType: "uint256[]", name: "", type: "uint256[]" },
      { internalType: "uint256", name: "requestID", type: "uint256" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "requests",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address[]", name: "morpheus", type: "address[]" },
      { internalType: "uint256[]", name: "IDs", type: "uint256[]" },
      { internalType: "uint256[]", name: "bounties", type: "uint256[]" },
    ],
    name: "updateFeeds",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
];
const { Contract } = require("ethers");
// storage for last update timestamp
let pk = process.env.PK;
const args = process.argv.slice(2);

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

async function node() {
  console.log("Watching for requests");
  console.log("address ", contractAddress);
  const contract =
    !!ABI && !!walletWithProvider
      ? new Contract(contractAddress, ABI, walletWithProvider)
      : undefined;

  let pendingRequests = [];

  setInterval(async () => {
    console.log("Pending in que ", pendingRequests.length);
    for (let i = 0; i < pendingRequests.length; i++) {
      let request = pendingRequests[i];
      try {
        console.log(
          `Attempting request ${request.id} for bounty ${request.bounty}`,
        );
        let gasPrice = await provider.getGasPrice();
        let estimate = await contract.estimateGas.fillRequest(request.id);
        let cost = estimate.mul(gasPrice).add(100000);
        if (cost.gt(request.bounty)) {
          console.log(
            `Skipping request ${request.id} as cost ${cost} is greater than bounty ${request.bounty}`,
          );
          pendingRequests.splice(i, 1);
          i--; // adjust index after removing an item
          continue;
        }

        // I'm assuming that your contract's fillRequest method allows to set a custom gas price
        // If not, you need to modify this part
        console.log(
          `Filling request ${request.id} at cost ${cost} for bounty ${request.bounty}`,
        );
        let t = await contract.fillRequest(request.id, { gasPrice: gasPrice });
        let tx = t.wait();
        pendingRequests.splice(i, 1);
        i--; // adjust index after removing an item
        let profit = request.bounty.sub(cost);
        console.log(
          `Request ${
            request.id
          } has been filled. Profit: ${ethers.utils.formatEther(profit)} with ${
            tx.transactionHash
          }`,
        );
      } catch (error) {
        console.error(`Could not fill request ${request.id}. Waiting.`);
      }
    }
  }, 5000);

  contract.on("dataCallbackRequested", (requestID, bounty) => {
    console.log(`Received new request ${requestID} with bounty ${bounty}`);
    if (bounty.gt(0)) {
      // Only add the request to the queue if the bounty is greater than 0
      pendingRequests.push({ id: requestID, bounty: bounty });
    }
  });
}
node();
