import { Request, Response, NextFunction } from 'express';

const VALID_STATUSES = [
    'PRESENT',
    'LATE',
    'ABSENT',
    'HALF_DAY',
    'ON_LEAVE',
    'HOLIDAY',
    'WEEKEND',
];

export const validateCorrection = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: string[] = [];
    const { checkIn, checkOut, status, workedMinutes, overtimeMinutes, notes } = req.body;

    if (typeof notes !== 'string' || !notes.trim()) {
        errors.push('notes are required for an attendance correction');
    }

    if (checkIn && isNaN(Date.parse(checkIn))) {
        errors.push('checkIn must be a valid date/time string');
    }

    if (checkOut && isNaN(Date.parse(checkOut))) {
        errors.push('checkOut must be a valid date/time string');
    }

    if (checkIn && checkOut) {
        if (new Date(checkOut) <= new Date(checkIn)) {
            errors.push('checkOut must be after checkIn');
        }
    }

    if (status && !VALID_STATUSES.includes(status)) {
        errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (workedMinutes !== undefined) {
        if (typeof workedMinutes !== 'number' || workedMinutes < 0) {
            errors.push('workedMinutes must be a non-negative number');
        }
    }

    if (overtimeMinutes !== undefined && (typeof overtimeMinutes !== 'number' || overtimeMinutes < 0)) {
        errors.push('overtimeMinutes must be a non-negative number');
    }

    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
        return;
    }

    next();
};

export const validateBulkMark = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: string[] = [];
    const { workDate, employeeIds, status } = req.body;

    if (!workDate || isNaN(Date.parse(workDate))) {
        errors.push('workDate is required and must be a valid date');
    }

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        errors.push('employeeIds must be a non-empty array');
    }

    if (!status || !VALID_STATUSES.includes(status)) {
        errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
    }

    if (errors.length > 0) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
        });
        return;
    }

    next();
};

export const validateMedicalAbsence = (req: Request, res: Response, next: NextFunction): void => {
    const { employeeId, workDate, notes } = req.body;
    const errors: string[] = [];
    if (typeof employeeId !== 'string' || !employeeId.trim()) errors.push('employeeId is required');
    if (!workDate || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) errors.push('workDate must be YYYY-MM-DD');
    if (typeof notes !== 'string' || !notes.trim()) errors.push('notes are required for a medical absence');
    if (errors.length) {
        res.status(400).json({ success: false, message: 'Validation failed', errors });
        return;
    }
    next();
};

export const validateCloseDay = (req: Request, res: Response, next: NextFunction): void => {
    const { workDate } = req.body;
    if (workDate !== undefined && (typeof workDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(workDate))) {
        res.status(400).json({ success: false, message: 'workDate must be YYYY-MM-DD' });
        return;
    }
    next();
};
