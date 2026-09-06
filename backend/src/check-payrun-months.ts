import dotenv from 'dotenv';
import path from 'path';
import prisma from './lib/prisma';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkPayruns() {
  const payruns = await prisma.payrun.findMany({
    orderBy: { periodStart: 'desc' },
    select: {
      id: true,
      name: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      _count: { select: { payslips: true } },
    },
  });

  console.log('--- PAYRUN MONTHS IN DATABASE ---');
  for (const pr of payruns) {
    console.log(
      `Payrun: "${pr.name}" (ID: ${pr.id}) | Period: ${pr.periodStart.toISOString().slice(0, 10)} to ${pr.periodEnd.toISOString().slice(0, 10)} | Status: ${pr.status} | Payslips Count: ${pr._count.payslips}`
    );
  }
  await prisma.$disconnect();
}

checkPayruns();
