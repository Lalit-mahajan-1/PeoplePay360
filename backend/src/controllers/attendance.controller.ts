import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';

// ──────────────────────────────────────────────
//  EMPLOYEE SELF-SERVICE
// ──────────────────────────────────────────────

export const getTodayAttendance = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const data = await attendanceService.getToday(req.user!);
        res.json({ success: true, data });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Error fetching today attendance:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
    }
};

export const checkIn = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const record = await attendanceService.checkIn(req.user!);
        res.status(201).json({ success: true, data: record });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Check-in error:', error);
        res.status(500).json({ success: false, message: 'Check-in failed' });
    }
};

export const checkOut = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const record = await attendanceService.checkOut(req.user!);
        res.json({ success: true, data: record });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Check-out error:', error);
        res.status(500).json({ success: false, message: 'Check-out failed' });
    }
};

export const getMySummary = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const month = req.query.month as string | undefined;
        const data = await attendanceService.getMySummary(req.user!, month);
        res.json({ success: true, data });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Error fetching summary:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch summary' });
    }
};

export const getMyHistory = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const filters = {
            month: req.query.month as string | undefined,
            status: req.query.status as string | undefined,
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
        };
        const data = await attendanceService.getMyHistory(req.user!, filters);
        res.json({ success: true, ...data });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Error fetching history:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch history' });
    }
};

// ──────────────────────────────────────────────
//  HR / ADMIN MANAGEMENT
// ──────────────────────────────────────────────

export const getAllAttendance = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const filters = {
            employeeId: req.query.employeeId as string | undefined,
            departmentId: req.query.departmentId as string | undefined,
            search: req.query.search as string | undefined,
            date: req.query.date as string | undefined,
            from: req.query.from as string | undefined,
            to: req.query.to as string | undefined,
            status: req.query.status as string | undefined,
            page: req.query.page ? Number(req.query.page) : undefined,
            limit: req.query.limit ? Number(req.query.limit) : undefined,
        };
        const data = await attendanceService.getAll(filters);
        res.json({ success: true, ...data });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Error fetching attendance:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
    }
};

export const getAttendanceById = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const record = await attendanceService.getById(id);
        res.json({ success: true, data: record });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Error fetching attendance record:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch record' });
    }
};

export const correctAttendance = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const id = req.params.id as string;
        const record = await attendanceService.correct(id, req.body, req.user!);
        res.json({ success: true, data: record });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Error correcting attendance:', error);
        res.status(500).json({ success: false, message: 'Failed to correct attendance' });
    }
};

export const bulkMarkAttendance = async (
    req: Request,
    res: Response
): Promise<void> => {
    try {
        const { workDate, employeeIds, status, notes } = req.body;

        if (!workDate || !employeeIds?.length || !status) {
            res.status(400).json({
                success: false,
                message: 'workDate, employeeIds[], and status are required',
            });
            return;
        }

        const result = await attendanceService.bulkMark(
            { workDate, employeeIds, status, notes },
            req.user!
        );
        res.json({ success: true, data: result });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Bulk mark error:', error);
        res.status(500).json({ success: false, message: 'Bulk mark failed' });
    }
};

export const deleteAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        await attendanceService.delete(req.params.id as string, req.user!);
        res.status(204).send();
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Error deleting attendance:', error);
        res.status(500).json({ success: false, message: 'Failed to delete attendance' });
    }
};

export const createMedicalAbsence = async (req: Request, res: Response): Promise<void> => {
    try {
        const record = await attendanceService.createMedicalAbsence(req.body, req.user!);
        res.status(201).json({ success: true, data: record });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('Medical absence error:', error);
        res.status(500).json({ success: false, message: 'Failed to record medical absence' });
    }
};

export const closeAttendanceDay = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await attendanceService.closeDay(req.body.workDate, req.user!);
        res.json({ success: true, data: result });
    } catch (error: any) {
        if (error.status) {
            res.status(error.status).json({ success: false, message: error.message });
            return;
        }
        console.error('End-of-day attendance error:', error);
        res.status(500).json({ success: false, message: 'Failed to close attendance day' });
    }
};
