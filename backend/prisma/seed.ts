import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Departments
  const engineering = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: {},
    create: { name: 'Engineering', code: 'ENG' },
  });

  const hr = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: { name: 'Human Resources', code: 'HR' },
  });

  const finance = await prisma.department.upsert({
    where: { code: 'FIN' },
    update: {},
    create: { name: 'Finance', code: 'FIN' },
  });

  const marketing = await prisma.department.upsert({
    where: { code: 'MKT' },
    update: {},
    create: { name: 'Marketing', code: 'MKT' },
  });

  // Employees
  const emp1 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP001' },
    update: {},
    create: {
      employeeCode: 'EMP001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul@peoplepay360.com',
      phone: '+91-9876543210',
      gender: 'MALE',
      jobProfile: 'EMPLOYEE',
      hireDate: new Date('2022-01-15'),
      status: 'ACTIVE',
      employeeType: 'FULL_TIME',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      bankName: 'HDFC Bank',
      bankAccountNo: '1234567890',
      bankIFSC: 'HDFC0001234',
    },
  });

  const emp2 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP002' },
    update: {},
    create: {
      employeeCode: 'EMP002',
      firstName: 'Priya',
      lastName: 'Patel',
      email: 'priya@peoplepay360.com',
      phone: '+91-9876543211',
      gender: 'FEMALE',
      jobProfile: 'EMPLOYEE',
      managerId: emp1.id,
      hireDate: new Date('2023-03-01'),
      status: 'ACTIVE',
      employeeType: 'FULL_TIME',
      city: 'Bangalore',
      country: 'India',
      bankName: 'ICICI Bank',
      bankAccountNo: '9876543210',
      bankIFSC: 'ICIC0005678',
    },
  });

  const emp3 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP003' },
    update: {},
    create: {
      employeeCode: 'EMP003',
      firstName: 'Amit',
      lastName: 'Kumar',
      email: 'amit@peoplepay360.com',
      gender: 'MALE',
      jobProfile: 'HR_MANAGER',
      hireDate: new Date('2021-06-10'),
      status: 'ACTIVE',
      employeeType: 'FULL_TIME',
      city: 'Mumbai',
      country: 'India',
      bankName: 'SBI',
      bankAccountNo: '5555666677',
      bankIFSC: 'SBIN0009999',
    },
  });

  const emp4 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP004' },
    update: {},
    create: {
      employeeCode: 'EMP004',
      firstName: 'Sneha',
      lastName: 'Reddy',
      email: 'sneha@peoplepay360.com',
      gender: 'FEMALE',
      jobProfile: 'EMPLOYEE',
      hireDate: new Date('2023-08-20'),
      status: 'ACTIVE',
      employeeType: 'FULL_TIME',
      city: 'Hyderabad',
      country: 'India',
    },
  });

  const emp5 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP005' },
    update: {},
    create: {
      employeeCode: 'EMP005',
      firstName: 'Vikram',
      lastName: 'Singh',
      email: 'vikram@peoplepay360.com',
      gender: 'MALE',
      jobProfile: 'EMPLOYEE',
      hireDate: new Date('2024-11-01'),
      status: 'ACTIVE',
      employeeType: 'INTERN',
      city: 'Delhi',
      country: 'India',
    },
  });

  // Users
  const adminPassword = await bcrypt.hash('admin123', 12);
  const hrPassword = await bcrypt.hash('hr123456', 12);
  const empPassword = await bcrypt.hash('emp12345', 12);

  await prisma.user.upsert({
    where: { email: 'admin@peoplepay360.com' },
    update: {},
    create: {
      email: 'admin@peoplepay360.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'amit@peoplepay360.com' },
    update: {},
    create: {
      email: 'amit@peoplepay360.com',
      password: hrPassword,
      role: 'HR_MANAGER',
      employeeId: emp3.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'rahul@peoplepay360.com' },
    update: { employeeId: emp1.id },
    create: {
      email: 'rahul@peoplepay360.com',
      password: empPassword,
      role: 'EMPLOYEE',
      employeeId: emp1.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'priya@peoplepay360.com' },
    update: { employeeId: emp2.id },
    create: {
      email: 'priya@peoplepay360.com',
      password: empPassword,
      role: 'EMPLOYEE',
      employeeId: emp2.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'sneha@peoplepay360.com' },
    update: { employeeId: emp4.id },
    create: {
      email: 'sneha@peoplepay360.com',
      password: empPassword,
      role: 'EMPLOYEE',
      employeeId: emp4.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'employee@peoplepay360.com' },
    update: { employeeId: emp5.id },
    create: {
      email: 'employee@peoplepay360.com',
      password: empPassword,
      role: 'EMPLOYEE',
      employeeId: emp5.id,
    },
  });

  console.log('✅ Seed completed!');
  // Attendance for 4 September 2026. The composite unique key keeps this
  // idempotent: rerunning the seed updates these records instead of duplicating them.
  const workDate = new Date('2026-09-04T00:00:00.000Z');
  const attendanceRecords = [
    {
      employeeId: emp1.id,
      checkIn: new Date('2026-09-04T09:00:00.000Z'),
      checkOut: new Date('2026-09-04T18:00:00.000Z'),
      workedMinutes: 480,
      overtimeMinutes: 60,
      status: 'PRESENT' as const,
    },
    {
      employeeId: emp2.id,
      checkIn: new Date('2026-09-04T09:45:00.000Z'),
      checkOut: new Date('2026-09-04T18:15:00.000Z'),
      workedMinutes: 480,
      overtimeMinutes: 0,
      status: 'LATE' as const,
    },
    {
      employeeId: emp3.id,
      checkIn: new Date('2026-09-04T09:15:00.000Z'),
      checkOut: new Date('2026-09-04T18:15:00.000Z'),
      workedMinutes: 480,
      overtimeMinutes: 0,
      status: 'PRESENT' as const,
    },
    {
      employeeId: emp4.id,
      checkIn: null,
      checkOut: null,
      workedMinutes: 0,
      overtimeMinutes: 0,
      status: 'ABSENT' as const,
      notes: 'Seeded absent record',
    },
    {
      employeeId: emp5.id,
      checkIn: new Date('2026-09-04T10:00:00.000Z'),
      checkOut: new Date('2026-09-04T18:00:00.000Z'),
      workedMinutes: 420,
      overtimeMinutes: 0,
      status: 'PRESENT' as const,
    },
  ];

  for (const record of attendanceRecords) {
    const { employeeId, ...attendanceData } = record;
    await prisma.attendance.upsert({
      where: { employeeId_workDate: { employeeId, workDate } },
      update: attendanceData,
      create: { employeeId, workDate, ...attendanceData },
    });
  }

  console.log('');
  console.log('📧 Login Credentials:');
  console.log('   Admin:      admin@peoplepay360.com / admin123');
  console.log('   HR Manager: amit@peoplepay360.com  / hr123456');
  console.log('   Employee:   rahul@peoplepay360.com / emp12345');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
