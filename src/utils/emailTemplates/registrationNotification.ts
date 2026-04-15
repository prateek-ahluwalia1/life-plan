const registrationNotificationTemplate = (
  userEmail: string,
  registrationTime: string,
): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
    }
    .container {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      max-width: 600px;
    }
    .header {
      background-color: #0916308;
      color: white;
      padding: 20px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .content {
      background-color: white;
      padding: 20px;
      margin-top: 0;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .details {
      background-color: #f0f0f0;
      padding: 15px;
      border-radius: 4px;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>LifePlan - New User Registration</h2>
    </div>
    <div class="content">
      <p>A new user has registered for LifePlan.</p>
      
      <div class="details">
        <strong>User Email:</strong> ${userEmail}<br>
        <strong>Registration Time:</strong> ${registrationTime}
      </div>

      <p>This is an automated notification. The user has completed email verification.</p>
    </div>
    <div class="footer">
      <p>LifePlan © 2026 | Automated Notification</p>
    </div>
  </div>
</body>
</html>
  `;
};

export default registrationNotificationTemplate;
