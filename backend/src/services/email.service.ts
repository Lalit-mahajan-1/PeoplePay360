import * as nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback JSON / logger transport for development
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
    }
  }

  /**
   * Send a payslip email to an employee with embedded HTML & attachment.
   */
  async sendPayslipEmail(options: {
    to: string;
    employeeName: string;
    employeeCode: string;
    periodName: string;
    htmlContent: string;
  }) {
    const { to, employeeName, employeeCode, periodName, htmlContent } = options;

    const fromAddress = process.env.SMTP_FROM || 'PeoplePay360 Payroll <payroll@peoplepay360.com>';

    const info = await this.transporter.sendMail({
      from: fromAddress,
      to,
      subject: `Official Payslip Statement - ${periodName} (${employeeCode})`,
      html: htmlContent,
      attachments: [
        {
          filename: `Payslip_${employeeCode}_${periodName.replace(/\s+/g, '_')}.html`,
          content: htmlContent,
          contentType: 'text/html',
        },
      ],
    });

    console.log(`[EmailService] Payslip email sent to ${to} (${employeeName}):`, (info as any).messageId || 'Queued/Delivered');
    return info;
  }
}

export const emailService = new EmailService();
