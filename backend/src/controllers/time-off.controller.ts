import { Request, Response } from 'express';
import { timeOffService } from '../services/time-off.service';
import prisma from '../lib/prisma';

// ========== TIME OFF TYPES ==========
export const getAllTimeOffTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const types = await timeOffService.getAllTypes(includeInactive);
    res.json({ success: true, data: types, count: types.length });
  } catch (error: any) {
    handleError(res, error, 'fetching time off types');
  }
};

export const createTimeOffType = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = await timeOffService.createTimeOffType(req.body, req.user!);
    res.status(201).json({ success: true, data: type });
  } catch (error: any) {
    handleError(res, error, 'creating time off type');
  }
};

export const updateTimeOffType = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = await timeOffService.updateTimeOffType(req.params.id as string, req.body, req.user!);
    res.json({ success: true, data: type });
  } catch (error: any) {
    handleError(res, error, 'updating time off type');
  }
};

export const deleteTimeOffType = async (req: Request, res: Response): Promise<void> => {
  try {
    await timeOffService.deleteTimeOffType(req.params.id as string, req.user!);
    res.json({ success: true, message: 'Time off type deleted' });
  } catch (error: any) {
    handleError(res, error, 'deleting time off type');
  }
};

// ========== LEAVE ALLOCATIONS ==========
export const getAllAllocations = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      employeeId: req.query.employeeId as string | undefined,
      timeOffTypeId: req.query.timeOffTypeId as string | undefined,
      status: req.query.status as string | undefined,
    };
    const allocations = await timeOffService.getAllAllocations(filters);
    res.json({ success: true, data: allocations, count: allocations.length });
  } catch (error: any) {
    handleError(res, error, 'fetching allocations');
  }
};

export const getMyAllocations = async (req: Request, res: Response): Promise<void> => {
  try {
    let employeeId = req.user?.employeeId;
    if (!employeeId) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { employee: true } });
      employeeId = user?.employee?.id;
    }
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee record linked to this account' });
      return;
    }
    const allocations = await timeOffService.getMyAllocations(employeeId);
    res.json({ success: true, data: allocations });
  } catch (error: any) {
    handleError(res, error, 'fetching my allocations');
  }
};

export const createAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const allocation = await timeOffService.createAllocation(req.body, req.user!);
    res.status(201).json({ success: true, data: allocation });
  } catch (error: any) {
    handleError(res, error, 'creating allocation');
  }
};

export const approveAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const allocation = await timeOffService.approveAllocation(req.params.id as string, req.user!);
    res.json({ success: true, data: allocation });
  } catch (error: any) {
    handleError(res, error, 'approving allocation');
  }
};

export const updateAllocation = async (req: Request, res: Response): Promise<void> => {
  try {
    const allocation = await timeOffService.updateAllocation(req.params.id as string, req.body, req.user!);
    res.json({ success: true, data: allocation });
  } catch (error: any) {
    handleError(res, error, 'updating allocation');
  }
};

// ========== LEAVE REQUESTS ==========
export const getAllRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      employeeId: req.query.employeeId as string | undefined,
      status: req.query.status as string | undefined,
      timeOffTypeId: req.query.timeOffTypeId as string | undefined,
    };
    const requests = await timeOffService.getAllRequests(filters);
    res.json({ success: true, data: requests, count: requests.length });
  } catch (error: any) {
    handleError(res, error, 'fetching requests');
  }
};

export const getMyRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    let employeeId = req.user?.employeeId;
    if (!employeeId) {
      const user = await prisma.user.findUnique({ where: { id: req.user!.userId }, include: { employee: true } });
      employeeId = user?.employee?.id;
    }
    if (!employeeId) {
      res.status(400).json({ success: false, message: 'No employee record linked to this account' });
      return;
    }
    const requests = await timeOffService.getMyRequests(employeeId);
    res.json({ success: true, data: requests });
  } catch (error: any) {
    handleError(res, error, 'fetching my requests');
  }
};

export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await timeOffService.createRequest(req.body, req.user!);
    res.status(201).json({ success: true, data: request });
  } catch (error: any) {
    handleError(res, error, 'creating leave request');
  }
};

export const approveRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewNotes } = req.body;
    const request = await timeOffService.reviewRequest(req.params.id as string, true, reviewNotes, req.user!);
    res.json({ success: true, data: request });
  } catch (error: any) {
    handleError(res, error, 'approving leave request');
  }
};

export const refuseRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reviewNotes } = req.body;
    const request = await timeOffService.reviewRequest(req.params.id as string, false, reviewNotes, req.user!);
    res.json({ success: true, data: request });
  } catch (error: any) {
    handleError(res, error, 'refusing leave request');
  }
};

export const cancelRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const request = await timeOffService.cancelRequest(req.params.id as string, req.user!);
    res.json({ success: true, data: request });
  } catch (error: any) {
    handleError(res, error, 'cancelling leave request');
  }
};

function handleError(res: Response, error: any, context: string) {
  if (error.status) {
    res.status(error.status).json({ success: false, message: error.message });
    return;
  }
  console.error(`Error ${context}:`, error);
  res.status(500).json({ success: false, message: `Failed ${context}` });
}
