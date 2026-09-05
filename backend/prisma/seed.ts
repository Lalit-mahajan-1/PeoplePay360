import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create departments
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

  // Create employees
  const emp1 = await prisma.employee.upsert({
    where: { employeeCode: 'EMP001' },
    update: {},
    create: {
      employeeCode: 'EMP001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      email: 'rahul.sharma@peoplepay360.com',
      phone: '+91-9876543210',
      gender: 'MALE',
      departmentId: engineering.id,
      jobPosition: 'Engineering Manager',
      jobTitle: 'Senior Engineering Manager',
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
      email: 'priya.patel@peoplepay360.com',
      phone: '+91-9876543211',
      gender: 'FEMALE',
      departmentId: engineering.id,
      jobPosition: 'Software Developer',
      jobTitle: 'Full Stack Developer',
      managerId: emp1.id,
      hireDate: new Date('2023-03-01'),
      status: 'ACTIVE',
      employeeType: 'FULL_TIME',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      bankName: 'ICICI Bank',
      bankAccountNo: '9876543210',
      bankIFSC: 'ICIC0005678',
    },
  });

  await prisma.employee.upsert({
    where: { employeeCode: 'EMP003' },
    update: {},
    create: {
      employeeCode: 'EMP003',
      firstName: 'Amit',
      lastName: 'Kumar',
      email: 'amit.kumar@peoplepay360.com',
      phone: '+91-9876543212',
      gender: 'MALE',
      departmentId: hr.id,
      jobPosition: 'HR Manager',
      jobTitle: 'Senior HR Manager',
      hireDate: new Date('2021-06-10'),
      status: 'ACTIVE',
      employeeType: 'FULL_TIME',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      bankName: 'SBI',
      bankAccountNo: '5555666677',
      bankIFSC: 'SBIN0009999',
    },
  });

  await prisma.employee.upsert({
    where: { employeeCode: 'EMP004' },
    update: {},
    create: {
      employeeCode: 'EMP004',
      firstName: 'Sneha',
      lastName: 'Reddy',
      email: 'sneha.reddy@peoplepay360.com',
      gender: 'FEMALE',
      departmentId: finance.id,
      jobPosition: 'Finance Analyst',
      jobTitle: 'Senior Analyst',
      hireDate: new Date('2023-08-20'),
      status: 'ACTIVE',
      employeeType: 'FULL_TIME',
      city: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
    },
  });

  await prisma.employee.upsert({
    where: { employeeCode: 'EMP005' },
    update: {},
    create: {
      employeeCode: 'EMP005',
      firstName: 'Vikram',
      lastName: 'Singh',
      email: 'vikram.singh@peoplepay360.com',
      gender: 'MALE',
      departmentId: marketing.id,
      jobPosition: 'Marketing Intern',
      jobTitle: 'Digital Marketing Intern',
      managerId: emp1.id,
      hireDate: new Date('2024-11-01'),
      status: 'ACTIVE',
      employeeType: 'INTERN',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
    },
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });