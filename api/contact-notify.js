import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email, phone, grade, subjects, message, wantsCatalog } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required' });
    }

    const subjectList = subjects && subjects.length > 0 ? subjects.join(', ') : 'None specified';

    // Send notification to admin
    await transporter.sendMail({
      from: `"Blue Ribbon Academy" <${process.env.GMAIL_USER}>`,
      to: process.env.GMAIL_USER,
      replyTo: email,
      subject: `New Contact Form: ${name}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1f36; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">New Contact Form Submission</h1>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #1a1f36; width: 120px;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #1a1f36;">Email:</td>
                <td style="padding: 8px 0; color: #333;"><a href="mailto:${email}" style="color: #c8a951;">${email}</a></td>
              </tr>
              ${phone ? `<tr>
                <td style="padding: 8px 0; font-weight: 600; color: #1a1f36;">Phone:</td>
                <td style="padding: 8px 0; color: #333;"><a href="tel:${phone}" style="color: #c8a951;">${phone}</a></td>
              </tr>` : ''}
              ${grade ? `<tr>
                <td style="padding: 8px 0; font-weight: 600; color: #1a1f36;">Grade:</td>
                <td style="padding: 8px 0; color: #333;">${grade}</td>
              </tr>` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #1a1f36;">Subjects:</td>
                <td style="padding: 8px 0; color: #333;">${subjectList}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #1a1f36;">Catalog:</td>
                <td style="padding: 8px 0; color: #333;">${wantsCatalog ? 'Yes, wants catalog' : 'No'}</td>
              </tr>
            </table>
            <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;">
            <p style="font-weight: 600; color: #1a1f36; margin-bottom: 8px;">Message:</p>
            <p style="color: #333; line-height: 1.6; white-space: pre-wrap;">${message}</p>
          </div>
          <div style="padding: 16px 24px; background-color: #f5f5f0; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Blue Ribbon Academy — 41 Union Ave FL2, Cresskill, NJ 07626
            </p>
          </div>
        </div>
      `,
    });

    // Send confirmation to submitter
    await transporter.sendMail({
      from: `"Blue Ribbon Academy" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Thank you for contacting Blue Ribbon Academy',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #1a1f36; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 20px;">BLUE RIBBON ACADEMY</h1>
          </div>
          <div style="padding: 32px 24px; background-color: #ffffff;">
            <h2 style="color: #1a1f36; margin: 0 0 16px;">Thank you, ${name}!</h2>
            <p style="color: #555; line-height: 1.6;">
              We've received your message and will get back to you within 24 hours.
            </p>
            <p style="color: #555; line-height: 1.6;">
              If you need immediate assistance, please call us at
              <a href="tel:12014063929" style="color: #c8a951; font-weight: 600;">+1.201.406.3929</a>.
            </p>
          </div>
          <div style="padding: 16px 24px; background-color: #f5f5f0; text-align: center;">
            <p style="color: #888; font-size: 12px; margin: 0;">
              Blue Ribbon Academy — 41 Union Ave FL2, Cresskill, NJ 07626
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
