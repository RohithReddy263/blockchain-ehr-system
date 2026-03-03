/**
 * Blockchain EHR - Backend Server
 * Node.js + Express + Web3.js
 * Interacts with Ethereum smart contract
 */

const express    = require('express');
const cors       = require('cors');
const { Web3 }   = require('web3');

const app  = express();
app.use(cors());
app.use(express.json());

// ─── Web3 Setup ──────────────────────────────────────────────────────────────
// Connect to local Hardhat / Ganache node
const web3 = new Web3('http://127.0.0.1:8545');

// ABI (generated after compiling EHR.sol)
const CONTRACT_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [{"internalType":"address","name":"patient","type":"address"},
               {"internalType":"string","name":"recordType","type":"string"},
               {"internalType":"string","name":"ipfsHash","type":"string"},
               {"internalType":"string","name":"description","type":"string"}],
    "name": "addRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"address","name":"accessor","type":"address"}],
    "name": "grantAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"address","name":"accessor","type":"address"}],
    "name": "revokeAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"address","name":"patient","type":"address"}],
    "name": "getRecords",
    "outputs": [
      {"internalType":"uint256[]","name":"ids","type":"uint256[]"},
      {"internalType":"string[]","name":"types","type":"string[]"},
      {"internalType":"string[]","name":"hashes","type":"string[]"},
      {"internalType":"string[]","name":"descs","type":"string[]"},
      {"internalType":"address[]","name":"creators","type":"address[]"},
      {"internalType":"uint256[]","name":"timestamps","type":"uint256[]"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"address","name":"patient","type":"address"}],
    "name": "getRecordCount",
    "outputs": [{"internalType":"uint256","name":"","type":"uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"address","name":"wallet","type":"address"},
               {"internalType":"string","name":"name","type":"string"},
               {"internalType":"uint8","name":"role","type":"uint8"}],
    "name": "registerUser",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"address","name":"wallet","type":"address"}],
    "name": "getUser",
    "outputs": [
      {"internalType":"string","name":"name","type":"string"},
      {"internalType":"uint8","name":"role","type":"uint8"},
      {"internalType":"bool","name":"registered","type":"bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType":"address","name":"patient","type":"address"},
               {"internalType":"address","name":"accessor","type":"address"}],
    "name": "checkAccess",
    "outputs": [{"internalType":"bool","name":"","type":"bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Set this after deployment
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
let contract;
let accounts;

// ─── Initialization ──────────────────────────────────────────────────────────
async function init() {
  try {
    accounts = await web3.eth.getAccounts();
    if (CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      console.log('✅ Connected to contract:', CONTRACT_ADDRESS);
    }
    console.log('✅ Web3 connected | Accounts available:', accounts.length);
  } catch (e) {
    console.error('❌ Web3 init error:', e.message);
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const blockNumber = await web3.eth.getBlockNumber();
    res.json({ status: 'ok', blockNumber: blockNumber.toString(), contractAddress: CONTRACT_ADDRESS, accounts });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── User Routes ──────────────────────────────────────────────────────────────
// Register a new user (Admin only - uses account[0] as admin)
app.post('/api/users/register', async (req, res) => {
  try {
    const { wallet, name, role } = req.body;
    // Role: 1=Patient, 2=Doctor
    const roleNum = role === 'doctor' ? 2 : 1;
    await contract.methods.registerUser(wallet, name, roleNum)
      .send({ from: accounts[0], gas: 300000 });
    res.json({ success: true, message: `${name} registered as ${role}` });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get user info
app.get('/api/users/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;
    const result = await contract.methods.getUser(wallet).call();
    const roleMap = { '0': 'none', '1': 'patient', '2': 'doctor', '3': 'admin' };
    res.json({
      name: result[0] || result.name,
      role: roleMap[String(result[1] !== undefined ? result[1] : result.role)],
      registered: result[2] !== undefined ? result[2] : result.registered
    });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ─── Record Routes ────────────────────────────────────────────────────────────
// Add a record
app.post('/api/records', async (req, res) => {
  try {
    const { patientAddress, callerAddress, recordType, ipfsHash, description } = req.body;
    await contract.methods.addRecord(patientAddress, recordType, ipfsHash, description)
      .send({ from: callerAddress, gas: 500000 });
    res.json({ success: true, message: 'Record added to blockchain' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Get records for a patient
app.get('/api/records/:patient', async (req, res) => {
  try {
    const { patient } = req.params;
    const caller = req.query.caller || patient;
    const result = await contract.methods.getRecords(patient).call({ from: caller });

    const ids        = result[0] || result.ids;
    const types      = result[1] || result.types;
    const hashes     = result[2] || result.hashes;
    const descs      = result[3] || result.descs;
    const creators   = result[4] || result.creators;
    const timestamps = result[5] || result.timestamps;

    const records = ids.map((id, i) => ({
      id: id.toString(),
      recordType: types[i],
      ipfsHash: hashes[i],
      description: descs[i],
      createdBy: creators[i],
      timestamp: new Date(Number(timestamps[i]) * 1000).toISOString()
    }));

    res.json({ records });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ─── Access Control Routes ────────────────────────────────────────────────────
// Grant access
app.post('/api/access/grant', async (req, res) => {
  try {
    const { patientAddress, accessorAddress } = req.body;
    await contract.methods.grantAccess(accessorAddress)
      .send({ from: patientAddress, gas: 200000 });
    res.json({ success: true, message: 'Access granted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Revoke access
app.post('/api/access/revoke', async (req, res) => {
  try {
    const { patientAddress, accessorAddress } = req.body;
    await contract.methods.revokeAccess(accessorAddress)
      .send({ from: patientAddress, gas: 200000 });
    res.json({ success: true, message: 'Access revoked' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Check access
app.get('/api/access/check', async (req, res) => {
  try {
    const { patient, accessor } = req.query;
    const hasAccess = await contract.methods.checkAccess(patient, accessor).call();
    res.json({ hasAccess });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ─── Blockchain Info ─────────────────────────────────────────────────────────
app.get('/api/blockchain/accounts', async (req, res) => {
  try {
    const accs = await web3.eth.getAccounts();
    const balances = await Promise.all(accs.map(async a => {
      const bal = await web3.eth.getBalance(a);
      return { address: a, balance: web3.utils.fromWei(bal, 'ether') + ' ETH' };
    }));
    res.json({ accounts: balances });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  await init();
  console.log(`\n🏥 Blockchain EHR Backend running on http://localhost:${PORT}`);
  console.log(`📋 API Endpoints:`);
  console.log(`   GET  /api/health`);
  console.log(`   GET  /api/blockchain/accounts`);
  console.log(`   POST /api/users/register`);
  console.log(`   GET  /api/users/:wallet`);
  console.log(`   POST /api/records`);
  console.log(`   GET  /api/records/:patient`);
  console.log(`   POST /api/access/grant`);
  console.log(`   POST /api/access/revoke`);
  console.log(`   GET  /api/access/check`);
});
