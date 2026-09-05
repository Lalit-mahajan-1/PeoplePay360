import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';

export class SalaryService {
  // ========== SALARY RULES ==========
  async getAllRules(includeInactive = false) {
    return prisma.salaryRule.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: { _count: { select: { structures: true } } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getRuleById(id: string) {
    return prisma.salaryRule.findUnique({
      where: { id },
      include: { structures: { include: { salaryStructure: true } } },
    });
  }

  async createRule(data: any, authUser: AuthUser) {
    const existingCode = await prisma.salaryRule.findUnique({ where: { code: data.code } });
    if (existingCode) throw { status: 409, message: 'Salary rule code already exists' };

    const rule = await prisma.salaryRule.create({ data });
    await createAuditLog({
      action: 'CREATE', module: 'SALARY_RULE', recordId: rule.id,
      details: `Created salary rule: ${data.name} (${data.code})`,
      userId: authUser.userId,
    });
    return rule;
  }

  async updateRule(id: string, data: any, authUser: AuthUser) {
    const rule = await prisma.salaryRule.update({ where: { id }, data });
    await createAuditLog({
      action: 'UPDATE', module: 'SALARY_RULE', recordId: id,
      details: `Updated salary rule: ${rule.name}`,
      userId: authUser.userId,
    });
    return rule;
  }

  async deleteRule(id: string, authUser: AuthUser) {
    const existing = await prisma.salaryRule.findUnique({
      where: { id }, include: { _count: { select: { structures: true } } },
    });
    if (!existing) throw { status: 404, message: 'Salary rule not found' };
    if (existing._count.structures > 0) {
      throw { status: 400, message: 'Cannot delete rule used in salary structures' };
    }
    await prisma.salaryRule.delete({ where: { id } });
    await createAuditLog({
      action: 'DELETE', module: 'SALARY_RULE', recordId: id,
      details: `Deleted salary rule: ${existing.name}`,
      userId: authUser.userId,
    });
  }

  // ========== SALARY STRUCTURES ==========
  async getAllStructures(includeInactive = false) {
    const structures = await prisma.salaryStructure.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: { select: { rules: true, contracts: true, payruns: true } },
      },
      orderBy: { name: 'asc' },
    });
    return structures.map(s => ({
      ...s,
      ruleCount: s._count.rules,
      contractCount: s._count.contracts,
      payrunCount: s._count.payruns,
    }));
  }

  async getStructureById(id: string) {
    const structure = await prisma.salaryStructure.findUnique({
      where: { id },
      include: {
        rules: {
          orderBy: { sequence: 'asc' },
          include: { salaryRule: true },
        },
        contracts: {
          where: { status: 'ACTIVE' },
          take: 5,
          include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
        },
        _count: { select: { contracts: true, payruns: true } },
      },
    });
    if (!structure) return null;
    return { ...structure, contractCount: structure._count.contracts, payrunCount: structure._count.payruns };
  }

  async createStructure(data: any, authUser: AuthUser) {
    const { name, code, description, rules, isActive = true } = data;
    if (!name || !code) throw { status: 400, message: 'Name and code are required' };

    const existingCode = await prisma.salaryStructure.findUnique({ where: { code } });
    if (existingCode) throw { status: 409, message: 'Structure code already exists' };

    const existingName = await prisma.salaryStructure.findUnique({ where: { name } });
    if (existingName) throw { status: 409, message: 'Structure name already exists' };

    const structure = await prisma.salaryStructure.create({
      data: {
        name, code, description, isActive,
        rules: rules && rules.length > 0 ? {
          create: rules.map((r: any) => ({
            salaryRuleId: r.salaryRuleId,
            sequence: r.sequence,
          })),
        } : undefined,
      },
      include: { rules: { orderBy: { sequence: 'asc' }, include: { salaryRule: true } } },
    });

    await createAuditLog({
      action: 'CREATE', module: 'SALARY_STRUCTURE', recordId: structure.id,
      details: `Created salary structure: ${name} (${code}) with ${rules?.length || 0} rules`,
      userId: authUser.userId,
    });
    return structure;
  }

  async updateStructure(id: string, data: any, authUser: AuthUser) {
    const existing = await prisma.salaryStructure.findUnique({ where: { id } });
    if (!existing) throw { status: 404, message: 'Salary structure not found' };

    const { name, code, description, isActive, rules } = data;
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;

    if (rules && Array.isArray(rules)) {
      updateData.rules = {
        deleteMany: {},
        create: rules.map((r: any) => ({
          salaryRuleId: r.salaryRuleId,
          sequence: r.sequence,
        })),
      };
    }

    const structure = await prisma.salaryStructure.update({
      where: { id },
      data: updateData,
      include: { rules: { orderBy: { sequence: 'asc' }, include: { salaryRule: true } } },
    });

    await createAuditLog({
      action: 'UPDATE', module: 'SALARY_STRUCTURE', recordId: id,
      details: `Updated salary structure: ${structure.name}`,
      userId: authUser.userId,
    });
    return structure;
  }

  async deleteStructure(id: string, authUser: AuthUser) {
    const existing = await prisma.salaryStructure.findUnique({
      where: { id }, include: { _count: { select: { contracts: true, payruns: true } } },
    });
    if (!existing) throw { status: 404, message: 'Salary structure not found' };
    if (existing._count.contracts > 0 || existing._count.payruns > 0) {
      throw { status: 400, message: 'Cannot delete structure with linked contracts or payruns' };
    }
    await prisma.salaryStructureRule.deleteMany({ where: { salaryStructureId: id } });
    await prisma.salaryStructure.delete({ where: { id } });
    await createAuditLog({
      action: 'DELETE', module: 'SALARY_STRUCTURE', recordId: id,
      details: `Deleted salary structure: ${existing.name}`,
      userId: authUser.userId,
    });
  }

  // ========== COMPUTATION LOGIC ==========
  computeSalaryLineItems(contract: any, salaryStructure: any, context: { workedDays?: number; periodDays?: number } = {}) {
    const lines: any[] = [];
    const values: Record<string, number> = {};
    const baseWage = Number(contract.wage);
    const periodDays = context.periodDays || 30;
    const workedDays = context.workedDays ?? periodDays;
    const proration = periodDays > 0 ? workedDays / periodDays : 1;

    let basic = 0;
    let gross = 0;
    let totalAllowances = 0;
    let totalDeductions = 0;
    let net = 0;

    const sortedRules = [...(salaryStructure.rules || [])].sort((a, b) => a.sequence - b.sequence);

    for (const link of sortedRules) {
      const rule = link.salaryRule;
      if (!rule || !rule.isActive) continue;

      let amount = 0;
      try {
        switch (rule.computationType) {
          case 'FIXED':
            amount = Number(rule.fixedAmount) || 0;
            break;
          case 'PERCENTAGE': {
            const pct = Number(rule.percentage) || 0;
            let base = 0;
            if (rule.category === 'ALLOWANCE' || rule.category === 'DEDUCTION') {
              base = values['BASIC'] || baseWage;
            } else if (rule.category === 'GROSS') {
              base = totalAllowances + basic;
            } else if (rule.category === 'NET') {
              base = gross - totalDeductions;
            } else {
              base = baseWage;
            }
            amount = (base * pct) / 100;
            break;
          }
          case 'FORMULA': {
            amount = this.evaluateFormula(rule.formula, values, baseWage);
            break;
          }
        }
      } catch {
        amount = 0;
      }

      if (rule.category === 'BASIC') {
        amount = amount || baseWage;
        amount = Number((amount * proration).toFixed(2));
        basic = amount;
      } else if (rule.category === 'ALLOWANCE' || rule.category === 'EMPLOYER_CONTRIBUTION') {
        amount = Number((amount * proration).toFixed(2));
        if (rule.category === 'ALLOWANCE') totalAllowances += amount;
      } else if (rule.category === 'GROSS') {
        amount = basic + totalAllowances;
        gross = amount;
      } else if (rule.category === 'DEDUCTION') {
        amount = Number(amount.toFixed(2));
        totalDeductions += amount;
      } else if (rule.category === 'NET') {
        amount = Number(((gross || (basic + totalAllowances)) - totalDeductions).toFixed(2));
        net = amount;
      }

      values[rule.code] = amount;
      values[rule.category] = (values[rule.category] || 0) + (rule.category === 'BASIC' || rule.category === 'GROSS' || rule.category === 'NET' ? 0 : amount);

      lines.push({
        salaryRuleId: rule.id,
        code: rule.code,
        name: rule.name,
        category: rule.category,
        sequence: link.sequence,
        amount: Number(amount.toFixed(2)),
      });
    }

    gross = gross || basic + totalAllowances;
    net = net || gross - totalDeductions;

    return {
      lines,
      basicAmount: Number(basic.toFixed(2)),
      allowanceAmount: Number(totalAllowances.toFixed(2)),
      deductionAmount: Number(totalDeductions.toFixed(2)),
      grossAmount: Number(gross.toFixed(2)),
      netAmount: Number(net.toFixed(2)),
    };
  }

  private evaluateFormula(formula: string | null | undefined, values: Record<string, number>, baseWage: number): number {
    if (!formula) return 0;
    try {
      const fn = new Function('BASIC', 'WAGE', 'v', `
        "use strict";
        return (${formula.replace(/\{(\w+)\}/g, (_, k) => `(v['${k}']||0)`)});
      `);
      const result = fn(values['BASIC'] || baseWage, baseWage, values);
      return Number.isFinite(result) ? result : 0;
    } catch {
      return 0;
    }
  }
}

export const salaryService = new SalaryService();
