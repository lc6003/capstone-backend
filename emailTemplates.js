function passwordResetEmail(username, resetUrl) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
          line-height: 1.6; 
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
        }
        .header { 
          background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
          color: white; 
          padding: 40px 30px; 
          text-align: center; 
          border-radius: 12px 12px 0 0;
        }
        .header h1 {
          margin: 0 0 10px 0;
          font-size: 32px;
        }
        .header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 400;
        }
        .content { 
          background: #ffffff;
          padding: 40px 30px;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 12px 12px;
        }
        .content p {
          margin: 0 0 16px 0;
          color: #374151;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
          color: white !important; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
        }
        .link-box {
          background: #fff7ed;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #fed7aa;
          word-break: break-all;
          margin: 20px 0;
        }
        .link-box a {
          color: #ea580c;
          text-decoration: none;
          font-size: 14px;
        }
        .warning {
          background: #fef3c7;
          border: 1px solid #fbbf24;
          padding: 12px 16px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
          color: #92400e;
        }
        .footer { 
          text-align: center; 
          margin-top: 30px; 
          color: #6b7280; 
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🐱 Cashvelo</h1>
          <h2>Password Reset Request</h2>
        </div>
        <div class="content">
          <p>Hi <strong>${username}</strong>,</p>
          <p>We received a request to reset your password for your Cashvelo account.</p>
          <p>Click the button below to create a new password:</p>
          
          <div class="button-container">
            <a href="${resetUrl}" class="button">Reset My Password</a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <div class="link-box">
            <a href="${resetUrl}">${resetUrl}</a>
          </div>
          
          <div class="warning">
            <strong>⏰ This link will expire in 1 hour</strong> for security reasons.
          </div>
          
          <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          
          <p style="margin-top: 30px;">
            Best regards,<br>
            <strong>The Cashvelo Team</strong>
          </p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this message.</p>
          <p>© ${new Date().getFullYear()} Cashvelo. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  passwordResetEmail
};