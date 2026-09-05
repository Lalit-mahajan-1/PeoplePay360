import { Request, Response } from 'express';
import { workingScheduleService } from '../services/working-schedule.service';

export const getAllWorkingSchedules = async (req: Request, res: Response): Promise<void> => {
  try {
    const includeInactive = req.query.includeInactive === 'true';
    const schedules = await workingScheduleService.getAll(includeInactive);
    res.json({ success: true, data: schedules, count: schedules.length });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error fetching schedules:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch working schedules' });
  }
};

export const getWorkingScheduleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await workingScheduleService.getById(req.params.id as string);
    if (!schedule) {
      res.status(404).json({ success: false, message: 'Working schedule not found' });
      return;
    }
    res.json({ success: true, data: schedule });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error fetching schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch working schedule' });
  }
};

export const createWorkingSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await workingScheduleService.create(req.body, req.user!);
    res.status(201).json({ success: true, data: schedule });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error creating schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to create working schedule' });
  }
};

export const updateWorkingSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    const schedule = await workingScheduleService.update(req.params.id as string, req.body, req.user!);
    res.json({ success: true, data: schedule });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error updating schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to update working schedule' });
  }
};

export const deleteWorkingSchedule = async (req: Request, res: Response): Promise<void> => {
  try {
    await workingScheduleService.delete(req.params.id as string, req.user!);
    res.json({ success: true, message: 'Working schedule deleted successfully' });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ success: false, message: error.message });
      return;
    }
    console.error('Error deleting schedule:', error);
    res.status(500).json({ success: false, message: 'Failed to delete working schedule' });
  }
};
