import dotenv from 'dotenv';
import path from 'path';
import prisma from './lib/prisma';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkComputedPayslips() {
  const payslips = await prisma.payslip.findMany({
    include: {
      employee: true,
      lines: { orderBy: { sequence: 'asc' } },
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  console.log(`--- DYNAMIC COMPUTED PAYSLIPS RESULTS (${payslips.length}) ---`);
  for (const p of payslips) {
    console.log(
      `Employee: ${p.employee.firstName} ${p.employee.lastName} (${p.employee.employeeCode}) | Basic: ₹${p.basicAmount} | Allowances: +₹${p.allowanceAmount} | Deductions: -₹${p.deductionAmount} | Gross: ₹${p.grossAmount} | Net Take-Home: ₹${p.netAmount}`
    );
  }
  await prisma.$disconnect();
}

checkComputedPayslips();
