/**
 * Demo data for local development. Safe to re-run (upserts on phone number).
 * All phone numbers below are fake placeholders.
 *
 *   Admin     +91 90000 00000
 *   Factory   +91 90000 00001 (verified), +91 90000 00002 (pending)
 *   Workers   +91 90000 00101 … 00104
 *
 * In development the OTP is printed to the server console and shown on screen.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function user(phone: string, role: "WORKER" | "EMPLOYER" | "ADMIN") {
  return db.user.upsert({ where: { phone }, update: {}, create: { phone, role } });
}

async function main() {
  await user("+919000000000", "ADMIN");

  // ---- Factories ----
  const f1User = await user("+919000000001", "EMPLOYER");
  const f1 = await db.employerProfile.upsert({
    where: { userId: f1User.id },
    update: {},
    create: {
      userId: f1User.id,
      companyName: "Demo Auto Components Pvt Ltd",
      contactPerson: "Anita Verma",
      hrPhone: "+919000000011",
      industrialCluster: "Noida Sector 63",
      city: "Noida",
      state: "Uttar Pradesh",
      gstin: "09ABCDE1234F1Z5",
      udyamNumber: "UDYAM-UP-12-1234567",
      kybStatus: "VERIFIED",
      huntCredits: 10,
    },
  });

  const f2User = await user("+919000000002", "EMPLOYER");
  const f2 = await db.employerProfile.upsert({
    where: { userId: f2User.id },
    update: {},
    create: {
      userId: f2User.id,
      companyName: "Demo Fabrication Works",
      contactPerson: "Suresh Patil",
      hrPhone: "+919000000012",
      industrialCluster: "Pimpri-Chinchwad MIDC",
      city: "Pune",
      state: "Maharashtra",
      gstin: "27ABCDE1234F1Z5",
      kybStatus: "PENDING",
    },
  });

  // ---- Jobs (only seeded once) ----
  if ((await db.jobPosting.count({ where: { employerId: { in: [f1.id, f2.id] } } })) === 0) {
    await db.jobPosting.createMany({
      data: [
        {
          employerId: f1.id,
          title: "ITI Fitter — Assembly Line",
          trade: "FITTER",
          category: "SKILLED",
          openings: 25,
          city: "Noida",
          state: "Uttar Pradesh",
          minExperienceYears: 1,
          grossSalaryMonthly: 22000,
          inHandSalaryMonthly: 19500,
          overtimeRatePerHour: 95,
          shiftHours: 8,
          hasHostel: true,
          hasCanteen: true,
          hasPfEsi: true,
          description: "Fitment and sub-assembly of automotive components. Day and night shift rotation.",
        },
        {
          employerId: f1.id,
          title: "Helper / Packer",
          trade: "HELPER",
          category: "SEMI_SKILLED",
          openings: 40,
          city: "Noida",
          state: "Uttar Pradesh",
          grossSalaryMonthly: 14500,
          inHandSalaryMonthly: 13000,
          overtimeRatePerHour: 65,
          shiftHours: 8,
          hasCanteen: true,
          hasPfEsi: true,
        },
        {
          employerId: f2.id,
          title: "MIG Welder",
          trade: "WELDER",
          category: "SKILLED",
          openings: 10,
          city: "Pune",
          state: "Maharashtra",
          minExperienceYears: 2,
          grossSalaryMonthly: 24000,
          inHandSalaryMonthly: 21500,
          overtimeRatePerHour: 110,
          shiftHours: 9,
          hasHostel: true,
          hasTravelAllowance: true,
        },
      ],
    });
  }

  // ---- Workers ----
  const workers = [
    {
      phone: "+919000000101",
      fullName: "Ramesh Kumar",
      category: "SKILLED" as const,
      trade: "FITTER" as const,
      machineTags: ["Bench fitting", "Drilling"],
      experienceYears: 4,
      itiCertified: true,
      ncvtRollNumber: "UP2019FIT1234",
      ncvtStatus: "VERIFIED" as const,
      currentState: "Uttar Pradesh",
      currentDistrict: "Lucknow",
      expectedSalaryMonthly: 20000,
    },
    {
      phone: "+919000000102",
      fullName: "Sunil Yadav",
      category: "SKILLED" as const,
      trade: "CNC_VMC_OPERATOR" as const,
      machineTags: ["CNC", "VMC", "Fanuc"],
      experienceYears: 6,
      itiCertified: true,
      currentState: "Bihar",
      currentDistrict: "Patna",
      expectedSalaryMonthly: 26000,
    },
    {
      phone: "+919000000103",
      fullName: "Imran Ansari",
      category: "SKILLED" as const,
      trade: "WELDER" as const,
      machineTags: ["MIG", "TIG", "Arc"],
      experienceYears: 3,
      itiCertified: true,
      currentState: "Madhya Pradesh",
      currentDistrict: "Bhopal",
      expectedSalaryMonthly: 22000,
    },
    {
      phone: "+919000000104",
      fullName: "Pooja Devi",
      category: "SEMI_SKILLED" as const,
      trade: "ASSEMBLY_LINE" as const,
      machineTags: ["Electronics assembly"],
      experienceYears: 1,
      itiCertified: false,
      currentState: "Uttar Pradesh",
      currentDistrict: "Gorakhpur",
    },
  ];

  for (const w of workers) {
    const { phone, ...profile } = w;
    const u = await user(phone, "WORKER");
    await db.workerProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: {
        userId: u.id,
        willingToRelocate: true,
        availableImmediately: true,
        visibleInDirectory: true,
        ...profile,
      },
    });
  }

  console.log("Seeded demo data. Log in with any phone above; the OTP prints in the server console.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
