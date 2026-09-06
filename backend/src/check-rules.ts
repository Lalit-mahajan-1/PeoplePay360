import dotenv from 'dotenv';
import path from 'path';
import prisma from './lib/prisma';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkRules() {
  console.log('--- CHECKING CONTRACTS & SALARY STRUCTURES ---');

  const structures = await prisma.salaryStructure.findMany({
    include: {
      rules: {
        include: { salaryRule: true },
        orderBy: { sequence: 'asc' },
      },
    },
  });

  console.log(`Found ${structures.length} Salary Structures:`);
  for (const s of structures) {
    console.log(`\nStructure: "${s.name}" (Code: ${s.code}, ID: ${s.id})`);
    for (const r of s.rules) {
      const rule = r.salaryRule;
      console.log(
        `  - [Seq ${r.sequence}] Code: ${rule.code} | Name: ${rule.name} | Category: ${rule.category} | CompType: ${rule.computationType} | InputSource: ${rule.inputSource} | Fixed: ${rule.fixedAmount} | Pct: ${rule.percentage}% | Formula: "${rule.formula}"`
      );
    }
  }

  const contracts = await prisma.contract.findMany({
    include: {
      employee: true,
      salaryStructure: true,
    },
  });

  console.log(`\nFound ${contracts.length} Contracts:`);
  for (const c of contracts) {
    console.log(
      `  - Employee: ${c.employee.firstName} ${c.employee.lastName} | Wage: ₹${c.wage} | Structure: ${c.salaryStructure?.name} (${c.salaryStructureId})`
    );
  }

  await prisma.$disconnect();
}

checkRules();
