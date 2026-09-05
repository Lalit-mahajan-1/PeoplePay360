import { Request, Response, NextFunction } from 'express';

export const validateCreateEmployee = (req: Request, res: Response, next: NextFunction): void => {
  const { employeeCode, firstName, lastName, email } = req.body;

  const errors: string[] = [];

  if (!employeeCode || !employeeCode.trim()) errors.push('employeeCode is required');
  if (!firstName || !firstName.trim()) errors.push('firstName is required');
  if (!lastName || !lastName.trim()) errors.push('lastName is required');
  if (!email || !email.trim()) {
    errors.push('email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Invalid email format');
  }

  if (req.body.gender && !['MALE', 'FEMALE', 'OTHER'].includes(req.body.gender)) {
    errors.push('Invalid gender value');
  }

  if (req.body.status && !['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(req.body.status)) {
    errors.push('Invalid employee status');
  }

  if (req.body.employeeType && !['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].includes(req.body.employeeType)) {
    errors.push('Invalid employeeType value');
  }

  if (req.body.jobProfile && !['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'].includes(req.body.jobProfile)) {
    errors.push('Invalid jobProfile value');
  }

  if (req.body.dateOfBirth && isNaN(Date.parse(req.body.dateOfBirth))) {
    errors.push('Invalid dateOfBirth format');
  }

  if (req.body.hireDate && isNaN(Date.parse(req.body.hireDate))) {
    errors.push('Invalid hireDate format');
  }

  if (req.body.phone && typeof req.body.phone !== 'string') {
    errors.push('phone must be a string');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
};

export const validateUpdateEmployee = (req: Request, res: Response, next: NextFunction): void => {
  const { email, gender, status, employeeType, jobProfile, dateOfBirth, hireDate, phone } = req.body;

  const errors: string[] = [];

  if (email !== undefined) {
    if (!email.trim()) errors.push('email cannot be empty');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');
  }

  if (gender !== undefined && !['MALE', 'FEMALE', 'OTHER'].includes(gender)) {
    errors.push('Invalid gender value');
  }

  if (status !== undefined && !['ACTIVE', 'INACTIVE', 'ARCHIVED'].includes(status)) {
    errors.push('Invalid employee status');
  }

  if (employeeType !== undefined && !['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'].includes(employeeType)) {
    errors.push('Invalid employeeType value');
  }

  if (jobProfile !== undefined && !['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN'].includes(jobProfile)) {
    errors.push('Invalid jobProfile value');
  }

  if (dateOfBirth !== undefined && isNaN(Date.parse(dateOfBirth))) {
    errors.push('Invalid dateOfBirth format');
  }

  if (hireDate !== undefined && isNaN(Date.parse(hireDate))) {
    errors.push('Invalid hireDate format');
  }

  if (phone !== undefined && typeof phone !== 'string') {
    errors.push('phone must be a string');
  }

  if (errors.length > 0) {
    res.status(400).json({ success: false, message: 'Validation failed', errors });
    return;
  }

  next();
};
