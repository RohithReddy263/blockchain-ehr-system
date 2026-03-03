const hre = require("hardhat");
const fs  = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying EHR Smart Contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from account:", deployer.address);

  const EHR = await hre.ethers.getContractFactory("EHR");
  const ehr  = await EHR.deploy();
  await ehr.waitForDeployment();

  const address = await ehr.getAddress();
  console.log("✅ EHR Contract deployed to:", address);

  // Save address to .env for backend
  const envPath = path.join(__dirname, "../backend/.env");
  fs.writeFileSync(envPath, `CONTRACT_ADDRESS=${address}\n`);
  console.log("📝 Contract address saved to backend/.env");

  // Save address to frontend env
  const feEnvPath = path.join(__dirname, "../frontend/.env");
  fs.writeFileSync(feEnvPath, `REACT_APP_CONTRACT_ADDRESS=${address}\nREACT_APP_API_URL=http://localhost:3001\n`);
  console.log("📝 Contract address saved to frontend/.env");

  // Register demo users using the first 3 Hardhat accounts
  const signers = await hre.ethers.getSigners();
  const accounts = signers.map(s => s.address);

  console.log("\n🔧 Seeding demo data...");

  // Register a patient (account[1]) and two doctors (account[2], account[3])
  await ehr.registerUser(accounts[1], "Alice Johnson (Patient)", 1);
  console.log("  ✅ Patient registered:", accounts[1]);

  await ehr.registerUser(accounts[2], "Dr. Sharma", 2);
  console.log("  ✅ Doctor registered:", accounts[2]);

  await ehr.registerUser(accounts[3], "Dr. Patel", 2);
  console.log("  ✅ Doctor registered:", accounts[3]);

  // Grant Dr. Sharma access to Alice's records
  const patientSigner = signers[1];
  const ehrAsPatient = ehr.connect(patientSigner);
  await ehrAsPatient.grantAccess(accounts[2]);
  console.log("  ✅ Access granted to Dr. Sharma");

  // Add a sample record
  const doctorSigner = signers[2];
  const ehrAsDoctor = ehr.connect(doctorSigner);
  await ehrAsDoctor.addRecord(accounts[1], "diagnosis", "QmSampleHash1", "Hypertension - Stage 1. BP 140/90. Prescribed Amlodipine 5mg.");
  await ehrAsDoctor.addRecord(accounts[1], "prescription", "QmSampleHash2", "Amlodipine 5mg - Once daily for 30 days.");
  await ehrAsDoctor.addRecord(accounts[1], "lab_report", "QmSampleHash3", "CBC Normal. Cholesterol slightly elevated at 215 mg/dL.");
  console.log("  ✅ 3 sample records added for Alice");

  console.log("\n🎉 Deployment complete!");
  console.log("─────────────────────────────────────────────");
  console.log("Contract Address :", address);
  console.log("Admin (deployer) :", accounts[0]);
  console.log("Patient          :", accounts[1], " → Alice Johnson");
  console.log("Doctor 1         :", accounts[2], " → Dr. Sharma");
  console.log("Doctor 2         :", accounts[3], " → Dr. Patel");
  console.log("─────────────────────────────────────────────");
}

main()
  .then(() => process.exit(0))
  .catch(err => { console.error(err); process.exit(1); });
