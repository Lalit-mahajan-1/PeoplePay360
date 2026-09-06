import dotenv from 'dotenv';
import path from 'path';
import prisma from './lib/prisma';
import { payrollService } from './services/payroll.service';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function updateSalaryRules() {
  console.log('--- UPDATING SALARY RULES & STRUCTURES TO DYNAMIC CONTRACT-BASED FORMULAS ---');

  // Define dynamic rules
  const rulesToDefine = [
    {
      code: 'BASIC',
      name: 'Basic Salary',
      category: 'BASIC',
      computationType: 'FORMULA',
      inputSource: 'BASE_SALARY',
      formula: 'BASE_SALARY * 0.50',
      fixedAmount: null,
      percentage: null,
      sequence: 1,
    },
    {
      code: 'HRA',
      name: 'House Rent Allowance',
      category: 'ALLOWANCE',
      computationType: 'FORMULA',
      inputSource: 'BASIC',
      formula: 'BASIC * 0.50',
      fixedAmount: null,
      percentage: null,
      sequence: 2,
    },
    {
      code: 'DA',
      name: 'Special Allowance',
      category: 'ALLOWANCE',
      computationType: 'FORMULA',
      inputSource: 'BASE_SALARY',
      formula: 'BASE_SALARY * 0.20',
      fixedAmount: null,
      percentage: null,
      sequence: 3,
    },
    {
      code: 'TRA',
      name: 'Transport Allowance',
      category: 'ALLOWANCE',
      computationType: 'FORMULA',
      inputSource: 'BASE_SALARY',
      formula: 'BASE_SALARY * 0.05',
      fixedAmount: null,
      percentage: null,
      sequence: 4,
    },
    {
      code: 'MED',
      name: 'Medical Allowance',
      category: 'ALLOWANCE',
      computationType: 'FORMULA',
      inputSource: 'BASE_SALARY',
      formula: 'BASE_SALARY * 0.05',
      fixedAmount: null,
      percentage: null,
      sequence: 5,
    },
    {
      code: 'GROSS',
      name: 'Gross Salary',
      category: 'GROSS',
      computationType: 'FORMULA',
      inputSource: 'NONE',
      formula: 'BASIC + HRA + DA + TRA + MED',
      fixedAmount: null,
      percentage: null,
      sequence: 6,
    },
    {
      code: 'UNPAID_LEAVE_DED',
      name: 'Unpaid Absence Deduction',
      category: 'DEDUCTION',
      computationType: 'FORMULA',
      inputSource: 'UNPAID_LEAVE_DAYS',
      formula: 'UNPAID_LEAVE_DAYS * DAILY_RATE',
      fixedAmount: null,
      percentage: null,
      sequence: 7,
    },
    {
      code: 'PF',
      name: 'Provident Fund',
      category: 'DEDUCTION',
      computationType: 'FORMULA',
      inputSource: 'BASIC',
      formula: 'BASIC * 0.12',
      fixedAmount: null,
      percentage: null,
      sequence: 8,
    },
    {
      code: 'PT',
      name: 'Professional Tax',
      category: 'DEDUCTION',
      computationType: 'FIXED',
      inputSource: 'NONE',
      formula: null,
      fixedAmount: 200,
      percentage: null,
      sequence: 9,
    },
    {
      code: 'IT',
      name: 'Income Tax (TDS)',
      category: 'DEDUCTION',
      computationType: 'FORMULA',
      inputSource: 'GROSS',
      formula: 'GROSS * 0.10',
      fixedAmount: null,
      percentage: null,
      sequence: 10,
    },
    {
      code: 'NET',
      name: 'Net Salary',
      category: 'NET',
      computationType: 'FORMULA',
      inputSource: 'NONE',
      formula: 'GROSS - PF - PT - IT - UNPAID_LEAVE_DED',
      fixedAmount: null,
      percentage: null,
      sequence: 11,
    },
  ];

  // Upsert all rules into DB
  const createdRuleIds: { id: string; sequence: number }[] = [];

  for (const r of rulesToDefine) {
    const existing = await prisma.salaryRule.findUnique({
      where: { code: r.code },
    });

    let ruleId: string;
    if (existing) {
      const updated = await prisma.salaryRule.update({
        where: { id: existing.id },
        data: {
          name: r.name,
          category: r.category as any,
          computationType: r.computationType as any,
          inputSource: r.inputSource as any,
          formula: r.formula,
          fixedAmount: r.fixedAmount,
          percentage: r.percentage,
        },
      });
      ruleId = updated.id;
      console.log(`Updated Salary Rule: ${r.code} (${updated.id})`);
    } else {
      const created = await prisma.salaryRule.create({
        data: {
          code: r.code,
          name: r.name,
          category: r.category as any,
          computationType: r.computationType as any,
          inputSource: r.inputSource as any,
          formula: r.formula,
          fixedAmount: r.fixedAmount,
          percentage: r.percentage,
          isActive: true,
        },
      });
      ruleId = created.id;
      console.log(`Created Salary Rule: ${r.code} (${created.id})`);
    }
    createdRuleIds.push({ id: ruleId, sequence: r.sequence });
  }

  // Link rules to all structures
  const structures = await prisma.salaryStructure.findMany();
  for (const st of structures) {
    console.log(`Updating rules for structure "${st.name}" (${st.id})...`);

    // Remove old structure rules
    await prisma.salaryStructureRule.deleteMany({
      where: { salaryStructureId: st.id },
    });

    // Create new structure rules
    await prisma.salaryStructureRule.createMany({
      data: createdRuleIds.map((item) => ({
        salaryStructureId: st.id,
        salaryRuleId: item.id,
        sequence: item.sequence,
      })),
    });
  }

  // Recompute existing payruns so that UI reflects dynamic calculations
  const payruns = await prisma.payrun.findMany({
    where: { status: { in: ['COMPUTED', 'VALIDATED', 'DRAFT'] } },
  });

  console.log(`Recomputing ${payruns.length} active payruns...`);
  for (const pr of payruns) {
    try {
      await payrollService.computePayrun(pr.id, {
        userId: 'admin-seed',
        roles: ['ADMIN'],
      } as any);
      console.log(`✅ Successfully recomputed payrun "${pr.name}" (${pr.id})`);
    } catch (err: any) {
      console.error(`❌ Failed to recompute payrun ${pr.id}:`, err.message || err);
    }
  }

  console.log('🎉 Dynamic Salary Rules update completed successfully!');
  await prisma.$disconnect();
}

updateSalaryRules();
