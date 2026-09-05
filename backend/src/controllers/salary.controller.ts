import { Request, Response } from 'express';
import { salaryService } from '../services/salary.service';

// ========== SALARY RULES ==========
export const getAllSalaryRules = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const rules = await salaryService.getAllRules(includeInactive);
    res.json({ success: true, data: rules, count: rules.length });
  } catch (e: any) { handleError(res, e, 'fetching salary rules'); }
};

export const getSalaryRuleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await salaryService.getRuleById(req.params.id as string);
    if (!rule) { res.status(404).json({ success: false, message: 'Salary rule not found' }); return; }
    res.json({ success: true, data: rule });
  } catch (e: any) { handleError(res, e, 'fetching salary rule'); }
};

export const createSalaryRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await salaryService.createRule(req.body, req.user!);
    res.status(201).json({ success: true, data: rule });
  } catch (e: any) { handleError(res, e, 'creating salary rule'); }
};

export const updateSalaryRule = async (req: Request, res: Response): Promise<void> => {
  try {
    const rule = await salaryService.updateRule(req.params.id as string, req.body, req.user!);
    res.json({ success: true, data: rule });
  } catch (e: any) { handleError(res, e, 'updating salary rule'); }
};

export const deleteSalaryRule = async (req: Request, res: Response): Promise<void> => {
  try {
    await salaryService.deleteRule(req.params.id as string, req.user!);
    res.json({ success: true, message: 'Salary rule deleted' });
  } catch (e: any) { handleError(res, e, 'deleting salary rule'); }
};

// ========== SALARY STRUCTURES ==========
export const getAllSalaryStructures = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const structures = await salaryService.getAllStructures(includeInactive);
    res.json({ success: true, data: structures, count: structures.length });
  } catch (e: any) { handleError(res, e, 'fetching salary structures'); }
};

export const getSalaryStructureById = async (req: Request, res: Response): Promise<void> => {
  try {
    const structure = await salaryService.getStructureById(req.params.id as string);
    if (!structure) { res.status(404).json({ success: false, message: 'Salary structure not found' }); return; }
    res.json({ success: true, data: structure });
  } catch (e: any) { handleError(res, e, 'fetching salary structure'); }
};

export const createSalaryStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const structure = await salaryService.createStructure(req.body, req.user!);
    res.status(201).json({ success: true, data: structure });
  } catch (e: any) { handleError(res, e, 'creating salary structure'); }
};

export const updateSalaryStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    const structure = await salaryService.updateStructure(req.params.id as string, req.body, req.user!);
    res.json({ success: true, data: structure });
  } catch (e: any) { handleError(res, e, 'updating salary structure'); }
};

export const deleteSalaryStructure = async (req: Request, res: Response): Promise<void> => {
  try {
    await salaryService.deleteStructure(req.params.id as string, req.user!);
    res.json({ success: true, message: 'Salary structure deleted' });
  } catch (e: any) { handleError(res, e, 'deleting salary structure'); }
};

function handleError(res: Response, error: any, context: string) {
  if (error.status) { res.status(error.status).json({ success: false, message: error.message }); return; }
  console.error(`Error ${context}:`, error);
  res.status(500).json({ success: false, message: `Failed ${context}` });
}
