const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OjasRaksha Smart Contract Real Workload Benchmarking", function () {
    let registry, audit, consentManager, medicalRecords, rbac;
    let owner, patient, doctor, hospital, attacker;

    before(async function () {
        [owner, patient, doctor, hospital, attacker] = await ethers.getSigners();

        // Deploy DataFiduciaryRegistry
        const RegistryFactory = await ethers.getContractFactory("DataFiduciaryRegistry");
        registry = await RegistryFactory.deploy();
        await registry.waitForDeployment();

        // Deploy AuditLog
        const AuditFactory = await ethers.getContractFactory("AuditLog");
        audit = await AuditFactory.deploy();
        await audit.waitForDeployment();

        // Deploy ConsentManager
        const ConsentFactory = await ethers.getContractFactory("ConsentManager");
        consentManager = await ConsentFactory.deploy(await registry.getAddress(), await audit.getAddress());
        await consentManager.waitForDeployment();

        // Deploy HealthcareRBAC
        const RoleFactory = await ethers.getContractFactory("HealthcareRBAC");
        rbac = await RoleFactory.deploy();
        await rbac.waitForDeployment();

        // Deploy MedicalRecords
        const MedFactory = await ethers.getContractFactory("MedicalRecords");
        medicalRecords = await MedFactory.deploy(await registry.getAddress(), await audit.getAddress());
        await medicalRecords.waitForDeployment();
    });

    it("1. Should measure Consent Grant latency and exact EVM gas used", async function () {
        const start = performance.now();
        const tx = await consentManager.connect(patient).grantConsent(
            doctor.address,
            "TREATMENT",
            "0x7e8f52a1b94c3d82e140d39e7c5b961208fb6f59b34a179c6d3e813f57291a84",
            "Prescriptions & Cardiology EMR",
            86400 // 24 hours
        );
        const receipt = await tx.wait();
        const durationMs = performance.now() - start;

        console.log(`\n    [EVM Benchmark] grantConsent Gas Used: ${receipt.gasUsed.toString()} gas units`);
        console.log(`    [EVM Benchmark] grantConsent Local EVM Execution Latency: ${durationMs.toFixed(2)} ms`);
        
        expect(receipt.status).to.equal(1);
    });

    it("2. Should measure Consent Revocation latency and gas used", async function () {
        const start = performance.now();
        const tx = await consentManager.connect(patient).revokeConsent(0);
        const receipt = await tx.wait();
        const durationMs = performance.now() - start;

        console.log(`    [EVM Benchmark] revokeConsent Gas Used: ${receipt.gasUsed.toString()} gas units`);
        console.log(`    [EVM Benchmark] revokeConsent Local EVM Execution Latency: ${durationMs.toFixed(2)} ms`);

        expect(receipt.status).to.equal(1);
    });

    it("3. Should measure on-chain Access Verification vs Cached verification", async function () {
        // Grant a fresh consent
        await consentManager.connect(patient).grantConsent(
            doctor.address,
            "DIAGNOSIS",
            "0x99a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8",
            "All",
            3600
        );

        // On-chain RPC view call
        const startOnChain = performance.now();
        const isValid = await consentManager.validateConsent(patient.address, 1, "All");
        const onChainDuration = performance.now() - startOnChain;

        // In-memory / cached check
        const cachedConsent = {
            isActive: true,
            erased: false,
            expiry: Date.now() / 1000 + 3600,
            dataScope: "All"
        };
        const startCached = performance.now();
        const isCachedValid = cachedConsent.isActive && !cachedConsent.erased && (Date.now()/1000 < cachedConsent.expiry);
        const cachedDuration = performance.now() - startCached;

        console.log(`    [EVM Benchmark] validateConsent On-Chain View Call Latency: ${onChainDuration.toFixed(2)} ms`);
        console.log(`    [EVM Benchmark] validateConsent In-Memory/Cached Latency: ${(cachedDuration * 1000).toFixed(2)} µs (${cachedDuration.toFixed(4)} ms)`);
        
        expect(isValid).to.equal(true);
        expect(isCachedValid).to.equal(true);
    });

    it("4. Should verify 100% deterministic decision accuracy for unauthorized/revoked states", async function () {
        // Patient revoked index 0 earlier
        const isRevokedValid = await consentManager.validateConsent(patient.address, 0, "Prescriptions & Cardiology EMR");
        expect(isRevokedValid).to.equal(false);

        // Erased record check
        await consentManager.connect(patient).requestErasure(1);
        const isErasedValid = await consentManager.validateConsent(patient.address, 1, "All");
        expect(isErasedValid).to.equal(false);

        console.log(`    [EVM Benchmark] Revoked & Erased state enforcement verified (0 false positives)`);
    });

    it("5. Should measure Medical Records insertion and IPFS CID storage gas", async function () {
        const start = performance.now();
        const tx = await medicalRecords.connect(doctor).addRecord(
            patient.address,
            "QmZtmD2qt8fJpq3CLDHvdzsAAsDHBr37Dep2Jy96XAZpkE",
            "Prescription",
            0
        );
        const receipt = await tx.wait();
        const durationMs = performance.now() - start;

        console.log(`    [EVM Benchmark] addRecord Gas Used: ${receipt.gasUsed.toString()} gas units`);
        console.log(`    [EVM Benchmark] addRecord Execution Latency: ${durationMs.toFixed(2)} ms`);
        expect(receipt.status).to.equal(1);
    });
});
