// Base email template with DeComer branding

export interface EmailTemplateData {
  title: string
  preview?: string
  body: string
}

export function baseTemplate({ title, preview, body }: EmailTemplateData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${preview ? `<meta name="description" content="${preview}">` : ''}
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
      color: #333;
      line-height: 1.6;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      font-size: 28px;
      font-weight: 700;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px 24px;
    }
    h1 {
      margin: 0 0 24px 0;
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
    }
    p {
      margin: 0 0 16px 0;
      color: #4a4a4a;
    }
    .button {
      display: inline-block;
      padding: 12px 32px;
      margin: 24px 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      padding: 24px;
      text-align: center;
      color: #999;
      font-size: 14px;
      border-top: 1px solid #e5e5e5;
    }
    .footer a {
      color: #667eea;
      text-decoration: none;
    }
    ul {
      margin: 16px 0;
      padding-left: 20px;
    }
    li {
      margin: 8px 0;
    }
    strong {
      color: #1a1a1a;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">DeComer 🍽️</div>
    </div>
    <div class="content">
      ${body}
    </div>
    <div class="footer">
      <p>
        DeComer — Comida casera, entregada.<br>
        <a href="https://decomer.codecave.ar">decomer.codecave.ar</a>
      </p>
      <p style="margin-top: 16px; font-size: 12px; color: #ccc;">
        Si no querés recibir más emails, podés <a href="#">darte de baja</a>.
      </p>
    </div>
  </div>
</body>
</html>
`.trim()
}
