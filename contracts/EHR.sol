// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EHR - Electronic Health Record Smart Contract
 * @dev Blockchain-Based Healthcare Record Management System
 */
contract EHR {

    // ─── Roles ───────────────────────────────────────────────────────────────
    enum Role { None, Patient, Doctor, Admin }

    // ─── Data Structures ─────────────────────────────────────────────────────
    struct Record {
        uint256 id;
        string  recordType;   // diagnosis | prescription | lab_report
        string  ipfsHash;     // encrypted data stored on IPFS
        string  description;
        address createdBy;
        uint256 timestamp;
        bool    isActive;
    }

    struct User {
        address wallet;
        string  name;
        Role    role;
        bool    registered;
    }

    // ─── State Variables ──────────────────────────────────────────────────────
    address public owner;
    uint256 private recordCounter;

    mapping(address => User)              public users;
    mapping(address => Record[])          private patientRecords;
    mapping(address => mapping(address => bool)) public accessPermissions;
    // patient => (accessor => granted?)

    // ─── Events ───────────────────────────────────────────────────────────────
    event UserRegistered(address indexed wallet, string name, Role role);
    event RecordAdded(address indexed patient, uint256 recordId, string recordType, address createdBy);
    event AccessGranted(address indexed patient, address indexed accessor);
    event AccessRevoked(address indexed patient, address indexed accessor);
    event RecordUpdated(address indexed patient, uint256 recordId);

    // ─── Modifiers ────────────────────────────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not contract owner");
        _;
    }

    modifier onlyRegistered() {
        require(users[msg.sender].registered, "User not registered");
        _;
    }

    modifier onlyDoctor() {
        require(users[msg.sender].role == Role.Doctor, "Only doctors allowed");
        _;
    }

    modifier onlyPatient() {
        require(users[msg.sender].role == Role.Patient, "Only patients allowed");
        _;
    }

    modifier hasAccess(address patient) {
        require(
            msg.sender == patient ||
            accessPermissions[patient][msg.sender] ||
            users[msg.sender].role == Role.Admin,
            "Access denied"
        );
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        // Register deployer as Admin
        users[msg.sender] = User({
            wallet: msg.sender,
            name: "System Admin",
            role: Role.Admin,
            registered: true
        });
    }

    // ─── User Management ─────────────────────────────────────────────────────
    function registerUser(address wallet, string memory name, Role role) public onlyOwner {
        require(!users[wallet].registered, "Already registered");
        require(role == Role.Patient || role == Role.Doctor, "Invalid role");
        users[wallet] = User({ wallet: wallet, name: name, role: role, registered: true });
        emit UserRegistered(wallet, name, role);
    }

    function getUser(address wallet) public view returns (string memory name, Role role, bool registered) {
        User memory u = users[wallet];
        return (u.name, u.role, u.registered);
    }

    // ─── Record Management ────────────────────────────────────────────────────
    function addRecord(
        address patient,
        string memory recordType,
        string memory ipfsHash,
        string memory description
    ) public onlyRegistered hasAccess(patient) {
        require(
            users[msg.sender].role == Role.Doctor || msg.sender == patient,
            "Only doctor or patient can add records"
        );
        recordCounter++;
        patientRecords[patient].push(Record({
            id: recordCounter,
            recordType: recordType,
            ipfsHash: ipfsHash,
            description: description,
            createdBy: msg.sender,
            timestamp: block.timestamp,
            isActive: true
        }));
        emit RecordAdded(patient, recordCounter, recordType, msg.sender);
    }

    function getRecords(address patient)
        public
        view
        hasAccess(patient)
        returns (
            uint256[] memory ids,
            string[]  memory types,
            string[]  memory hashes,
            string[]  memory descs,
            address[] memory creators,
            uint256[] memory timestamps
        )
    {
        Record[] memory recs = patientRecords[patient];
        uint256 count = recs.length;

        ids        = new uint256[](count);
        types      = new string[](count);
        hashes     = new string[](count);
        descs      = new string[](count);
        creators   = new address[](count);
        timestamps = new uint256[](count);

        for (uint i = 0; i < count; i++) {
            ids[i]        = recs[i].id;
            types[i]      = recs[i].recordType;
            hashes[i]     = recs[i].ipfsHash;
            descs[i]      = recs[i].description;
            creators[i]   = recs[i].createdBy;
            timestamps[i] = recs[i].timestamp;
        }
    }

    function getRecordCount(address patient) public view returns (uint256) {
        return patientRecords[patient].length;
    }

    // ─── Access Control ───────────────────────────────────────────────────────
    function grantAccess(address accessor) public onlyPatient onlyRegistered {
        require(users[accessor].registered, "Accessor not registered");
        accessPermissions[msg.sender][accessor] = true;
        emit AccessGranted(msg.sender, accessor);
    }

    function revokeAccess(address accessor) public onlyPatient onlyRegistered {
        accessPermissions[msg.sender][accessor] = false;
        emit AccessRevoked(msg.sender, accessor);
    }

    function checkAccess(address patient, address accessor) public view returns (bool) {
        return accessPermissions[patient][accessor];
    }
}
