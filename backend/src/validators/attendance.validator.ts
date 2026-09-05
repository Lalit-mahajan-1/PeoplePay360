import { Request, Response, NextFunction } from 'express';

export const validateCorrection = (req: Request, res: Response, next: NextFunction): void => {
  const { checkIn, checkOut, status, workedMinutes, overtimeMinutes } = req.body;

  const errors: string[] = [];

  if (checkIn && isNaN(Date.parse(checkIn))) {
    errors.push('Invalid checkIn date format');
  }

  if (checkOut && isNaN(Date.parse(checkOut))) {
    errors.push('Invalid checkOut date format');
  }

  if (checkIn && checkOut && new Date(checkIn) >= new Date(checkOut)) {
    errors.push('checkIn must be before checkOut');
  }

  if (status && !['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND'].includes(status)) {
    errors.push('Invalid attendance status');
  }

  if (workedMinutes !== undefined && (typeof workedMinutes !== 'number' || workedMinutes < 0)) {
    errors.push('workedMinutes must be a non-negative number');
  }

  if (overtimeMinutes !== undefined && (typeof overtimeMinutes !== 'number' || overtimeMinutes < 0)) {
    errors.push('overtimeMinutes must be a non-negative number');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
};

export const validateBulkMark = (req: Request, res: Response, next: NextFunction): void => {
  const { workDate, employeeIds, status } = req.body;

  const errors: string[] = [];

  if (!workDate) errors.push('workDate is required');
  else if (isNaN(Date.parse(workDate))) errors.push('Invalid workDate format');

  if (!employeeIds) errors.push('employeeIds is required');
  else if (!Array.isArray(employeeIds) || employeeIds.length === 0) errors.push('employeeIds must be a non-empty array');

  if (!status) errors.push('status is required');
  else if (!['PRESENT', 'LATE', 'ABSENT', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY', 'WEEKEND'].includes(status)) {
    errors.push('Invalid attendance status');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
};

export const validateMedicalAbsence = (req: Request, res: Response, next: NextFunction): void => {
  const { employeeId, workDate, notes } = req.body;

  const errors: string[] = [];

  if (!employeeId) errors.push('employeeId is required');
  if (!workDate) errors.push('workDate is required');
  else if (isNaN(Date.parse(workDate))) errors.push('Invalid workDate format');
  if (!notes || !notes.trim()) errors.push('notes is required for medical absence');

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
};

export const validateCloseDay = (req: Request, res: Response, next: NextFunction): void => {
  const { workDate } = req.body;

  const errors: string[] = [];

  if (workDate && isNaN(Date.parse(workDate))) {
    errors.push('Invalid workDate format');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
};
