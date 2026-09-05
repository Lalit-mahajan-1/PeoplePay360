import { Request, Response, NextFunction } from 'express';

const VALID_CATEGORIES = [
    'BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION',
    'EMPLOYER_CONTRIBUTION', 'NET',
];

const VALID_COMPUTATIONS = ['FIXED', 'PERCENTAGE', 'FORMULA'];

const VALID_INPUT_SOURCES = [
    'NONE', 'BASE_SALARY', 'BASIC', 'GROSS', 'NET',
    'OVERTIME_HOURS', 'LATE_HOURS', 'ABSENT_DAYS',
    'WORKED_HOURS', 'EXPECTED_HOURS', 'HOLIDAY_HOURS',
    'PAID_LEAVE_DAYS', 'UNPAID_LEAVE_DAYS',
    'WORKED_DAYS', 'EXPECTED_DAYS',
];

export const validateSalaryRule = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: string[] = [];
    const { name, code, category, computationType, inputSource, fixedAmount, percentage, formula, sequence } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        errors.push('Rule name is required');
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
        errors.push('Rule code is required');
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
        errors.push(`category must be one of: ${VALID_CATEGORIES.join(', ')}`);
    }

    if (!computationType || !VALID_COMPUTATIONS.includes(computationType)) {
        errors.push(`computationType must be one of: ${VALID_COMPUTATIONS.join(', ')}`);
    }

    if (inputSource && !VALID_INPUT_SOURCES.includes(inputSource)) {
        errors.push(`inputSource must be one of: ${VALID_INPUT_SOURCES.join(', ')}`);
    }

    if (computationType === 'FIXED') {
        if (fixedAmount === undefined || fixedAmount === null) {
            errors.push('fixedAmount is required when computationType is FIXED');
        }
    }

    if (computationType === 'PERCENTAGE') {
        if (percentage === undefined || percentage === null) {
            errors.push('percentage is required when computationType is PERCENTAGE');
        }
        if (!inputSource || inputSource === 'NONE') {
            errors.push('inputSource is required when computationType is PERCENTAGE (what is the percentage of?)');
        }
    }

    if (computationType === 'FORMULA') {
        if (!formula || typeof formula !== 'string') {
            errors.push('formula string is required when computationType is FORMULA');
        }
    }

    if (errors.length > 0) {
        res.status(400).json({ success: false, message: 'Validation failed', errors });
        return;
    }

    next();
};

export const validateSalaryStructure = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const errors: string[] = [];
    const { name, code, rules } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
        errors.push('Structure name is required');
    }

    if (!code || typeof code !== 'string' || code.trim() === '') {
        errors.push('Structure code is required');
    }

    if (rules && !Array.isArray(rules)) {
        errors.push('rules must be an array of { salaryRuleId, sequence }');
    }

    if (errors.length > 0) {
        res.status(400).json({ success: false, message: 'Validation failed', errors });
        return;
    }

    next();
};