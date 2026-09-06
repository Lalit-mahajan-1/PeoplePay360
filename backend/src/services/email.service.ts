import * as nodemailer from 'nodemailer';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER || 'xyzclg28@gmail.com';
    const rawPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '';
    const pass = rawPass.replace(/\s+/g, '');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
      console.log(`[EmailService] Initializing SMTP Transport (host=${host}, port=${port}, secure=${secure}, user=${user})`);
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    } else {
      console.warn(`[EmailService] SMTP credentials missing. Falling back to jsonTransport.`);
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

    const smtpUser = process.env.SMTP_USER || 'xyzclg28@gmail.com';
    const fromName = process.env.SMTP_FROM_NAME || 'PeoplePay360 Payroll';
    const fromAddress = `"${fromName}" <${smtpUser}>`;

    // Target email address - if dummy, demo or invalid domain, send to admin/SMTP user so test mails deliver cleanly!
    let targetEmail = to;
    if (!targetEmail || targetEmail.includes('@peoplepay360.com') || targetEmail.includes('@example.com') || targetEmail.includes('@test.com') || !targetEmail.includes('.')) {
      console.log(`[EmailService] Redirecting demo/test email (${to}) to SMTP user inbox (${smtpUser})`);
      targetEmail = smtpUser;
    }

    const info = await this.transporter.sendMail({
      from: fromAddress,
      to: targetEmail,
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

    console.log(`[EmailService] Payslip email sent to ${targetEmail} (Employee: ${employeeName}):`, (info as any).messageId || 'Queued/Delivered');
    return info;
  }
}

export const emailService = new EmailService();
