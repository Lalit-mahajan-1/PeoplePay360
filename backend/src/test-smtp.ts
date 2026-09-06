import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function testEmail() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '';
  const pass = rawPass.replace(/\s+/g, ''); // strip spaces from App Password if any

  console.log('--- SMTP TEST CONFIG ---');
  console.log('Host:', host);
  console.log('Port:', port);
  console.log('User:', user);
  console.log('Pass length:', pass.length);
  console.log('Raw pass:', rawPass);
  console.log('Cleaned pass:', pass);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true,
    logger: true,
  });

  try {
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');

    console.log('Sending test email to', user);
    const info = await transporter.sendMail({
      from: `"PeoplePay360 Test" <${user}>`,
      to: 'lalitmahajan444@gmail.com',
      subject: 'Test Email from PeoplePay360 Nodemailer',
      text: 'If you receive this email, Nodemailer SMTP configuration is working perfectly!',
      html: '<b>If you receive this email, Nodemailer SMTP configuration is working perfectly!</b>',
    });


    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err: any) {
    console.error('❌ SMTP Test Failed with error:', err);
  }
}

testEmail();
