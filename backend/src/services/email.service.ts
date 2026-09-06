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
   * Send a payslip email to an employee with embedded HTML & PDF attachment.
   */
  async sendPayslipEmail(options: {
    to: string;
    employeeName: string;
    employeeCode: string;
    periodName: string;
    htmlContent: string;
    pdfBuffer?: Buffer;
  }) {
    const { to, employeeName, employeeCode, periodName, htmlContent, pdfBuffer } = options;

    const smtpUser = process.env.SMTP_USER || 'xyzclg28@gmail.com';
    const fromName = process.env.SMTP_FROM_NAME || 'PeoplePay360 Payroll';
    const fromAddress = `"${fromName}" <${smtpUser}>`;

    // Target email address handling
    let targetEmail = to;
    if (!targetEmail || !targetEmail.includes('@') || !targetEmail.includes('.')) {
      targetEmail = smtpUser;
    } else if (process.env.SMTP_OVERRIDE_EMAIL) {
      targetEmail = process.env.SMTP_OVERRIDE_EMAIL;
    } else if (targetEmail.includes('@peoplepay360.com') || targetEmail.includes('@example.com')) {
      console.log(`[EmailService] Redirecting demo email address (${to}) to active SMTP user inbox (${smtpUser})`);
      targetEmail = smtpUser;
    }

    const attachments: any[] = [];
    if (pdfBuffer) {
      attachments.push({
        filename: `Payslip_${employeeCode}_${periodName.replace(/\s+/g, '_')}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      });
    } else {
      attachments.push({
        filename: `Payslip_${employeeCode}_${periodName.replace(/\s+/g, '_')}.html`,
        content: htmlContent,
        contentType: 'text/html',
      });
    }

    const info = await this.transporter.sendMail({
      from: fromAddress,
      to: targetEmail,
      subject: `Official Payslip Statement - ${employeeName} (${employeeCode})`,
      html: htmlContent,
      attachments,
    });

    console.log(`[EmailService] Sent PDF payslip email for ${employeeName} (${employeeCode}) to ${targetEmail}:`, (info as any).messageId || 'Queued/Delivered');
    return info;
  }
}

export const emailService = new EmailService();
