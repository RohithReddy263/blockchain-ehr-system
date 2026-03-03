# 🏥 Blockchain-Based EHR System
**Final Review Demo — G. Rohith Reddy, D. Abinay, Akash Rudraraju, G. Karthik, P. Hari Haran**
*Supervised by Dr. Roopa*

---

## 📁 Project Structure

```
blockchain-ehr/
├── contracts/
│   └── EHR.sol              ← Solidity Smart Contract
├── scripts/
│   └── deploy.js            ← Deployment + Demo Data Seeding
├── backend/
│   ├── server.js            ← Express REST API (Node.js + Web3)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ← Full React Dashboard
│   │   └── index.js
│   ├── public/index.html
│   └── package.json
├── hardhat.config.js        ← Blockchain Config
└── package.json
```

---

## 🛠 Prerequisites

Install these before starting:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v18+ | https://nodejs.org |
| npm | v9+ | Comes with Node |
| Git | Any | https://git-scm.com |

---

## 🚀 How to Run (Step-by-Step)

> Open **4 terminal windows** and run each step in order.

---

### TERMINAL 1 — Install Dependencies

```bash
cd blockchain-ehr
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

### TERMINAL 1 — Start Hardhat Local Blockchain

```bash
cd blockchain-ehr
npx hardhat node
```

✅ You will see **20 accounts** with 10,000 ETH each printed out.
✅ Blockchain is running at `http://127.0.0.1:8545`

> **Keep this terminal running.**

---

### TERMINAL 2 — Deploy Smart Contract

```bash
cd blockchain-ehr
npx hardhat run scripts/deploy.js --network localhost
```

✅ Output will show:
```
✅ EHR Contract deployed to: 0xABC...
✅ Patient registered: 0x...
✅ Doctor registered: 0x...
✅ 3 sample records added for Alice
```

✅ Contract address is automatically saved to `backend/.env`

---

### TERMINAL 3 — Start Backend API

```bash
cd blockchain-ehr/backend
npm start
```

✅ Server runs at `http://localhost:3001`

Test it:
```bash
curl http://localhost:3001/api/health
```

---

### TERMINAL 4 — Start React Frontend

```bash
cd blockchain-ehr/frontend
npm start
```

✅ Browser opens at `http://localhost:3000`

---

## 🎬 Demo Walkthrough for Final Review

### 1. Dashboard Tab
- Shows contract address, block number, and all 20 Hardhat accounts with ETH balances
- Explains the 4-layer architecture

### 2. Register Tab
- Use **accounts[0]** (Admin) to register new users
- Copy addresses from Terminal 1 output

### 3. Records Tab — View Pre-seeded Data
Paste **accounts[1]** as both Patient and Caller to see Alice's 3 pre-loaded records:
- `diagnosis` — Hypertension details
- `prescription` — Amlodipine 5mg
- `lab_report` — CBC results

### 4. Records Tab — Add a New Record
- Patient: accounts[1]
- Caller (Doctor): accounts[2]
- Add a new diagnosis and click "Add to Blockchain"
- Fetch records again → New record appears instantly

### 5. Access Control Tab
**Demo revoke + try access:**
1. Patient = accounts[1], Accessor = accounts[2] → Check → GRANTED
2. Click Revoke Access
3. Check again → DENIED
4. Go to Records, fetch as accounts[2] → should return Access Denied error
5. Grant access back to demonstrate patient control

---

## 🔑 Key Technical Points to Mention

| Feature | Implementation |
|---------|---------------|
| Immutability | Records written to Ethereum blockchain — cannot be modified |
| Access Control | `mapping(address => mapping(address => bool))` in smart contract |
| Smart Contracts | Solidity `EHR.sol` — handles all permissions automatically |
| Patient Ownership | Only patients call `grantAccess` / `revokeAccess` |
| Audit Trail | All transactions emit events logged on-chain |
| Permissioned Blockchain | Local private Ethereum network (Hardhat) |
| Data Privacy | IPFS hash stored on-chain; actual data stays off-chain (encrypted) |
| Role-based Access | Enum Roles: Admin, Doctor, Patient enforced by modifiers |

---

## 🌐 API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Connection + block info |
| GET | `/api/blockchain/accounts` | All accounts + balances |
| POST | `/api/users/register` | Register patient/doctor |
| GET | `/api/users/:wallet` | Get user info |
| POST | `/api/records` | Add medical record |
| GET | `/api/records/:patient` | View patient records |
| POST | `/api/access/grant` | Patient grants access |
| POST | `/api/access/revoke` | Patient revokes access |
| GET | `/api/access/check` | Check access status |

---

## ⚠️ Troubleshooting

**"Cannot connect to network"**
→ Make sure Terminal 1 (hardhat node) is running first

**"Contract address is 0x000..."**
→ Run deploy script (Terminal 2) after starting hardhat node

**"Access denied" error in records**
→ Use the Access Control tab to grant access first

**Port 3001 in use**
→ `kill $(lsof -ti:3001)` then restart backend

**npm install fails**
→ Use Node.js 18+: `node --version` to check

---

## 📊 Technologies Used

- **Blockchain**: Ethereum (Hardhat local network)
- **Smart Contract**: Solidity 0.8.19
- **Backend**: Node.js, Express.js, Web3.js v4
- **Frontend**: React 18, plain CSS-in-JS
- **Data Storage**: IPFS hash references on-chain
- **Testing Network**: Hardhat (simulates Ethereum locally)
