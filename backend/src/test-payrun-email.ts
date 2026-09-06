import dotenv from 'dotenv';
import path from 'path';
import prisma from './lib/prisma';
import { reportsService } from './services/reports.service';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testPayrunEmail() {
  try {
    const payrunId = 'cmtp6rzq8000xu6py2khpq4u1';
    console.log('Testing bulk email dispatch for payrun ID:', payrunId);

    const payrun = await prisma.payrun.findUnique({
      where: { id: payrunId },
      include: {
        payslips: {
          include: { employee: true },
        },
      },
    });

    if (!payrun) {
      console.error('Payrun not found with ID:', payrunId);
      const firstPayrun = await prisma.payrun.findFirst({
        include: { payslips: true },
      });
      if (firstPayrun) {
        console.log('Found alternative payrun ID:', firstPayrun.id);
        const result = await reportsService.emailPayslipsWithNodemailer(firstPayrun.id, {
          userId: 'test-admin',
          roles: ['ADMIN'],
        } as any);
        console.log('✅ Bulk email result:', result);
      }
      return;
    }

    console.log(`Found payrun "${payrun.name}" with ${payrun.payslips.length} payslips.`);
    const result = await reportsService.emailPayslipsWithNodemailer(payrun.id, {
      userId: 'test-admin',
      roles: ['ADMIN'],
    } as any);

    console.log('✅ Bulk email result:', result);
  } catch (err: any) {
    console.error('❌ Error during bulk email dispatch:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testPayrunEmail();
