import { Request, Response, NextFunction } from 'express';

export const validateCreatePayrun = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: string[] = [];
    const { name, salaryStructureId, periodStart, periodEnd, employeeIds } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        errors.push('Payrun name is required');
    }

    if (!salaryStructureId || typeof salaryStructureId !== 'string') {
        errors.push('salaryStructureId is required');
    }

    if (!periodStart || isNaN(Date.parse(periodStart))) {
        errors.push('periodStart is required and must be a valid date');
    }

    if (!periodEnd || isNaN(Date.parse(periodEnd))) {
        errors.push('periodEnd is required and must be a valid date');
    }

    if (periodStart && periodEnd && new Date(periodStart) >= new Date(periodEnd)) {
        errors.push('periodEnd must be after periodStart');
    }

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
        errors.push('employeeIds must be a non-empty array');
    }

    if (errors.length > 0) {
        res.status(400).json({ success: false, message: 'Validation failed', errors });
        return;
    }

    next();
};