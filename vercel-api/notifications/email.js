const nodemailer = require('nodemailer');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function sendResponse(res, statusCode, data) {
  res.writeHead(statusCode, corsHeaders);
  res.end(JSON.stringify(data));
}

async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    sendResponse(res, 200, { success: true });
    return;
  }

  if (req.method !== 'POST') {
    sendResponse(res, 405, { error: 'Method Not Allowed' });
    return;
  }

  try {
    const body = req.body || {};
    const { to, subject, message, from } = body;

    if (!to || !subject || !message) {
      sendResponse(res, 400, { success: false, error: 'Missing required fields: to, subject, message' });
      return;
    }

    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'Kansasnelly@gmail.com',
        pass: process.env.EMAIL_PASS || '',
      },
    });

    const mailOptions = {
      from: from || process.env.EMAIL_USER || 'Kansasnelly@gmail.com',
      to,
      subject,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);

    sendResponse(res, 200, {
      success: true,
      messageId: info.messageId,
      to,
      subject,
    });
  } catch (error) {
    console.error('[EmailNotification] Handler error:', error);
    sendResponse(res, 500, { success: false, error: error.message || 'Internal server error' });
  }
}

export default handler;
