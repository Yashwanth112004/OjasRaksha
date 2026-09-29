const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log("================================================================================");
console.log("OJASRAKSHA MULTI-HOSPITAL SYNTHETIC DATASET GENERATOR (3,000 CLINICAL ROWS)");
console.log("================================================================================\n");

// 1. HOSPITAL SPECIFICATIONS & ORGANIZATION-SPECIFIC RULES
const HOSPITALS = [
    {
        id: "HOSP-001",
        name: "Apollo Multispecialty Hospital",
        type: "Tertiary Multi-Specialty",
        walletAddress: "0x155Af6ECaFb48861dA7d16Fb8Af2f6ce9d6DD779",
        specialties: ["Cardiology", "Infectious Disease", "Gastroenterology", "General Medicine"],
        doctors: [
            { name: "Dr. Sarah Jenkins", wallet: "0x04Fee3FD1B338d12FFD6dBD8d66dE1e8e0BB99cB", role: "Chief Cardiologist", regNo: "NMC-48192" },
            { name: "Dr. Rajesh Sharma", wallet: "0x3c44CdDdB6a900fa2b585dd299e03d12FA4293BC", role: "Senior Gastroenterologist", regNo: "NMC-78491" },
            { name: "Dr. Maya Swaminathan", wallet: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", role: "Infectious Disease Specialist", regNo: "NMC-33109" }
        ],
        rules: {
            consentDurationDays: 365,
            dpdpTier: "Standard Sovereign Tier-1",
            breakGlassAllowed: true,
            breakGlassConditions: ["CRITICAL", "EMERGENCY"],
            mpcThreshold: "2-of-3 Web3Auth Enclave",
            encryptionCipher: "AES-256-GCM",
            dataRetentionYears: 7,
            merkleBatchSize: 50,
            telecomMasking: "Partial (Last 4 digits visible)",
            requireInsurancePreAuth: true
        }
    },
    {
        id: "HOSP-002",
        name: "Max Super Speciality Cancer Institute",
        type: "Comprehensive Oncology Care",
        walletAddress: "0x28B7eA94B34C8F52D19E50Eb14769Da20F5D54b4",
        specialties: ["Oncology", "Hematology & Immunology", "Biochemical Genetics"],
        doctors: [
            { name: "Dr. Vikram Seth", wallet: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", role: "Surgical Oncologist", regNo: "NMC-99014" },
            { name: "Dr. Ananya Roy", wallet: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", role: "Clinical Hematologist", regNo: "NMC-51203" }
        ],
        rules: {
            consentDurationDays: 180, // Stricter consent renewal for oncology
            dpdpTier: "Sensitive Biomarker / Genomic Tier",
            breakGlassAllowed: false, // Break glass restricted on genetic markers without ethics board signoff
            breakGlassConditions: ["BOARD_OVERRIDE_ONLY"],
            mpcThreshold: "3-of-3 MPC Full Strict",
            encryptionCipher: "AES-256-GCM",
            dataRetentionYears: 15,
            merkleBatchSize: 25,
            telecomMasking: "Full Cryptographic Anonymization",
            requireInsurancePreAuth: true
        }
    },
    {
        id: "HOSP-003",
        name: "Fortis Memorial Neuro & Trauma Center",
        type: "Level-1 Emergency & Neurological Institute",
        walletAddress: "0x84f93618C1D541bB1Dcf1373A8eE500A7D439634",
        specialties: ["Neurology", "Trauma & Emergency", "Cardiology"],
        doctors: [
            { name: "Dr. Rohan Patel", wallet: "0x976EA74026E726554dB657fA54763abd0C3a0aa9", role: "Neurosurgeon", regNo: "NMC-11029" },
            { name: "Dr. Katherine Price", wallet: "0x14dC79964da2C08b23698B3D3cc7Ca32193d9955", role: "Emergency Trauma Director", regNo: "NMC-60231" }
        ],
        rules: {
            consentDurationDays: 90,
            dpdpTier: "Emergency Rapid Fast-Track",
            breakGlassAllowed: true,
            breakGlassConditions: ["CRITICAL", "EMERGENCY", "TRAUMA", "UNCONSCIOUS_PATIENT"],
            breakGlassSessionExpiryMinutes: 60,
            mpcThreshold: "2-of-3 Ephemeral Enclave",
            encryptionCipher: "AES-256-GCM",
            dataRetentionYears: 10,
            merkleBatchSize: 50,
            telecomMasking: "Emergency Unmasking Authorized",
            requireInsurancePreAuth: false // Emergency treatments bypass prior auth
        }
    },
    {
        id: "HOSP-004",
        name: "Care & Cure Pediatric & Maternity Hospital",
        type: "Mother & Child Specialized Center",
        walletAddress: "0x937F51E09477BfD31E56c5e533038a8eEAc096b7",
        specialties: ["Pediatrics", "Obstetrics & Gynecology", "Genetics & Congenital", "Neonatology"],
        doctors: [
            { name: "Dr. Preeti Deshmukh", wallet: "0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f", role: "Lead Obstetrician", regNo: "NMC-82194" },
            { name: "Dr. Amitav Ghosh", wallet: "0xa0Ee7A142d267C1f36714E4a8F75612F20a79720", role: "Chief Pediatrician", regNo: "NMC-45129" }
        ],
        rules: {
            consentDurationDays: 365,
            dpdpTier: "DPDP Section 9 Child Data Protection",
            breakGlassAllowed: true,
            breakGlassConditions: ["NEONATAL_CRITICAL", "OBSTETRIC_EMERGENCY"],
            guardianConsentRequired: true,
            mpcThreshold: "2-of-3 Guardian & Hospital Key Vault",
            encryptionCipher: "AES-256-GCM",
            dataRetentionYears: 21, // Retained until child reaches age of majority + statutory period
            merkleBatchSize: 50,
            telecomMasking: "Guardian Telecom Linked",
            requireInsurancePreAuth: false
        }
    },
    {
        id: "HOSP-005",
        name: "Apex Diagnostic & Pathology Reference Labs",
        type: "Centralized Diagnostic Reference Hub",
        walletAddress: "0x04Fee3FD1B338d12FFD6dBD8d66dE1e8e0BB99cB",
        specialties: ["Endocrinology", "Clinical Symptoms & Diagnostics", "Infectious Disease", "Hematology & Immunology"],
        doctors: [
            { name: "Dr. Sunita Narang", wallet: "0xBcd4042DE499D14e55001CcbB24a551F3b954096", role: "Laboratory Director", regNo: "NMC-90812" },
            { name: "Dr. Farhan Qureshi", wallet: "0x71bE63f3384f5fb98995898A86B02Fb2426c5788", role: "Molecular Pathologist", regNo: "NMC-38102" }
        ],
        rules: {
            consentDurationDays: 30, // Diagnostic reports have short 30-day sharing windows by default
            dpdpTier: "Diagnostic Telemetry Tier",
            breakGlassAllowed: false,
            breakGlassConditions: ["NONE"],
            mpcThreshold: "2-of-3 Node Share Enclave",
            encryptionCipher: "AES-256-GCM",
            dataRetentionYears: 5,
            merkleBatchSize: 100,
            telecomMasking: "Full Masking",
            requireInsurancePreAuth: true
        }
    }
];

// 2. ICD-10 CLINICAL CODE CATALOG BY SPECIALTY
const CLINICAL_DIAGNOSES = [
    // Cardiology
    { code: 'I10', title: 'Essential (primary) hypertension', category: 'Cardiology', severity: 'Moderate', chapter: 'Chapter 9 (I00-I99)', billable: true, defaultMeds: [{ name: 'Amlodipine', dose: '5mg QD' }, { name: 'Telmisartan', dose: '40mg QD' }], defaultLabs: ['Lipid Profile', 'Serum Creatinine', '12-Lead ECG'] },
    { code: 'I20.9', title: 'Angina pectoris, unspecified', category: 'Cardiology', severity: 'Critical', chapter: 'Chapter 9 (I00-I99)', billable: true, defaultMeds: [{ name: 'Nitroglycerin', dose: '0.4mg Sublingual' }, { name: 'Aspirin', dose: '75mg QD' }, { name: 'Atorvastatin', dose: '40mg QHS' }], defaultLabs: ['High-Sensitivity Troponin-I', 'Coronary Angiogram', '2D Echo'] },
    { code: 'I21.9', title: 'Acute myocardial infarction, unspecified', category: 'Cardiology', severity: 'Emergency', chapter: 'Chapter 9 (I00-I99)', billable: true, defaultMeds: [{ name: 'Ticagrelor', dose: '90mg BID' }, { name: 'Aspirin', dose: '325mg stat' }, { name: 'Unfractionated Heparin', dose: 'IV Bolus' }], defaultLabs: ['Troponin-T Serial', 'CK-MB', 'Emergency Coronary Angiography'] },
    { code: 'I50.9', title: 'Heart failure, unspecified', category: 'Cardiology', severity: 'High', chapter: 'Chapter 9 (I00-I99)', billable: true, defaultMeds: [{ name: 'Furosemide', dose: '40mg QD' }, { name: 'Sacubitril/Valsartan', dose: '49/51mg BID' }], defaultLabs: ['NT-proBNP', 'Echocardiogram (EF%)', 'Serum Electrolytes'] },

    // Oncology
    { code: 'C34.90', title: 'Malignant neoplasm of unspecified bronchus or lung', category: 'Oncology', severity: 'Critical', chapter: 'Chapter 2 (C00-D49)', billable: true, defaultMeds: [{ name: 'Cisplatin', dose: '75mg/m2 IV' }, { name: 'Pembrolizumab', dose: '200mg IV Q3W' }], defaultLabs: ['Chest CT Scan', 'PD-L1 Expression Assay', 'EGFR Mutation Panel'] },
    { code: 'C50.919', title: 'Malignant neoplasm of unspecified female breast', category: 'Oncology', severity: 'Critical', chapter: 'Chapter 2 (C00-D49)', billable: true, defaultMeds: [{ name: 'Tamoxifen', dose: '20mg QD' }, { name: 'Trastuzumab', dose: '6mg/kg IV' }], defaultLabs: ['ER/PR/HER2 Histopathology', 'Mammography', 'BRCA1/2 Panel'] },
    { code: 'C61', title: 'Malignant neoplasm of prostate', category: 'Oncology', severity: 'Critical', chapter: 'Chapter 2 (C00-D49)', billable: true, defaultMeds: [{ name: 'Leuprolide Acetate', dose: '22.5mg Depot 3-mo' }, { name: 'Enzalutamide', dose: '160mg QD' }], defaultLabs: ['Total PSA', 'Free PSA', 'Prostate Multiparametric MRI'] },

    // Neurology & Trauma
    { code: 'G43.909', title: 'Migraine, unspecified, not intractable', category: 'Neurology', severity: 'Moderate', chapter: 'Chapter 6 (G00-G99)', billable: true, defaultMeds: [{ name: 'Sumatriptan', dose: '50mg PRN' }, { name: 'Propranolol', dose: '40mg BID' }], defaultLabs: ['Brain MRI', 'Fundoscopy Exam'] },
    { code: 'G40.909', title: 'Epilepsy, unspecified, without status epilepticus', category: 'Neurology', severity: 'High', chapter: 'Chapter 6 (G00-G99)', billable: true, defaultMeds: [{ name: 'Levetiracetam', dose: '500mg BID' }, { name: 'Valproate Sodium', dose: '500mg BID' }], defaultLabs: ['Electroencephalogram (EEG)', 'Brain MRI Epilepsy Protocol', 'Serum Drug Level'] },
    { code: 'S06.9X0A', title: 'Unspecified intracranial injury without loss of consciousness', category: 'Trauma & Emergency', severity: 'Emergency', chapter: 'Chapter 19 (S00-T88)', billable: true, defaultMeds: [{ name: 'Mannitol 20%', dose: '100mL IV' }, { name: 'Phenytoin', dose: '100mg IV' }], defaultLabs: ['Non-Contrast Brain CT', 'C-Spine X-Ray', 'Glasgow Coma Scale'] },

    // Endocrinology & Metabolism
    { code: 'E11.9', title: 'Type 2 diabetes mellitus without complications', category: 'Endocrinology', severity: 'Moderate', chapter: 'Chapter 4 (E00-E89)', billable: true, defaultMeds: [{ name: 'Metformin', dose: '500mg BID with meals' }, { name: 'Dapagliflozin', dose: '10mg QD' }], defaultLabs: ['HbA1c', 'Fasting Blood Glucose', 'Lipid Panel', 'Urine Microalbumin'] },
    { code: 'E11.65', title: 'Type 2 diabetes mellitus with hyperglycemia', category: 'Endocrinology', severity: 'High', chapter: 'Chapter 4 (E00-E89)', billable: true, defaultMeds: [{ name: 'Insulin Glargine', dose: '14 Units QHS' }, { name: 'Metformin XR', dose: '1000mg QD' }], defaultLabs: ['Postprandial Glucose', 'Serum Ketones', 'HbA1c', 'Electrolytes'] },
    { code: 'E03.9', title: 'Hypothyroidism, unspecified', category: 'Endocrinology', severity: 'Low', chapter: 'Chapter 4 (E00-E89)', billable: true, defaultMeds: [{ name: 'Levothyroxine Sodium', dose: '50mcg QD Empty Stomach' }], defaultLabs: ['TSH', 'Free T4', 'Anti-TPO Antibodies'] },

    // Pediatrics & Obstetrics
    { code: 'O80', title: 'Encounter for full-term uncomplicated delivery', category: 'Obstetrics & Gynecology', severity: 'Low', chapter: 'Chapter 15 (O00-O9A)', billable: true, defaultMeds: [{ name: 'Oxytocin', dose: '10 IU IM' }, { name: 'Iron & Folic Acid', dose: '1 tab QD' }], defaultLabs: ['Hemoglobin / Hematocrit', 'Blood Group & Rh Typing', 'Partograph'] },
    { code: 'J06.9', title: 'Acute upper respiratory infection, unspecified', category: 'Pediatrics', severity: 'Low', chapter: 'Chapter 10 (J00-J99)', billable: true, defaultMeds: [{ name: 'Paracetamol Syrup', dose: '120mg/5mL PRN' }, { name: 'Saline Nasal Drops', dose: '2 drops BID' }], defaultLabs: ['Throat Swab PCR', 'Complete Blood Count (CBC)'] },
    { code: 'P59.9', title: 'Neonatal jaundice, unspecified', category: 'Neonatology', severity: 'Moderate', chapter: 'Chapter 16 (P00-P96)', billable: true, defaultMeds: [{ name: 'Phototherapy Protocol', dose: 'Continuous Blue Light' }], defaultLabs: ['Total Serum Bilirubin (TSB)', 'Direct Bilirubin', 'Coombs Test'] },

    // Infectious Disease & Gastro
    { code: 'A90', title: 'Dengue fever [classical dengue]', category: 'Infectious Disease', severity: 'High', chapter: 'Chapter 1 (A00-B99)', billable: true, defaultMeds: [{ name: 'Oral Rehydration Salts', dose: '1 Liter/day' }, { name: 'Paracetamol', dose: '650mg SOS' }], defaultLabs: ['Dengue NS1 Antigen', 'Platelet Count Monitoring', 'Hematocrit'] },
    { code: 'K21.9', title: 'Gastro-esophageal reflux disease without esophagitis', category: 'Gastroenterology', severity: 'Low', chapter: 'Chapter 11 (K00-K95)', billable: true, defaultMeds: [{ name: 'Pantoprazole', dose: '40mg QD morning' }, { name: 'Domperidone', dose: '10mg TDS' }], defaultLabs: ['Upper GI Endoscopy', 'Helicobacter Pylori Stool Antigen'] }
];

// 3. GENERATION ENGINE (3,000 ROWS)
function generateDataset(totalRows = 3000) {
    const dataset = [];
    const baseTimestamp = 1789300000000; // Sept 2026 epoch ms
    let currentHcsSeq = 1000;
    let prevRunningHash = "0x7e8f52a1b94c3d82e140d39e7c5b961208fb6f59b34a179c6d3e813f57291a84";

    const RECORD_TYPES = ["Prescription", "DiagnosticLabReport", "ClinicalEncounter", "EmergencyBreakGlassAccess", "InsuranceClaimReceipt"];

    for (let i = 1; i <= totalRows; i++) {
        // Distribute hospital proportionally
        const hospital = HOSPITALS[i % HOSPITALS.length];
        
        // Pick doctor matching hospital
        const doctor = hospital.doctors[i % hospital.doctors.length];

        // Filter diagnoses matching hospital specialties
        const eligibleDiagnoses = CLINICAL_DIAGNOSES.filter(d => 
            hospital.specialties.includes(d.category) || hospital.specialties.includes("General Medicine")
        );
        const diag = eligibleDiagnoses.length > 0 ? eligibleDiagnoses[i % eligibleDiagnoses.length] : CLINICAL_DIAGNOSES[i % CLINICAL_DIAGNOSES.length];

        // Patient demographics
        const patientNumber = 1000 + (i % 600); // 600 unique patients across 3,000 encounters
        const patientId = `PAT-${patientNumber}`;
        const patientShortId = `${patientNumber}`;
        const patientWallet = `0x${crypto.createHash('sha256').update(`PATIENT_${patientId}`).digest('hex').substring(0, 40)}`;
        const patientAge = hospital.id === "HOSP-004" ? (i % 2 === 0 ? Math.floor(i % 12) : 26 + (i % 12)) : 22 + (i % 65);
        const patientGender = (hospital.id === "HOSP-004" && patientAge > 18) ? "female" : (i % 2 === 0 ? "male" : "female");

        // Record type distribution
        let recordType = RECORD_TYPES[i % RECORD_TYPES.length];
        const isEmergencyCode = diag.severity === "Emergency" || diag.severity === "Critical";
        if (hospital.id === "HOSP-003" && isEmergencyCode && i % 4 === 0) {
            recordType = "EmergencyBreakGlassAccess";
        }

        // Generate synthetic cryptographic parameters (AES-256-GCM)
        const iv = crypto.randomBytes(12).toString('hex'); // 96-bit IV
        const authTag = crypto.randomBytes(16).toString('hex'); // 128-bit Auth Tag
        const payloadData = {
            patientId,
            doctorReg: doctor.regNo,
            diagnosisCode: diag.code,
            treatmentPlan: diag.defaultMeds,
            labsOrdered: diag.defaultLabs
        };
        const payloadString = JSON.stringify(payloadData);
        const rawPayloadBytes = Buffer.byteLength(payloadString, 'utf8');
        const ciphertextLengthBytes = rawPayloadBytes + 28; // Raw + 12B IV + 16B AuthTag

        // Generate synthetic IPFS CIDv1 multihash
        const cidDigest = crypto.createHash('sha256').update(`${patientId}_${i}_${payloadString}`).digest('hex');
        const ipfsCID = `Qm${cidDigest.substring(0, 44)}`;

        // Hospital-specific consent rules & status calculation
        const isRevoked = i % 29 === 0;
        const isExpired = (i % 31 === 0) && (recordType !== "EmergencyBreakGlassAccess");
        const isBreakGlass = recordType === "EmergencyBreakGlassAccess" && hospital.rules.breakGlassAllowed;

        let consentStatus = "ACTIVE";
        if (isBreakGlass) consentStatus = "BREAK_GLASS_EMERGENCY_OVERRIDE";
        else if (isRevoked) consentStatus = "REVOKED_BY_PATIENT";
        else if (isExpired) consentStatus = "EXPIRED_TTL";

        // Hedera Consensus Service Receipt
        currentHcsSeq++;
        const consensusTimeOffsetMs = (i * 1840) + Math.floor(Math.random() * 200);
        const consensusTimestamp = new Date(baseTimestamp + consensusTimeOffsetMs).toISOString();
        const eventMessage = `${hospital.id}:${doctor.wallet}:${patientWallet}:${diag.code}:${ipfsCID}`;
        const runningHash = `0x${crypto.createHash('sha256').update(prevRunningHash + eventMessage).digest('hex')}`;
        prevRunningHash = runningHash;

        const row = {
            rowId: i,
            recordId: `REC-${i.toString().padStart(5, '0')}`,
            encounterTimestamp: consensusTimestamp,
            hospital: {
                id: hospital.id,
                name: hospital.name,
                type: hospital.type,
                walletAddress: hospital.walletAddress,
                appliedRules: {
                    consentDurationDays: hospital.rules.consentDurationDays,
                    dpdpTier: hospital.rules.dpdpTier,
                    breakGlassPermitted: hospital.rules.breakGlassAllowed,
                    mpcThreshold: hospital.rules.mpcThreshold,
                    encryptionCipher: hospital.rules.encryptionCipher,
                    dataRetentionYears: hospital.rules.dataRetentionYears,
                    telecomMasking: hospital.rules.telecomMasking,
                    requireInsurancePreAuth: hospital.rules.requireInsurancePreAuth
                }
            },
            patient: {
                patientId,
                shortId: patientShortId,
                walletAddress: patientWallet,
                age: patientAge,
                gender: patientGender,
                maskedPhone: hospital.rules.telecomMasking.includes("Full") ? "XXX-XXX-XXXX" : `+91-XXXXX-${(9000 + (i % 1000))}`
            },
            attendingDoctor: {
                name: doctor.name,
                walletAddress: doctor.wallet,
                registrationNo: doctor.regNo,
                specialtyRole: doctor.role
            },
            clinicalClassification: {
                icd10Code: diag.code,
                diagnosisTitle: diag.title,
                chapter: diag.chapter,
                clinicalCategory: diag.category,
                severityLevel: diag.severity,
                billableStatus: diag.billable
            },
            clinicalDetails: {
                recordType,
                prescribedMedications: diag.defaultMeds,
                diagnosticLabsRequested: diag.defaultLabs,
                estimatedCostINR: diag.billable ? (1500 + (i % 15) * 450) : 0
            },
            cryptographicEnvelope: {
                algorithm: "AES-256-GCM",
                transitKeyHandle: `vault-transit-key-${patientWallet.slice(0, 10)}`,
                mpcThresholdSchema: hospital.rules.mpcThreshold,
                initializationVectorHex: iv,
                authTagHex: authTag,
                rawPayloadBytes,
                ciphertextLengthBytes,
                fixedOverheadBytes: 28,
                zkCommitmentProof: `0x${crypto.createHash('sha256').update(`${cidDigest}:${patientShortId}:${i}`).digest('hex')}`
            },
            decentralizedStorage: {
                storageNetwork: "Pinata IPFS Dedicated Gateway",
                ipfsCID,
                cidVersion: 1
            },
            hederaConsensusAudit: {
                hcsTopicId: "0.0.4891024",
                sequenceNumber: currentHcsSeq,
                consensusTimestamp,
                runningHash,
                finalityLatencySeconds: (1.80 + (Math.random() * 0.45)).toFixed(2),
                gasFeeHbar: (0.00010).toFixed(5)
            },
            dpdpGovernance: {
                consentStatus,
                purposeLimitation: isBreakGlass ? "EMERGENCY_OVERRIDE_CLINICAL_LIFE_SAFETY" : "DIRECT_PATIENT_CARE_AND_TREATMENT",
                retentionExpiryDate: new Date(baseTimestamp + consensusTimeOffsetMs + (hospital.rules.consentDurationDays * 86400000)).toISOString().split('T')[0],
                rightToErasureSupported: true
            }
        };

        dataset.push(row);
    }

    return dataset;
}

// Generate the 3,000-row synthetic dataset
const dataset = generateDataset(3000);

// Output paths
const outputPathJSON = path.join(__dirname, 'synthetic_dataset_3000.json');
const outputPathSummary = path.join(__dirname, 'dataset_summary.txt');

fs.writeFileSync(outputPathJSON, JSON.stringify(dataset, null, 2), 'utf8');

// Generate statistical summary
const hospitalCounts = {};
const categoryCounts = {};
const consentCounts = {};

dataset.forEach(row => {
    hospitalCounts[row.hospital.name] = (hospitalCounts[row.hospital.name] || 0) + 1;
    categoryCounts[row.clinicalClassification.clinicalCategory] = (categoryCounts[row.clinicalClassification.clinicalCategory] || 0) + 1;
    consentCounts[row.dpdpGovernance.consentStatus] = (consentCounts[row.dpdpGovernance.consentStatus] || 0) + 1;
});

const summaryText = `================================================================================
OJASRAKSHA 3,000-ROW MULTI-HOSPITAL SYNTHETIC DATASET GENERATION REPORT
================================================================================
Generated Records Count: ${dataset.length.toLocaleString()} rows
Standard: HL7 FHIR R4 / WHO ICD-10-CM / DPDP Act 2023 / Hedera HCS Topic 0.0.4891024
Output File: ${outputPathJSON}

--------------------------------------------------------------------------------
1. DISTRIBUTION BY HEALTHCARE ORGANIZATION & HOSPITAL-SPECIFIC RULES
--------------------------------------------------------------------------------
${Object.entries(hospitalCounts).map(([hName, count]) => ` - ${hName.padEnd(48)}: ${count} rows (${((count/3000)*100).toFixed(1)}%)`).join('\n')}

--------------------------------------------------------------------------------
2. DISTRIBUTION BY CLINICAL CATEGORY (ICD-10-CM)
--------------------------------------------------------------------------------
${Object.entries(categoryCounts).map(([cat, count]) => ` - ${cat.padEnd(35)}: ${count} rows (${((count/3000)*100).toFixed(1)}%)`).join('\n')}

--------------------------------------------------------------------------------
3. DISTRIBUTION BY DPDP CONSENT & GOVERNANCE STATE
--------------------------------------------------------------------------------
${Object.entries(consentCounts).map(([st, count]) => ` - ${st.padEnd(35)}: ${count} rows (${((count/3000)*100).toFixed(1)}%)`).join('\n')}

================================================================================
Cryptographic Verification: 100% AES-256-GCM Envelopes, 96-bit IVs, 128-bit Tags
================================================================================
`;

fs.writeFileSync(outputPathSummary, summaryText, 'utf8');

console.log(summaryText);
console.log(`[SUCCESS] Dataset generated successfully at: ${outputPathJSON}`);
