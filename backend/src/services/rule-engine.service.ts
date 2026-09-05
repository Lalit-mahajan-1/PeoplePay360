import { PayrollInputs, RuleExecutionContext, PayslipLineResult } from '../types';

/**
 * The Rule Engine executes salary rules in sequence order.
 * Each rule reads from an inputSource, computes a value, and stores it
 * in the context so later rules can reference earlier results.
 *
 * SCENARIOS COVERED:
 * A) Fixed monthly    → BASE_SALARY input, FIXED computation
 * B) Hourly           → WORKED_HOURS input, FORMULA computation
 * C) Unpaid absence   → UNPAID_LEAVE_DAYS input, FORMULA computation
 * D) Overtime         → OVERTIME_HOURS input, FORMULA computation
 * E) Late deduction   → LATE_HOURS input, FORMULA computation
 * F) Missing checkout → Handled as WARNING, not a rule
 * G) Holiday work     → HOLIDAY_HOURS input, FORMULA computation
 * H) Paid/Unpaid leave→ PAID_LEAVE_DAYS / UNPAID_LEAVE_DAYS
 */
export class RuleEngineService {
    /**
     * Execute all rules in sequence and return payslip lines + totals.
     */
    execute(
        inputs: PayrollInputs,
        rules: Array<{
            salaryRule: {
                id: string;
                code: string;
                name: string;
                category: string;
                computationType: string;
                inputSource: string;
                fixedAmount: any;
                percentage: any;
                formula: string | null;
            };
            sequence: number;
        }>
    ): {
        lines: PayslipLineResult[];
        basicAmount: number;
        allowanceAmount: number;
        deductionAmount: number;
        grossAmount: number;
        netAmount: number;
    } {
        const context: RuleExecutionContext = {
            inputs,
            computedValues: {},
            lines: [],
        };

        // Sort rules by sequence (should already be sorted, but ensure)
        const sortedRules = [...rules].sort((a, b) => a.sequence - b.sequence);

        for (const rule of sortedRules) {
            const sr = rule.salaryRule;
            const result = this.executeSingleRule(sr, rule.sequence, context);
            if (result) {
                context.lines.push(result);
                // Store computed value so later rules can reference it
                context.computedValues[sr.code] = result.amount;
            }
        }

        // Calculate totals from lines
        const basicAmount = this.sumByCategory(context.lines, 'BASIC');
        const allowanceAmount = this.sumByCategory(context.lines, 'ALLOWANCE');
        const deductionAmount = this.sumByCategory(context.lines, 'DEDUCTION');
        const employerContribution = this.sumByCategory(context.lines, 'EMPLOYER_CONTRIBUTION');

        // Gross = Basic + Allowances (or use GROSS category line if defined)
        const grossLine = context.lines.find((l) => l.category === 'GROSS');
        const grossAmount = grossLine
            ? grossLine.amount
            : basicAmount + allowanceAmount;

        // Net = Gross - Deductions (or use NET category line if defined)
        const netLine = context.lines.find((l) => l.category === 'NET');
        const netAmount = netLine
            ? netLine.amount
            : grossAmount - deductionAmount;

        return {
            lines: context.lines,
            basicAmount: this.round(basicAmount),
            allowanceAmount: this.round(allowanceAmount),
            deductionAmount: this.round(deductionAmount),
            grossAmount: this.round(grossAmount),
            netAmount: this.round(netAmount),
        };
    }

    /**
     * Execute a single salary rule.
     */
    private executeSingleRule(
        rule: {
            id: string;
            code: string;
            name: string;
            category: string;
            computationType: string;
            inputSource: string;
            fixedAmount: any;
            percentage: any;
            formula: string | null;
        },
        sequence: number,
        context: RuleExecutionContext
    ): PayslipLineResult | null {
        const input = context.inputs;
        let amount = 0;
        let explanation = '';

        // ── Step 1: Resolve the input value ──
        const inputValue = this.resolveInputSource(rule.inputSource, context);

        // ── Step 2: Compute based on type ──
        switch (rule.computationType) {
            case 'FIXED': {
                amount = Number(rule.fixedAmount) || 0;
                explanation = `Fixed: ₹${this.fmt(amount)}`;
                break;
            }

            case 'PERCENTAGE': {
                const pct = Number(rule.percentage) || 0;
                amount = (inputValue * pct) / 100;
                explanation = `${pct}% of ${rule.inputSource} (₹${this.fmt(inputValue)}) = ₹${this.fmt(amount)}`;
                break;
            }

            case 'FORMULA': {
                amount = this.evaluateFormula(rule.formula || '', context);
                explanation = this.buildFormulaExplanation(rule.formula || '', context, amount);
                break;
            }

            default:
                return null;
        }

        // Round to 2 decimal places
        amount = this.round(amount);

        return {
            salaryRuleId: rule.id,
            code: rule.code,
            name: rule.name,
            category: rule.category,
            sequence,
            amount,
            explanation,
        };
    }

    /**
     * Resolve what numeric value an inputSource refers to.
     */
    private resolveInputSource(
        source: string,
        context: RuleExecutionContext
    ): number {
        const inputs = context.inputs;
        const computed = context.computedValues;

        switch (source) {
            // ── Contract values ──
            case 'BASE_SALARY':
                return inputs.contractWage;

            // ── Previously computed rule values ──
            case 'BASIC':
                return computed['BASIC'] || this.sumByCategory(context.lines, 'BASIC');
            case 'GROSS':
                return computed['GROSS'] || this.sumByCategory(context.lines, 'BASIC') + this.sumByCategory(context.lines, 'ALLOWANCE');
            case 'NET':
                return computed['NET'] || 0;

            // ── Attendance values ──
            case 'OVERTIME_HOURS':
                return inputs.overtimeHours;
            case 'LATE_HOURS':
                return inputs.lateHours;
            case 'ABSENT_DAYS':
                return inputs.absentDays;
            case 'WORKED_HOURS':
                return inputs.workedHours;
            case 'EXPECTED_HOURS':
                return inputs.expectedHoursPerMonth;
            case 'HOLIDAY_HOURS':
                return inputs.holidayHours;
            case 'WORKED_DAYS':
                return inputs.workedDays;
            case 'EXPECTED_DAYS':
                return inputs.expectedDaysPerMonth;

            // ── Leave values ──
            case 'PAID_LEAVE_DAYS':
                return inputs.paidLeaveDays;
            case 'UNPAID_LEAVE_DAYS':
                return inputs.unpaidLeaveDays;

            // ── No input ──
            case 'NONE':
            default:
                return 0;
        }
    }

    /**
     * Safely evaluate a formula string.
     *
     * Supported variables in formulas:
     *   BASE_SALARY, BASIC, GROSS, NET,
     *   OVERTIME_HOURS, LATE_HOURS, ABSENT_DAYS,
     *   WORKED_HOURS, EXPECTED_HOURS, HOLIDAY_HOURS,
     *   PAID_LEAVE_DAYS, UNPAID_LEAVE_DAYS,
     *   WORKED_DAYS, EXPECTED_DAYS,
     *   HOURLY_RATE, DAILY_RATE
     *
     * Example formulas:
     *   "OVERTIME_HOURS * HOURLY_RATE * 1.5"
     *   "UNPAID_LEAVE_DAYS * DAILY_RATE"
     *   "HOLIDAY_HOURS * HOURLY_RATE * 2"
     *   "LATE_HOURS * HOURLY_RATE"
     *   "WORKED_HOURS * HOURLY_RATE"
     */
    private evaluateFormula(
        formula: string,
        context: RuleExecutionContext
    ): number {
        if (!formula || formula.trim() === '') return 0;

        try {
            const inputs = context.inputs;
            const computed = context.computedValues;

            // Build variable map
            const vars: Record<string, number> = {
                BASE_SALARY: inputs.contractWage,
                BASIC: computed['BASIC'] || this.sumByCategory(context.lines, 'BASIC'),
                GROSS: computed['GROSS'] || this.sumByCategory(context.lines, 'BASIC') + this.sumByCategory(context.lines, 'ALLOWANCE'),
                NET: computed['NET'] || 0,
                OVERTIME_HOURS: inputs.overtimeHours,
                LATE_HOURS: inputs.lateHours,
                ABSENT_DAYS: inputs.absentDays,
                WORKED_HOURS: inputs.workedHours,
                EXPECTED_HOURS: inputs.expectedHoursPerMonth,
                HOLIDAY_HOURS: inputs.holidayHours,
                PAID_LEAVE_DAYS: inputs.paidLeaveDays,
                UNPAID_LEAVE_DAYS: inputs.unpaidLeaveDays,
                WORKED_DAYS: inputs.workedDays,
                EXPECTED_DAYS: inputs.expectedDaysPerMonth,
                HOURLY_RATE: inputs.hourlyRate,
                DAILY_RATE: inputs.dailyRate,
            };

            // Replace variable names with their values
            let expression = formula;

            // Sort by length descending to avoid partial replacements
            // e.g., EXPECTED_HOURS before EXPECTED_DAYS before EXPECTED
            const sortedKeys = Object.keys(vars).sort(
                (a, b) => b.length - a.length
            );

            for (const key of sortedKeys) {
                const regex = new RegExp(`\\b${key}\\b`, 'g');
                expression = expression.replace(regex, String(vars[key]));
            }

            // Also replace any previously computed rule codes
            for (const [code, value] of Object.entries(computed)) {
                const regex = new RegExp(`\\b${code}\\b`, 'g');
                expression = expression.replace(regex, String(value));
            }

            // Safety: only allow numbers, operators, parentheses, dots, spaces
            if (!/^[\d\s+\-*/().]+$/.test(expression)) {
                console.error(`Unsafe formula expression: ${expression}`);
                return 0;
            }

            // Evaluate
            const result = Function(`"use strict"; return (${expression})`)();
            return typeof result === 'number' && isFinite(result) ? result : 0;
        } catch (error) {
            console.error(`Formula evaluation error: ${formula}`, error);
            return 0;
        }
    }

    /**
     * Build a human-readable explanation of a formula.
     */
    private buildFormulaExplanation(
        formula: string,
        context: RuleExecutionContext,
        result: number
    ): string {
        const inputs = context.inputs;
        const computed = context.computedValues;

        const vars: Record<string, number> = {
            BASE_SALARY: inputs.contractWage,
            BASIC: computed['BASIC'] || this.sumByCategory(context.lines, 'BASIC'),
            GROSS: computed['GROSS'] || 0,
            OVERTIME_HOURS: inputs.overtimeHours,
            LATE_HOURS: inputs.lateHours,
            ABSENT_DAYS: inputs.absentDays,
            WORKED_HOURS: inputs.workedHours,
            EXPECTED_HOURS: inputs.expectedHoursPerMonth,
            HOLIDAY_HOURS: inputs.holidayHours,
            PAID_LEAVE_DAYS: inputs.paidLeaveDays,
            UNPAID_LEAVE_DAYS: inputs.unpaidLeaveDays,
            WORKED_DAYS: inputs.workedDays,
            EXPECTED_DAYS: inputs.expectedDaysPerMonth,
            HOURLY_RATE: inputs.hourlyRate,
            DAILY_RATE: inputs.dailyRate,
        };

        let explanation = formula;
        const sortedKeys = Object.keys(vars).sort((a, b) => b.length - a.length);

        for (const key of sortedKeys) {
            const regex = new RegExp(`\\b${key}\\b`, 'g');
            explanation = explanation.replace(regex, `${vars[key]}`);
        }

        for (const [code, value] of Object.entries(computed)) {
            const regex = new RegExp(`\\b${code}\\b`, 'g');
            explanation = explanation.replace(regex, String(value));
        }

        return `${formula} → ${explanation} = ₹${this.fmt(result)}`;
    }

    // ── Helpers ──

    private sumByCategory(
        lines: PayslipLineResult[],
        category: string
    ): number {
        return lines
            .filter((l) => l.category === category)
            .reduce((sum, l) => sum + l.amount, 0);
    }

    private round(n: number): number {
        return Math.round(n * 100) / 100;
    }

    private fmt(n: number): string {
        return Number(n).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
}

export const ruleEngine = new RuleEngineService();