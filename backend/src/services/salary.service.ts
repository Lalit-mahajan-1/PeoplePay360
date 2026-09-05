import prisma from '../lib/prisma';
import { createAuditLog } from './audit.service';
import { AuthUser } from '../middleware/auth.middleware';

export class SalaryService {
  // ══════════════════════════════════════════════
  //  SALARY RULES
  // ══════════════════════════════════════════════

  async getAllRules(includeInactive: boolean) {
    const where: any = {};
    if (!includeInactive) where.isActive = true;

    return prisma.salaryRule.findMany({
      where,
      include: {
        structures: {
          include: {
            salaryStructure: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async getRuleById(id: string) {
    return prisma.salaryRule.findUnique({
      where: { id },
      include: {
        structures: {
          include: {
            salaryStructure: { select: { id: true, name: true, code: true } },
          },
          orderBy: { sequence: 'asc' },
        },
      },
    });
  }

  async createRule(data: any, authUser: AuthUser) {
    const existing = await prisma.salaryRule.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw { status: 409, message: `Salary rule with code "${data.code}" already exists` };
    }

    const rule = await prisma.salaryRule.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        category: data.category,
        computationType: data.computationType,
        inputSource: data.inputSource || 'NONE',
        fixedAmount: data.fixedAmount != null ? data.fixedAmount : null,
        percentage: data.percentage != null ? data.percentage : null,
        formula: data.formula || null,
        isActive: data.isActive !== false,
        description: data.description || null,
      },
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'SALARY_RULE',
      recordId: rule.id,
      details: `Created salary rule: ${rule.name} (${rule.code})`,
      userId: authUser.userId,
    });

    return rule;
  }

  async updateRule(id: string, data: any, authUser: AuthUser) {
    const existing = await prisma.salaryRule.findUnique({ where: { id } });
    if (!existing) {
      throw { status: 404, message: 'Salary rule not found' };
    }

    if (data.code && data.code !== existing.code) {
      const codeTaken = await prisma.salaryRule.findUnique({
        where: { code: data.code },
      });
      if (codeTaken) {
        throw { status: 409, message: 'Rule code already in use' };
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.category !== undefined) updateData.category = data.category;
    if (data.computationType !== undefined) updateData.computationType = data.computationType;
    if (data.inputSource !== undefined) updateData.inputSource = data.inputSource;
    if (data.fixedAmount !== undefined) updateData.fixedAmount = data.fixedAmount;
    if (data.percentage !== undefined) updateData.percentage = data.percentage;
    if (data.formula !== undefined) updateData.formula = data.formula;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.description !== undefined) updateData.description = data.description;

    const rule = await prisma.salaryRule.update({
      where: { id },
      data: updateData,
    });

    await createAuditLog({
      action: 'UPDATE',
      module: 'SALARY_RULE',
      recordId: rule.id,
      details: `Updated salary rule: ${rule.name} (${rule.code})`,
      userId: authUser.userId,
    });

    return rule;
  }

  async deleteRule(id: string, authUser: AuthUser) {
    const existing = await prisma.salaryRule.findUnique({
      where: { id },
      include: { structures: true },
    });
    if (!existing) {
      throw { status: 404, message: 'Salary rule not found' };
    }

    if (existing.structures.length > 0) {
      throw {
        status: 400,
        message: 'Cannot delete: this rule is linked to salary structures. Remove it from structures first.',
      };
    }

    await prisma.salaryRule.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE',
      module: 'SALARY_RULE',
      recordId: id,
      details: `Deleted salary rule: ${existing.name} (${existing.code})`,
      userId: authUser.userId,
    });
  }

  // ══════════════════════════════════════════════
  //  SALARY STRUCTURES
  // ══════════════════════════════════════════════

  async getAllStructures(includeInactive: boolean) {
    const where: any = {};
    if (!includeInactive) where.isActive = true;

    return prisma.salaryStructure.findMany({
      where,
      include: {
        rules: {
          include: {
            salaryRule: {
              select: { id: true, code: true, name: true, category: true },
            },
          },
          orderBy: { sequence: 'asc' },
        },
        _count: { select: { contracts: true, payruns: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getStructureById(id: string) {
    return prisma.salaryStructure.findUnique({
      where: { id },
      include: {
        rules: {
          include: {
            salaryRule: true,
          },
          orderBy: { sequence: 'asc' },
        },
        contracts: {
          select: {
            id: true,
            contractNumber: true,
            employee: {
              select: { employeeCode: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });
  }

  async createStructure(data: any, authUser: AuthUser) {
    const existing = await prisma.salaryStructure.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw { status: 409, message: `Structure with code "${data.code}" already exists` };
    }

    const structure = await prisma.salaryStructure.create({
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        description: data.description || null,
        isActive: data.isActive !== false,
        rules: data.rules?.length
          ? {
            create: data.rules.map(
              (r: { salaryRuleId: string; sequence: number }) => ({
                salaryRuleId: r.salaryRuleId,
                sequence: r.sequence,
              })
            ),
          }
          : undefined,
      },
      include: {
        rules: {
          include: { salaryRule: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    await createAuditLog({
      action: 'CREATE',
      module: 'SALARY_STRUCTURE',
      recordId: structure.id,
      details: `Created salary structure: ${structure.name} with ${data.rules?.length || 0} rules`,
      userId: authUser.userId,
    });

    return structure;
  }

  async updateStructure(id: string, data: any, authUser: AuthUser) {
    const existing = await prisma.salaryStructure.findUnique({ where: { id } });
    if (!existing) {
      throw { status: 404, message: 'Salary structure not found' };
    }

    // Update basic fields
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code.toUpperCase();
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await prisma.salaryStructure.update({
      where: { id },
      data: updateData,
    });

    // Replace rules if provided
    if (data.rules && Array.isArray(data.rules)) {
      await prisma.salaryStructureRule.deleteMany({
        where: { salaryStructureId: id },
      });

      if (data.rules.length > 0) {
        await prisma.salaryStructureRule.createMany({
          data: data.rules.map(
            (r: { salaryRuleId: string; sequence: number }) => ({
              salaryStructureId: id,
              salaryRuleId: r.salaryRuleId,
              sequence: r.sequence,
            })
          ),
        });
      }
    }

    const structure = await prisma.salaryStructure.findUnique({
      where: { id },
      include: {
        rules: {
          include: { salaryRule: true },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    await createAuditLog({
      action: 'UPDATE',
      module: 'SALARY_STRUCTURE',
      recordId: id,
      details: `Updated salary structure: ${structure?.name}`,
      userId: authUser.userId,
    });

    return structure;
  }

  async deleteStructure(id: string, authUser: AuthUser) {
    const existing = await prisma.salaryStructure.findUnique({
      where: { id },
      include: {
        _count: { select: { contracts: true, payruns: true } },
      },
    });
    if (!existing) {
      throw { status: 404, message: 'Salary structure not found' };
    }

    if (existing._count.contracts > 0 || existing._count.payruns > 0) {
      throw {
        status: 400,
        message: 'Cannot delete: this structure is linked to contracts or payruns',
      };
    }

    await prisma.salaryStructureRule.deleteMany({
      where: { salaryStructureId: id },
    });
    await prisma.salaryStructure.delete({ where: { id } });

    await createAuditLog({
      action: 'DELETE',
      module: 'SALARY_STRUCTURE',
      recordId: id,
      details: `Deleted salary structure: ${existing.name}`,
      userId: authUser.userId,
    });
  }
}

export const salaryService = new SalaryService();