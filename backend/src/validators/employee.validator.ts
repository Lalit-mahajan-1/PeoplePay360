import { Request, Response, NextFunction } from 'express';

export const validateCreateEmployee = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { employeeCode, firstName, lastName, email, employeeType, status, gender } = req.body;

  if (!employeeCode || typeof employeeCode !== 'string' || employeeCode.trim() === '') {
    errors.push('Employee code is required');
  }

  if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
    errors.push('First name is required');
  }

  if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
    errors.push('Last name is required');
  }

  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }

  const validTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
  if (employeeType && !validTypes.includes(employeeType)) {
    errors.push(`Employee type must be one of: ${validTypes.join(', ')}`);
  }

  const validStatuses = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const validGenders = ['MALE', 'FEMALE', 'OTHER'];
  if (gender && !validGenders.includes(gender)) {
    errors.push(`Gender must be one of: ${validGenders.join(', ')}`);
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

export const validateUpdateEmployee = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors: string[] = [];
  const { email, employeeType, status, gender } = req.body;

  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }
  }

  const validTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'];
  if (employeeType && !validTypes.includes(employeeType)) {
    errors.push(`Employee type must be one of: ${validTypes.join(', ')}`);
  }

  const validStatuses = ['ACTIVE', 'INACTIVE', 'ARCHIVED'];
  if (status && !validStatuses.includes(status)) {
    errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
  }

  const validGenders = ['MALE', 'FEMALE', 'OTHER'];
  if (gender && !validGenders.includes(gender)) {
    errors.push(`Gender must be one of: ${validGenders.join(', ')}`);
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