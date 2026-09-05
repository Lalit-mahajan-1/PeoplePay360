import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ==================== DEPARTMENTS ====================
  const engineering = await prisma.department.upsert({ where: { code: 'ENG' }, update: {}, create: { name: 'Engineering', code: 'ENG' } });
  const hr = await prisma.department.upsert({ where: { code: 'HR' }, update: {}, create: { name: 'Human Resources', code: 'HR' } });
  const finance = await prisma.department.upsert({ where: { code: 'FIN' }, update: {}, create: { name: 'Finance', code: 'FIN' } });
  const marketing = await prisma.department.upsert({ where: { code: 'MKT' }, update: {}, create: { name: 'Marketing', code: 'MKT' } });
  const operations = await prisma.department.upsert({ where: { code: 'OPS' }, update: {}, create: { name: 'Operations', code: 'OPS' } });

  // ==================== WORKING SCHEDULES ====================
  const standardSchedule = await prisma.workingSchedule.upsert({
    where: { code: 'STD-5D' },
    update: {},
    create: {
      name: 'Standard 5-Day Week',
      code: 'STD-5D',
      description: 'Mon-Fri 9 AM to 6 PM with 1 hour lunch',
      isActive: true,
      days: {
        create: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((d) => ({
          weekday: d as any,
          startTime: new Date(`1970-01-01T09:00:00`),
          endTime: new Date(`1970-01-01T18:00:00`),
          breakMinutes: 60,
        })),
      },
    },
    include: { days: true },
  });

  const internSchedule = await prisma.workingSchedule.upsert({
    where: { code: 'INT-5D' },
    update: {},
    create: {
      name: 'Intern Flexible',
      code: 'INT-5D',
      description: 'Mon-Fri 10 AM to 5 PM',
      isActive: true,
      days: {
        create: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((d) => ({
          weekday: d as any,
          startTime: new Date(`1970-01-01T10:00:00`),
          endTime: new Date(`1970-01-01T17:00:00`),
          breakMinutes: 30,
        })),
      },
    },
  });

  // ==================== TIME OFF TYPES ====================
  const casualLeave = await prisma.timeOffType.upsert({ where: { code: 'CL' }, update: {}, create: { name: 'Casual Leave', code: 'CL', unit: 'DAYS', requiresAllocation: true, requiresApproval: true, isPaid: true, description: 'Short-term personal leave' } });
  const sickLeave = await prisma.timeOffType.upsert({ where: { code: 'SL' }, update: {}, create: { name: 'Sick Leave', code: 'SL', unit: 'DAYS', requiresAllocation: true, requiresApproval: true, isPaid: true, description: 'Health-related leave' } });
  const privilegeLeave = await prisma.timeOffType.upsert({ where: { code: 'PL' }, update: {}, create: { name: 'Privilege / Annual Leave', code: 'PL', unit: 'DAYS', requiresAllocation: true, requiresApproval: true, isPaid: true, description: 'Annual vacation leave' } });
  const unpaidLeave = await prisma.timeOffType.upsert({ where: { code: 'LWP' }, update: {}, create: { name: 'Leave Without Pay', code: 'LWP', unit: 'DAYS', requiresAllocation: false, requiresApproval: true, isPaid: false, description: 'Unpaid long leaves' } });
  const compOff = await prisma.timeOffType.upsert({ where: { code: 'COMP' }, update: {}, create: { name: 'Compensatory Off', code: 'COMP', unit: 'DAYS', requiresAllocation: true, requiresApproval: true, isPaid: true, description: 'Comp off for weekend work' } });

  // ==================== SALARY RULES ====================
  const basicRule = await prisma.salaryRule.upsert({ where: { code: 'BASIC' }, update: {}, create: { name: 'Basic Salary', code: 'BASIC', category: 'BASIC', computationType: 'FIXED', description: 'Base component of salary' } });
  const hraRule = await prisma.salaryRule.upsert({ where: { code: 'HRA' }, update: {}, create: { name: 'House Rent Allowance', code: 'HRA', category: 'ALLOWANCE', computationType: 'PERCENTAGE', percentage: 40, description: '40% of Basic' } });
  const daRule = await prisma.salaryRule.upsert({ where: { code: 'DA' }, update: {}, create: { name: 'Dearness Allowance', code: 'DA', category: 'ALLOWANCE', computationType: 'PERCENTAGE', percentage: 15, description: '15% of Basic' } });
  const travelRule = await prisma.salaryRule.upsert({ where: { code: 'TRA' }, update: {}, create: { name: 'Transport Allowance', code: 'TRA', category: 'ALLOWANCE', computationType: 'FIXED', fixedAmount: 1600, description: 'Monthly transport allowance' } });
  const medicalRule = await prisma.salaryRule.upsert({ where: { code: 'MED' }, update: {}, create: { name: 'Medical Allowance', code: 'MED', category: 'ALLOWANCE', computationType: 'FIXED', fixedAmount: 1250, description: 'Monthly medical reimbursement' } });
  const grossRule = await prisma.salaryRule.upsert({ where: { code: 'GROSS' }, update: {}, create: { name: 'Gross Salary', code: 'GROSS', category: 'GROSS', computationType: 'FORMULA', formula: 'BASIC + HRA + DA + TRA + MED', description: 'Total earnings' } });
  const pfRule = await prisma.salaryRule.upsert({ where: { code: 'PF' }, update: {}, create: { name: 'Provident Fund', code: 'PF', category: 'DEDUCTION', computationType: 'PERCENTAGE', percentage: 12, description: '12% Employee PF' } });
  const ptRule = await prisma.salaryRule.upsert({ where: { code: 'PT' }, update: {}, create: { name: 'Professional Tax', code: 'PT', category: 'DEDUCTION', computationType: 'FIXED', fixedAmount: 200, description: 'State Professional Tax' } });
  const itRule = await prisma.salaryRule.upsert({ where: { code: 'IT' }, update: {}, create: { name: 'Income Tax', code: 'IT', category: 'DEDUCTION', computationType: 'PERCENTAGE', percentage: 10, description: 'TDS approximate' } });
  const netRule = await prisma.salaryRule.upsert({ where: { code: 'NET' }, update: {}, create: { name: 'Net Salary', code: 'NET', category: 'NET', computationType: 'FORMULA', formula: 'GROSS - PF - PT - IT', description: 'Take-home pay' } });

  // ==================== SALARY STRUCTURES ====================
  const structureLinks = [
    { rule: basicRule, seq: 1 },
    { rule: hraRule, seq: 2 },
    { rule: daRule, seq: 3 },
    { rule: travelRule, seq: 4 },
    { rule: medicalRule, seq: 5 },
    { rule: grossRule, seq: 6 },
    { rule: pfRule, seq: 7 },
    { rule: ptRule, seq: 8 },
    { rule: itRule, seq: 9 },
    { rule: netRule, seq: 10 },
  ];

  const regularStructure = await prisma.salaryStructure.upsert({
    where: { code: 'REG-SAL' },
    update: {},
    create: {
      name: 'Regular Full-Time Salary',
      code: 'REG-SAL',
      description: 'Standard salary structure for full-time employees',
      isActive: true,
      rules: { create: structureLinks.map(({ rule, seq }) => ({ salaryRuleId: rule.id, sequence: seq })) },
    },
    include: { rules: true },
  });

  const internStructure = await prisma.salaryStructure.upsert({
    where: { code: 'INT-STP' },
    update: {},
    create: {
      name: 'Intern Stipend Structure',
      code: 'INT-STP',
      description: 'Simple stipend structure for interns',
      isActive: true,
      rules: {
        create: [
          { salaryRuleId: basicRule.id, sequence: 1 },
          { salaryRuleId: grossRule.id, sequence: 2 },
          { salaryRuleId: netRule.id, sequence: 3 },
        ],
      },
    },
  });

  // ==================== EMPLOYEES ====================
  const createEmp = async (
    code: string, firstName: string, lastName: string, email: string,
    profile: string, deptId: string, scheduleId: string, mgrId: string | undefined,
    empType: string = 'FULL_TIME', hire: string = '2023-01-15'
  ) => {
    return prisma.employee.upsert({
      where: { employeeCode: code },
      update: {},
      create: {
        employeeCode: code, firstName, lastName, email,
        phone: `+91-98765${code.slice(-5)}`,
        gender: ['MALE', 'FEMALE'][Math.floor(Math.random() * 2)] as any,
        jobProfile: profile as any,
        managerId: mgrId,
        hireDate: new Date(hire),
        status: 'ACTIVE',
        employeeType: empType as any,
        city: ['Bangalore', 'Mumbai', 'Hyderabad', 'Delhi', 'Pune'][Math.floor(Math.random() * 5)],
        country: 'India',
        bankName: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank'][Math.floor(Math.random() * 4)],
        bankAccountNo: `${1000000000 + Math.floor(Math.random() * 9000000000)}`,
        bankIFSC: ['HDFC0001234', 'ICIC0005678', 'SBIN0009999', 'AXIS0000123'][Math.floor(Math.random() * 4)],
        workingScheduleId: scheduleId,
      },
    });
  };

  const adminPass = await bcrypt.hash('admin123', 12);
  const hrPass = await bcrypt.hash('hr123456', 12);
  const prPass = await bcrypt.hash('payroll123', 12);
  const prMgrPass = await bcrypt.hash('prmgr123', 12);
  const empPass = await bcrypt.hash('emp12345', 12);

  // 1. CEO / Admin (no manager)
  const emp1 = await createEmp('EMP001', 'Rahul', 'Sharma', 'rahul@peoplepay360.com', 'EMPLOYEE', engineering.id, standardSchedule.id, undefined, 'FULL_TIME', '2022-01-15');

  // 2. HR Manager
  const emp3 = await createEmp('EMP003', 'Amit', 'Kumar', 'amit@peoplepay360.com', 'HR_MANAGER', hr.id, standardSchedule.id, emp1.id, 'FULL_TIME', '2021-06-10');

  // 3. Payroll user
  const emp6 = await createEmp('EMP006', 'Kavita', 'Mehta', 'kavita@peoplepay360.com', 'HR_PAYROLL_USER', finance.id, standardSchedule.id, emp1.id, 'FULL_TIME', '2022-09-01');

  // 4. Payroll manager
  const emp7 = await createEmp('EMP007', 'Nikhil', 'Iyer', 'nikhil@peoplepay360.com', 'HR_PAYROLL_MANAGER', finance.id, standardSchedule.id, emp1.id, 'FULL_TIME', '2021-11-20');

  // 5. Regular employee (engineer - reports to Rahul)
  const emp2 = await createEmp('EMP002', 'Priya', 'Patel', 'priya@peoplepay360.com', 'EMPLOYEE', engineering.id, standardSchedule.id, emp1.id, 'FULL_TIME', '2023-03-01');

  // 6. Regular employee (reports to Priya)
  const emp4 = await createEmp('EMP004', 'Sneha', 'Reddy', 'sneha@peoplepay360.com', 'EMPLOYEE', engineering.id, standardSchedule.id, emp2.id, 'FULL_TIME', '2023-08-20');

  // 7. Marketing employee
  const emp8 = await createEmp('EMP008', 'Raj', 'Verma', 'raj@peoplepay360.com', 'EMPLOYEE', marketing.id, standardSchedule.id, emp1.id, 'FULL_TIME', '2023-05-12');

  // 8. Operations employee
  const emp9 = await createEmp('EMP009', 'Anita', 'Desai', 'anita@peoplepay360.com', 'EMPLOYEE', operations.id, standardSchedule.id, emp1.id, 'FULL_TIME', '2024-01-10');

  // 9. Intern
  const emp5 = await createEmp('EMP005', 'Vikram', 'Singh', 'vikram@peoplepay360.com', 'EMPLOYEE', engineering.id, internSchedule.id, emp2.id, 'INTERN', '2024-11-01');

  // 10. Part-time
  const emp10 = await createEmp('EMP010', 'Maya', 'Kapoor', 'maya@peoplepay360.com', 'EMPLOYEE', marketing.id, internSchedule.id, emp8.id, 'PART_TIME', '2024-06-01');

  const allEmployees = [emp1, emp2, emp3, emp4, emp5, emp6, emp7, emp8, emp9, emp10];

  // ==================== CONTRACTS ====================
  const createContract = async (employee: any, deptId: string, wage: number, structureId: string, scheduleId: string, startDate: string, endDate?: string, jobPosition: string = 'Software Engineer') => {
    const count = await prisma.contract.count();
    return prisma.contract.upsert({
      where: { contractNumber: `CTR${String(count + 1).padStart(5, '0')}` },
      update: {},
      create: {
        contractNumber: `CTR${String(count + 1).padStart(5, '0')}`,
        employeeId: employee.id,
        departmentId: deptId,
        workingScheduleId: scheduleId,
        salaryStructureId: structureId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        wage,
        status: 'ACTIVE',
        jobPosition,
        notes: 'Initial employment contract',
      },
    });
  };

  const c1 = await createContract(emp1, engineering.id, 150000, regularStructure.id, standardSchedule.id, '2022-01-15', undefined, 'Engineering Lead');
  const c2 = await createContract(emp2, engineering.id, 95000, regularStructure.id, standardSchedule.id, '2023-03-01', undefined, 'Senior Software Engineer');
  const c3 = await createContract(emp3, hr.id, 80000, regularStructure.id, standardSchedule.id, '2021-06-10', undefined, 'HR Manager');
  const c4 = await createContract(emp4, engineering.id, 65000, regularStructure.id, standardSchedule.id, '2023-08-20', undefined, 'Software Engineer');
  const c5 = await createContract(emp5, engineering.id, 20000, internStructure.id, internSchedule.id, '2024-11-01', '2026-04-30', 'Engineering Intern');
  const c6 = await createContract(emp6, finance.id, 85000, regularStructure.id, standardSchedule.id, '2022-09-01', undefined, 'Payroll Specialist');
  const c7 = await createContract(emp7, finance.id, 120000, regularStructure.id, standardSchedule.id, '2021-11-20', undefined, 'Payroll Manager');
  const c8 = await createContract(emp8, marketing.id, 70000, regularStructure.id, standardSchedule.id, '2023-05-12', undefined, 'Marketing Manager');
  const c9 = await createContract(emp9, operations.id, 60000, regularStructure.id, standardSchedule.id, '2024-01-10', undefined, 'Operations Executive');
  const c10 = await createContract(emp10, marketing.id, 30000, regularStructure.id, internSchedule.id, '2024-06-01', undefined, 'Part-time Marketing');

  // ==================== LEAVE ALLOCATIONS ====================
  const createAllocation = async (emp: any, type: any, allocated: number, year: number) => {
    return prisma.leaveAllocation.upsert({
      where: { id: `${emp.employeeCode}-${type.code}-${year}` },
      update: {},
      create: {
        employeeId: emp.id,
        timeOffTypeId: type.id,
        allocated,
        validFrom: new Date(`${year}-01-01`),
        validTo: new Date(`${year}-12-31`),
        status: 'APPROVED',
        notes: `${year} annual allocation`,
      },
    });
  };

  const currentYear = 2026;
  for (const emp of [emp1, emp2, emp3, emp4, emp6, emp7, emp8, emp9]) {
    await createAllocation(emp, privilegeLeave, 18, currentYear);
    await createAllocation(emp, casualLeave, 12, currentYear);
    await createAllocation(emp, sickLeave, 12, currentYear);
    await createAllocation(emp, compOff, 6, currentYear);
  }
  for (const emp of [emp5, emp10]) {
    await createAllocation(emp, casualLeave, 6, currentYear);
    await createAllocation(emp, sickLeave, 4, currentYear);
  }

  // ==================== LEAVE REQUESTS ====================
  const existingReqs = await prisma.leaveRequest.count();
  if (existingReqs === 0) {
    const allocsPriya = await prisma.leaveAllocation.findMany({ where: { employeeId: emp2.id } });
    const allocPL = allocsPriya.find(a => a.timeOffTypeId === privilegeLeave.id);
    if (allocPL) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: emp2.id, timeOffTypeId: privilegeLeave.id,
          allocationId: allocPL.id,
          startDate: new Date(`${currentYear}-08-10`),
          endDate: new Date(`${currentYear}-08-14`),
          requestedUnit: 5,
          status: 'APPROVED',
          reason: 'Family vacation',
          reviewerId: (await prisma.user.findFirst({ where: { email: 'amit@peoplepay360.com' } }))?.id,
          reviewedAt: new Date(`${currentYear}-07-15`),
        },
      });
      await prisma.leaveAllocation.update({ where: { id: allocPL.id }, data: { consumed: 5 } });
    }

    const allocsSneha = await prisma.leaveAllocation.findMany({ where: { employeeId: emp4.id } });
    const allocSL = allocsSneha.find(a => a.timeOffTypeId === sickLeave.id);
    if (allocSL) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: emp4.id, timeOffTypeId: sickLeave.id,
          allocationId: allocSL.id,
          startDate: new Date(`${currentYear}-09-01`),
          endDate: new Date(`${currentYear}-09-02`),
          requestedUnit: 2,
          status: 'PENDING',
          reason: 'Fever and rest',
        },
      });
    }
  }

  // ==================== USERS ====================
  const adminUser = await prisma.user.upsert({ where: { email: 'admin@peoplepay360.com' }, update: {}, create: { email: 'admin@peoplepay360.com', password: adminPass, role: 'ADMIN' } });
  await prisma.user.upsert({ where: { email: 'amit@peoplepay360.com' }, update: { employeeId: emp3.id }, create: { email: 'amit@peoplepay360.com', password: hrPass, role: 'HR_MANAGER', employeeId: emp3.id } });
  await prisma.user.upsert({ where: { email: 'kavita@peoplepay360.com' }, update: { employeeId: emp6.id }, create: { email: 'kavita@peoplepay360.com', password: prPass, role: 'HR_PAYROLL_USER', employeeId: emp6.id } });
  await prisma.user.upsert({ where: { email: 'nikhil@peoplepay360.com' }, update: { employeeId: emp7.id }, create: { email: 'nikhil@peoplepay360.com', password: prMgrPass, role: 'HR_PAYROLL_MANAGER', employeeId: emp7.id } });
  await prisma.user.upsert({ where: { email: 'rahul@peoplepay360.com' }, update: { employeeId: emp1.id }, create: { email: 'rahul@peoplepay360.com', password: empPass, role: 'EMPLOYEE', employeeId: emp1.id } });
  await prisma.user.upsert({ where: { email: 'priya@peoplepay360.com' }, update: { employeeId: emp2.id }, create: { email: 'priya@peoplepay360.com', password: empPass, role: 'EMPLOYEE', employeeId: emp2.id } });
  await prisma.user.upsert({ where: { email: 'sneha@peoplepay360.com' }, update: { employeeId: emp4.id }, create: { email: 'sneha@peoplepay360.com', password: empPass, role: 'EMPLOYEE', employeeId: emp4.id } });
  await prisma.user.upsert({ where: { email: 'vikram@peoplepay360.com' }, update: { employeeId: emp5.id }, create: { email: 'vikram@peoplepay360.com', password: empPass, role: 'EMPLOYEE', employeeId: emp5.id } });
  await prisma.user.upsert({ where: { email: 'raj@peoplepay360.com' }, update: { employeeId: emp8.id }, create: { email: 'raj@peoplepay360.com', password: empPass, role: 'EMPLOYEE', employeeId: emp8.id } });
  await prisma.user.upsert({ where: { email: 'maya@peoplepay360.com' }, update: { employeeId: emp10.id }, create: { email: 'maya@peoplepay360.com', password: empPass, role: 'EMPLOYEE', employeeId: emp10.id } });

  // ==================== ATTENDANCE (last 2 weeks) ====================
  const today = new Date('2026-09-05');
  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    if (weekday === 'SATURDAY' || weekday === 'SUNDAY') continue;

    for (const emp of allEmployees) {
      const key = `${emp.id}-${date.toISOString().slice(0, 10)}`;
      const existing = await prisma.attendance.findUnique({ where: { employeeId_workDate: { employeeId: emp.id, workDate: date } } });
      if (existing) continue;

      const isIntern = emp.employeeType === 'INTERN' || emp.employeeType === 'PART_TIME';
      const r = Math.random();
      let status: any = 'PRESENT';
      let checkIn: Date | null = null;
      let checkOut: Date | null = null;
      let worked = 0;
      let ot = 0;

      if (r < 0.85) {
        status = 'PRESENT';
        const ciHr = isIntern ? 10 + Math.random() * 0.5 : 9;
        const ciMin = Math.floor(Math.random() * 30);
        checkIn = new Date(date); checkIn.setHours(ciHr, ciMin, 0, 0);
        const coHr = isIntern ? 17 : 18;
        const coMin = Math.floor(Math.random() * 30);
        checkOut = new Date(date); checkOut.setHours(coHr, coMin, 0, 0);
        worked = Math.round(((coHr * 60 + coMin) - (ciHr * 60 + ciMin)) / 60) * 60 - 60;
        if (r < 0.1) { checkOut.setHours(19, 30, 0, 0); ot = 60 + Math.floor(Math.random() * 60); worked += ot; }
      } else if (r < 0.93) {
        status = 'LATE';
        checkIn = new Date(date); checkIn.setHours(10, 15, 0, 0);
        checkOut = new Date(date); checkOut.setHours(18, 15, 0, 0);
        worked = 7 * 60;
      } else {
        status = 'ABSENT';
      }

      await prisma.attendance.create({
        data: {
          employeeId: emp.id, workDate: date,
          checkIn, checkOut,
          workedMinutes: worked, overtimeMinutes: ot,
          status,
          notes: status === 'ABSENT' ? 'Seeded absent' : undefined,
        },
      });
    }
  }

  // ==================== PAYRUN & PAYSLIPS (for August 2026) ====================
  const existingPayruns = await prisma.payrun.count();
  if (existingPayruns === 0) {
    const fullTimers = allEmployees.filter(e => e.employeeType === 'FULL_TIME');
    const payrun = await prisma.payrun.create({
      data: {
        name: 'August 2026 Payroll',
        salaryStructureId: regularStructure.id,
        periodStart: new Date('2026-08-01'),
        periodEnd: new Date('2026-08-31'),
        status: 'PAID',
        createdById: adminUser.id,
        computedAt: new Date('2026-08-31'),
        validatedAt: new Date('2026-08-31'),
        paidAt: new Date('2026-08-31'),
        employees: { create: fullTimers.map(e => ({ employeeId: e.id })) },
        notes: 'Monthly payroll for August 2026',
      },
      include: { salaryStructure: { include: { rules: { include: { salaryRule: true }, orderBy: { sequence: 'asc' } } } }, employees: true },
    });

    const wages: Record<string, number> = { [emp1.id]: 150000, [emp2.id]: 95000, [emp3.id]: 80000, [emp4.id]: 65000, [emp6.id]: 85000, [emp7.id]: 120000, [emp8.id]: 70000, [emp9.id]: 60000 };
    const contractsMap: Record<string, string> = { [emp1.id]: c1.id, [emp2.id]: c2.id, [emp3.id]: c3.id, [emp4.id]: c4.id, [emp6.id]: c6.id, [emp7.id]: c7.id, [emp8.id]: c8.id, [emp9.id]: c9.id };

    for (const emp of fullTimers) {
      const baseWage = wages[emp.id] || 60000;
      const values: Record<string, number> = {};
      const lines: any[] = [];
      const rules = [...payrun.salaryStructure.rules].sort((a, b) => a.sequence - b.sequence);
      let basic = 0, gross = 0, allowances = 0, deductions = 0, net = 0;

      for (const link of rules) {
        const rule = link.salaryRule;
        if (!rule.isActive) continue;
        let amount = 0;
        if (rule.computationType === 'FIXED') amount = Number(rule.fixedAmount) || 0;
        else if (rule.computationType === 'PERCENTAGE') {
          const base = rule.category === 'DEDUCTION' ? (values['BASIC'] || baseWage) : (values['BASIC'] || baseWage);
          amount = (base * Number(rule.percentage || 0)) / 100;
        }
        if (rule.category === 'BASIC') { amount = amount || baseWage; basic = amount; }
        else if (rule.category === 'ALLOWANCE') allowances += amount;
        else if (rule.category === 'GROSS') { amount = basic + allowances; gross = amount; }
        else if (rule.category === 'DEDUCTION') deductions += amount;
        else if (rule.category === 'NET') { amount = (gross || basic + allowances) - deductions; net = amount; }
        values[rule.code] = amount;
        lines.push({ salaryRuleId: rule.id, code: rule.code, name: rule.name, category: rule.category, sequence: link.sequence, amount: Number(amount.toFixed(2)) });
      }
      gross = gross || basic + allowances;
      net = net || gross - deductions;

      const payslip = await prisma.payslip.create({
        data: {
          payrunId: payrun.id, employeeId: emp.id, contractId: contractsMap[emp.id],
          salaryStructureId: regularStructure.id,
          periodStart: payrun.periodStart, periodEnd: payrun.periodEnd,
          status: 'PAID', paymentStatus: 'PAID',
          workedDays: 22, computedAt: payrun.computedAt, validatedAt: payrun.validatedAt, paidAt: payrun.paidAt,
          basicAmount: Number(basic.toFixed(2)),
          allowanceAmount: Number(allowances.toFixed(2)),
          deductionAmount: Number(deductions.toFixed(2)),
          grossAmount: Number(gross.toFixed(2)),
          netAmount: Number(net.toFixed(2)),
          lines: { create: lines },
        },
      });

      await prisma.payslipDelivery.create({
        data: { payslipId: payslip.id, recipientEmail: emp.email, status: 'SENT', sentAt: payrun.paidAt },
      });
    }

    // Create a Sept 2026 DRAFT payrun as well
    const septPayrun = await prisma.payrun.create({
      data: {
        name: 'September 2026 Payroll',
        salaryStructureId: regularStructure.id,
        periodStart: new Date('2026-09-01'),
        periodEnd: new Date('2026-09-30'),
        status: 'DRAFT',
        createdById: adminUser.id,
        employees: { create: fullTimers.concat([emp10]).map(e => ({ employeeId: e.id })) },
        notes: 'Upcoming September payroll',
      },
    });
    // Add some warnings to the draft payrun
    await prisma.payrollWarning.create({
      data: {
        payrunId: septPayrun.id, severity: 'WARNING',
        code: 'MISSING_BANK_DETAILS',
        message: 'Employee Maya Kapoor has incomplete bank details - verify before processing',
      },
    });
  }

  console.log('\n✅ Seed completed!');
  console.log('\n📧 Login Credentials:');
  console.log('   Admin:              admin@peoplepay360.com / admin123');
  console.log('   HR Manager:         amit@peoplepay360.com   / hr123456');
  console.log('   Payroll User:       kavita@peoplepay360.com / payroll123');
  console.log('   Payroll Manager:    nikhil@peoplepay360.com / prmgr123');
  console.log('   Employee (Engineer):rahul@peoplepay360.com  / emp12345');
  console.log('   Employee (Intern):  vikram@peoplepay360.com / emp12345');
  console.log('\n📊 Sample Data:');
  console.log(`   - ${allEmployees.length} Employees (Full-time, Intern, Part-time)`);
  console.log(`   - 2 Salary Structures (Regular + Intern) with 10 Salary Rules`);
  console.log(`   - 5 Time Off Types + Leave Allocations`);
  console.log(`   - 2 Working Schedules`);
  console.log(`   - 2 Payruns (Aug 2026 PAID, Sept 2026 DRAFT)`);
  console.log(`   - 2 weeks of Attendance records`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
