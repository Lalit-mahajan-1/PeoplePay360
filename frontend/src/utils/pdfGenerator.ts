import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const fmt = (n: number | string | null | undefined) => {
    const num = Number(n || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (dStr: string | undefined) => {
    if (!dStr) return '-';
    try {
        const d = new Date(dStr);
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return dStr;
    }
};

/**
 * Downloads a crisp PDF payslip statement using jsPDF and html2canvas.
 * If targetElement is provided, captures that DOM node. Otherwise, creates a hidden clean payslip template.
 */
export async function downloadPayslipPDF(payslip: any, elementId?: string) {
    const toastId = toast.loading('Generating PDF payslip statement...');
    try {
        let elementToCapture: HTMLElement | null = null;
        let tempContainer: HTMLElement | null = null;

        if (elementId) {
            elementToCapture = document.getElementById(elementId);
        }

        if (!elementToCapture) {
            // Create temporary styled printable DOM container
            tempContainer = document.createElement('div');
            tempContainer.style.position = 'fixed';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '0';
            tempContainer.style.width = '800px';
            tempContainer.style.backgroundColor = '#ffffff';
            tempContainer.style.color = '#0f172a';
            tempContainer.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            tempContainer.style.padding = '32px';
            tempContainer.style.boxSizing = 'border-box';

            const emp = payslip.employee || {};
            const contract = payslip.contract || {};
            const lines: any[] = payslip.lines || [];
            const earnings = lines.filter((l) => ['BASIC', 'ALLOWANCE', 'EMPLOYER_CONTRIBUTION'].includes(l.category));
            const deductions = lines.filter((l) => l.category === 'DEDUCTION');

            const grossCalculated = Number(payslip.grossAmount) || earnings.reduce((sum, l) => sum + Number(l.amount || 0), 0);
            const deductionTotal = Number(payslip.deductionAmount) || deductions.reduce((sum, l) => sum + Number(l.amount || 0), 0);
            const netCalculated = Number(payslip.netAmount) || grossCalculated - deductionTotal;

            tempContainer.innerHTML = `
                <div style="border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background: #ffffff;">
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e293b 100%); color: #ffffff; padding: 24px; display: flex; justify-content: space-between; align-items: flex-start;">
                        <div>
                            <div style="display: inline-block; padding: 4px 12px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 8px;">
                                PEOPLEPAY360 · SALARY STATEMENT
                            </div>
                            <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">Payslip Statement</h1>
                            <div style="font-size: 12px; color: #cbd5e1; margin-top: 4px;">
                                Pay Period: ${fmtDate(payslip.periodStart)} to ${fmtDate(payslip.periodEnd)}
                            </div>
                        </div>
                        <div style="text-align: right;">
                            <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">Net Salary Payable</div>
                            <div style="font-size: 28px; font-weight: 900; color: #38bdf8;">${fmt(netCalculated)}</div>
                            <div style="font-size: 11px; margin-top: 4px; color: #cbd5e1;">Status: <strong style="color: #4ade80;">${payslip.status || 'ISSUED'}</strong></div>
                        </div>
                    </div>

                    <!-- Meta Grid -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 12px;">
                        <div>
                            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Employee Details</div>
                            <div style="font-weight: 700; font-size: 14px; color: #0f172a;">${emp.firstName || ''} ${emp.lastName || ''}</div>
                            <div style="color: #64748b; margin-top: 2px;">Code: <strong style="font-family: monospace;">${emp.employeeCode || emp.id || '-'}</strong></div>
                            <div style="color: #64748b; margin-top: 2px;">Email: ${emp.email || '-'}</div>
                            <div style="color: #64748b; margin-top: 2px;">Department: ${emp.department?.name || contract.department?.name || 'General Operations'}</div>
                            <div style="color: #64748b; margin-top: 2px;">Role: ${contract.jobPosition || 'Staff'}</div>
                        </div>
                        <div>
                            <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Payment & Contract Info</div>
                            <div style="display: flex; justify-content: space-between; padding: 2px 0;"><span>Bank Name:</span> <strong>${emp.bankName || 'Standard Bank'}</strong></div>
                            <div style="display: flex; justify-content: space-between; padding: 2px 0;"><span>Account No:</span> <strong style="font-family: monospace;">${emp.bankAccountNo ? 'XXXX' + String(emp.bankAccountNo).slice(-4) : '-'}</strong></div>
                            <div style="display: flex; justify-content: space-between; padding: 2px 0;"><span>IFSC Code:</span> <strong style="font-family: monospace;">${emp.bankIFSC || '-'}</strong></div>
                            <div style="display: flex; justify-content: space-between; padding: 2px 0;"><span>Worked Days:</span> <strong>${payslip.workedDays || 0} Days</strong></div>
                            <div style="display: flex; justify-content: space-between; padding: 2px 0;"><span>Structure:</span> <strong>${payslip.salaryStructure?.name || 'Standard Structure'}</strong></div>
                        </div>
                    </div>

                    <!-- Earnings & Deductions -->
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px;">
                        <!-- Earnings Table -->
                        <div style="border: 1px solid #dcfce7; border-radius: 12px; overflow: hidden; background: #f0fdf4;">
                            <div style="background: #dcfce7; padding: 10px 14px; font-weight: 700; font-size: 12px; color: #166534; display: flex; justify-content: space-between;">
                                <span>EARNINGS & ALLOWANCES</span>
                                <span>${fmt(grossCalculated)}</span>
                            </div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                                <tbody>
                                    ${earnings.length === 0 ? '<tr><td style="padding: 12px; text-align: center; color: #94a3b8;">No earnings lines</td></tr>' : ''}
                                    ${earnings.map((l: any) => `
                                        <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                                            <td style="padding: 8px 12px;">
                                                <div style="font-weight: 600; color: #1e293b;">${l.name}</div>
                                                <div style="font-size: 9px; color: #94a3b8; font-family: monospace;">${l.code}</div>
                                            </td>
                                            <td style="padding: 8px 12px; text-align: right; font-weight: 700; color: #15803d;">
                                                ${fmt(l.amount)}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <!-- Deductions Table -->
                        <div style="border: 1px solid #ffe4e6; border-radius: 12px; overflow: hidden; background: #fff1f2;">
                            <div style="background: #ffe4e6; padding: 10px 14px; font-weight: 700; font-size: 12px; color: #9f1239; display: flex; justify-content: space-between;">
                                <span>DEDUCTIONS & TAXES</span>
                                <span>-${fmt(deductionTotal)}</span>
                            </div>
                            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                                <tbody>
                                    ${deductions.length === 0 ? '<tr><td style="padding: 12px; text-align: center; color: #94a3b8;">No deductions applied</td></tr>' : ''}
                                    ${deductions.map((l: any) => `
                                        <tr style="border-bottom: 1px solid #e2e8f0; background: #ffffff;">
                                            <td style="padding: 8px 12px;">
                                                <div style="font-weight: 600; color: #1e293b;">${l.name}</div>
                                                <div style="font-size: 9px; color: #94a3b8; font-family: monospace;">${l.code}</div>
                                            </td>
                                            <td style="padding: 8px 12px; text-align: right; font-weight: 700; color: #be123c;">
                                                -${fmt(l.amount)}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Net Summary Card -->
                    <div style="margin: 0 20px 20px 20px; padding: 16px; background: linear-gradient(90deg, #059669 0%, #0d9488 100%); border-radius: 12px; color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #a7f3d0;">Take-Home Net Salary</div>
                            <div style="font-size: 11px; color: #ecfdf5; margin-top: 2px;">Gross Earnings (${fmt(grossCalculated)}) − Total Deductions (${fmt(deductionTotal)})</div>
                        </div>
                        <div style="font-size: 24px; font-weight: 900; font-family: monospace; background: rgba(0,0,0,0.2); padding: 6px 16px; border-radius: 8px;">
                            ${fmt(netCalculated)}
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 16px; border-t: 1px solid #f1f5f9; text-align: center; font-size: 10px; color: #94a3b8; background: #f8fafc;">
                        This is an official system-generated salary payslip issued by PeoplePay360 HR & Payroll Engine.<br/>
                        Issued on ${new Date().toLocaleDateString('en-GB')} · Confidential Document
                    </div>
                </div>
            `;
            document.body.appendChild(tempContainer);
            elementToCapture = tempContainer;
        }

        // Render to canvas
        const canvas = await html2canvas(elementToCapture, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
        });

        // Cleanup temporary container if created
        if (tempContainer) {
            document.body.removeChild(tempContainer);
        }

        // Create PDF
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        const empCode = payslip.employee?.employeeCode || payslip.employee?.id || 'EMP';
        const filename = `Payslip_${empCode}_${payslip.periodStart?.slice(0, 7) || 'statement'}.pdf`;

        pdf.save(filename);
        toast.success(`Downloaded ${filename}!`, { id: toastId });
    } catch (err: any) {
        console.error('PDF Generation Error:', err);
        toast.error('Failed to generate PDF. Printing directly...', { id: toastId });
        window.print();
    }
}
