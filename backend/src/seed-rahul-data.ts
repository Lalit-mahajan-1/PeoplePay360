import dotenv from 'dotenv';
import path from 'path';
import prisma from './lib/prisma';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function seedRahulData() {
  console.log('--- SEEDING DETAILED ATTENDANCE & LEAVE DATA FOR RAHUL SHARMA ---');

  // Find Rahul Sharma
  const rahul = await prisma.employee.findFirst({
    where: {
      OR: [
        { employeeCode: 'EMP001' },
        { firstName: { contains: 'Rahul', mode: 'insensitive' } },
      ],
    },
  });

  if (!rahul) {
    console.error('Rahul Sharma not found!');
    return;
  }

  console.log(`Found Rahul Sharma: ID ${rahul.id}, Code ${rahul.employeeCode}, Email ${rahul.email}`);

  // Ensure Rahul's contract has wage ₹1,50,000 and status ACTIVE
  const contract = await prisma.contract.findFirst({
    where: { employeeId: rahul.id },
  });

  if (contract) {
    await prisma.contract.update({
      where: { id: contract.id },
      data: {
        wage: 150000,
        status: 'ACTIVE',
        jobPosition: 'Senior Software Architect',
      },
    });
    console.log('Updated Rahul contract wage to ₹1,50,000 and status ACTIVE');
  }

  // Ensure Unpaid Leave TimeOffType exists
  let unpaidType = await prisma.timeOffType.findFirst({
    where: { OR: [{ code: 'UNPAID' }, { isPaid: false }] },
  });
  if (!unpaidType) {
    unpaidType = await prisma.timeOffType.create({
      data: {
        name: 'Unpaid Medical Leave',
        code: 'UNPAID_MED',
        unit: 'DAYS',
        requiresAllocation: false,
        requiresApproval: true,
        isPaid: false,
        description: 'Unpaid medical or personal leave resulting in daily rate salary deduction',
      },
    });
  }

  // Ensure Paid Leave TimeOffType exists
  let paidType = await prisma.timeOffType.findFirst({
    where: { OR: [{ code: 'CASUAL' }, { isPaid: true }] },
  });

  // Create Unpaid Leave Requests for Rahul in July 2026 period (2026-07-01 to 2026-07-31)
  const julyStart = new Date('2026-07-01');
  const julyEnd = new Date('2026-07-31');

  // Delete existing leave requests for test period
  await prisma.leaveRequest.deleteMany({
    where: {
      employeeId: rahul.id,
      startDate: { gte: julyStart, lte: julyEnd },
    },
  });

  // Create 2 days unpaid medical leave (July 15 & July 16)
  await prisma.leaveRequest.create({
    data: {
      employeeId: rahul.id,
      timeOffTypeId: unpaidType.id,
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-07-16'),
      requestedUnit: 2,
      status: 'APPROVED',
      reason: 'Medical emergency - Unpaid Leave',
    },
  });

  if (paidType) {
    // Create 3 days paid casual leave (July 20 to July 22)
    await prisma.leaveRequest.create({
      data: {
        employeeId: rahul.id,
        timeOffTypeId: paidType.id,
        startDate: new Date('2026-07-20'),
        endDate: new Date('2026-07-22'),
        requestedUnit: 3,
        status: 'APPROVED',
        reason: 'Personal family event',
      },
    });
  }

  console.log('Created 2 days Unpaid Leave and 3 days Paid Leave for Rahul in July 2026');

  // Create 20 days Attendance records for Rahul in July 2026 (Mon-Fri)
  await prisma.attendance.deleteMany({
    where: {
      employeeId: rahul.id,
      workDate: { gte: julyStart, lte: julyEnd },
    },
  });

  let dayCount = 0;
  for (let d = new Date(julyStart); d <= julyEnd; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    const dateStr = d.toISOString().slice(0, 10);
    const workDate = new Date(`${dateStr}T00:00:00.000Z`);

    // July 15 & 16: On Unpaid Leave
    if (dateStr === '2026-07-15' || dateStr === '2026-07-16') {
      await prisma.attendance.create({
        data: {
          employeeId: rahul.id,
          workDate,
          status: 'ON_LEAVE',
          notes: 'Approved Unpaid Leave (Medical)',
        },
      });
      continue;
    }

    // July 20, 21, 22: On Paid Leave
    if (['2026-07-20', '2026-07-21', '2026-07-22'].includes(dateStr)) {
      await prisma.attendance.create({
        data: {
          employeeId: rahul.id,
          workDate,
          status: 'ON_LEAVE',
          notes: 'Approved Paid Casual Leave',
        },
      });
      continue;
    }

    // July 5 & 10: Late Check-in
    if (dateStr === '2026-07-05' || dateStr === '2026-07-10') {
      const checkIn = new Date(`${dateStr}T10:15:00.000Z`);
      const checkOut = new Date(`${dateStr}T18:30:00.000Z`);
      await prisma.attendance.create({
        data: {
          employeeId: rahul.id,
          workDate,
          checkIn,
          checkOut,
          workedMinutes: 435, // 7.25 hrs
          overtimeMinutes: 0,
          status: 'LATE',
          notes: 'Late arrival due to traffic',
        },
      });
      dayCount++;
      continue;
    }

    // Normal Present Day with 1 hr Overtime on July 25 & July 28
    const checkIn = new Date(`${dateStr}T09:00:00.000Z`);
    const checkOut = ['2026-07-25', '2026-07-28'].includes(dateStr)
      ? new Date(`${dateStr}T19:30:00.000Z`)
      : new Date(`${dateStr}T18:00:00.000Z`);
    const overtime = ['2026-07-25', '2026-07-28'].includes(dateStr) ? 90 : 0; // 1.5 hrs OT

    await prisma.attendance.create({
      data: {
        employeeId: rahul.id,
        workDate,
        checkIn,
        checkOut,
        workedMinutes: 480 + overtime,
        overtimeMinutes: overtime,
        status: 'PRESENT',
      },
    });
    dayCount++;
  }

  console.log(`Created ${dayCount} attendance records for Rahul in July 2026.`);

  // Also seed attendance and leave for other key employees (Amit, Anita, Sneha, Maya)
  const otherEmps = await prisma.employee.findMany({
    where: { id: { not: rahul.id } },
    take: 5,
  });

  for (const emp of otherEmps) {
    await prisma.attendance.deleteMany({
      where: { employeeId: emp.id, workDate: { gte: julyStart, lte: julyEnd } },
    });

    for (let d = new Date(julyStart); d <= julyEnd; d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const dateStr = d.toISOString().slice(0, 10);
      const workDate = new Date(`${dateStr}T00:00:00.000Z`);
      const checkIn = new Date(`${dateStr}T09:00:00.000Z`);
      const checkOut = new Date(`${dateStr}T18:00:00.000Z`);

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          workDate,
          checkIn,
          checkOut,
          workedMinutes: 480,
          overtimeMinutes: 0,
          status: 'PRESENT',
        },
      });
    }
  }

  console.log('🎉 Seeded attendance and leave records for Rahul Sharma & team!');
  await prisma.$disconnect();
}

seedRahulData();
