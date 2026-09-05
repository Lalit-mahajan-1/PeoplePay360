import { Request, Response } from 'express';
import { contractService } from '../services/contract.service';

export const getAllContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = {
      employeeId: req.query.employeeId as string | undefined,
      status: req.query.status as string | undefined,
      departmentId: req.query.departmentId as string | undefined,
    };
    const contracts = await contractService.getAll(filters);
    res.json({ success: true, data: contracts, count: contracts.length });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error fetching contracts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contracts' });
  }
};

export const getContractById = async (req: Request, res: Response): Promise<void> => {
  try {
    const contract = await contractService.getById(req.params.id as string);
    if (!contract) {
      res.status(404).json({ success: false, message: 'Contract not found' });
      return;
    }
    res.json({ success: true, data: contract });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error fetching contract:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contract' });
  }
};

export const createContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const contract = await contractService.create(req.body, req.user!);
    res.status(201).json({ success: true, data: contract });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error creating contract:', error);
    res.status(500).json({ success: false, message: 'Failed to create contract' });
  }
};

export const updateContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const contract = await contractService.update(req.params.id as string, req.body, req.user!);
    res.json({ success: true, data: contract });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error updating contract:', error);
    res.status(500).json({ success: false, message: 'Failed to update contract' });
  }
};

export const deleteContract = async (req: Request, res: Response): Promise<void> => {
  try {
    await contractService.delete(req.params.id as string, req.user!);
    res.json({ success: true, message: 'Contract deleted successfully' });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error deleting contract:', error);
    res.status(500).json({ success: false, message: 'Failed to delete contract' });
  }
};

export const getActiveContractForEmployee = async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const periodDate = req.query.periodDate as string | undefined;
    const contract = await contractService.getActiveForEmployee(employeeId as string, periodDate);
    if (!contract) {
      res.status(404).json({ success: false, message: 'No active contract found for this period' });
      return;
    }
    res.json({ success: true, data: contract });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error fetching active contract:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch active contract' });
  }
};
