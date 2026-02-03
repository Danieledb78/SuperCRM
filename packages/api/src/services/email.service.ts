import nodemailer from 'nodemailer';
import { compile } from 'handlebars';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Base email template
const baseTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #2563eb; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background-color: white; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .button:hover { background-color: #1d4ed8; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .info-box { background-color: #f0f9ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
    .warning-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>{{companyName}}</h1>
    </div>
    <div class="content">
      {{{body}}}
    </div>
    <div class="footer">
      <p>{{companyName}} - {{companyAddress}}</p>
      <p>Questa email è stata inviata automaticamente. Non rispondere a questo messaggio.</p>
    </div>
  </div>
</body>
</html>
`;

// Email Templates
const templates = {
  // Portal invitation
  portalInvitation: `
    <h2>Sei stato invitato al portale {{portalType}}</h2>
    <p>Ciao {{recipientName}},</p>
    <p>{{senderName}} di {{companyName}} ti ha invitato ad accedere al portale {{portalType}}.</p>
    {{#if welcomeMessage}}
    <div class="info-box">
      <p><strong>Messaggio:</strong></p>
      <p>{{welcomeMessage}}</p>
    </div>
    {{/if}}
    <p>Con il portale potrai:</p>
    <ul>
      {{#each permissions}}
      <li>{{this}}</li>
      {{/each}}
    </ul>
    <p style="text-align: center;">
      <a href="{{inviteUrl}}" class="button">Accetta Invito</a>
    </p>
    <p><small>Questo link scadrà tra 7 giorni.</small></p>
  `,

  // Password reset
  passwordReset: `
    <h2>Richiesta di reset password</h2>
    <p>Ciao {{recipientName}},</p>
    <p>Abbiamo ricevuto una richiesta di reset password per il tuo account.</p>
    <p>Se hai richiesto tu il reset, clicca sul pulsante qui sotto:</p>
    <p style="text-align: center;">
      <a href="{{resetUrl}}" class="button">Reimposta Password</a>
    </p>
    <div class="warning-box">
      <p><strong>Non hai richiesto tu il reset?</strong></p>
      <p>Se non hai richiesto questa operazione, ignora questa email. La tua password rimarrà invariata.</p>
    </div>
    <p><small>Questo link scadrà tra 1 ora.</small></p>
  `,

  // Notification email
  notification: `
    <h2>{{title}}</h2>
    <p>Ciao {{recipientName}},</p>
    <p>{{message}}</p>
    {{#if actionUrl}}
    <p style="text-align: center;">
      <a href="{{actionUrl}}" class="button">{{actionText}}</a>
    </p>
    {{/if}}
  `,

  // Task reminder
  taskReminder: `
    <h2>Promemoria: Task in scadenza</h2>
    <p>Ciao {{recipientName}},</p>
    <p>Il seguente task è in scadenza:</p>
    <div class="info-box">
      <p><strong>{{taskTitle}}</strong></p>
      <p>Scadenza: {{dueDate}}</p>
      {{#if taskDescription}}
      <p>{{taskDescription}}</p>
      {{/if}}
    </div>
    <p style="text-align: center;">
      <a href="{{taskUrl}}" class="button">Visualizza Task</a>
    </p>
  `,

  // Event reminder
  eventReminder: `
    <h2>Promemoria: {{eventTitle}}</h2>
    <p>Ciao {{recipientName}},</p>
    <p>Hai un evento in programma:</p>
    <div class="info-box">
      <p><strong>{{eventTitle}}</strong></p>
      <p>Data: {{eventDate}}</p>
      <p>Ora: {{eventTime}}</p>
      {{#if eventLocation}}
      <p>Luogo: {{eventLocation}}</p>
      {{/if}}
    </div>
    {{#if eventDescription}}
    <p>{{eventDescription}}</p>
    {{/if}}
    <p style="text-align: center;">
      <a href="{{eventUrl}}" class="button">Visualizza Evento</a>
    </p>
  `,

  // Quote sent
  quoteSent: `
    <h2>Preventivo {{quoteNumber}}</h2>
    <p>Gentile {{recipientName}},</p>
    <p>In allegato trova il preventivo {{quoteNumber}} relativo a: <strong>{{quoteSubject}}</strong></p>
    <div class="info-box">
      <p><strong>Importo totale:</strong> €{{quoteAmount}}</p>
      <p><strong>Validità:</strong> {{validUntil}}</p>
    </div>
    {{#if notes}}
    <p>{{notes}}</p>
    {{/if}}
    <p>Per qualsiasi domanda, non esiti a contattarci.</p>
    <p>Cordiali saluti,<br>{{senderName}}</p>
  `,

  // Invoice sent
  invoiceSent: `
    <h2>Fattura {{invoiceNumber}}</h2>
    <p>Gentile {{recipientName}},</p>
    <p>In allegato trova la fattura {{invoiceNumber}}.</p>
    <div class="info-box">
      <p><strong>Importo:</strong> €{{invoiceAmount}}</p>
      <p><strong>Scadenza:</strong> {{dueDate}}</p>
    </div>
    <p>Per i dettagli del pagamento, faccia riferimento alla fattura allegata.</p>
    <p>Cordiali saluti,<br>{{senderName}}</p>
  `,

  // Project update (for customer portal)
  projectUpdate: `
    <h2>Aggiornamento Commessa: {{projectCode}}</h2>
    <p>Ciao {{recipientName}},</p>
    <p>La tua commessa <strong>{{projectName}}</strong> è stata aggiornata.</p>
    <div class="info-box">
      <p><strong>Stato:</strong> {{projectStatus}}</p>
      <p><strong>Avanzamento:</strong> {{projectProgress}}%</p>
    </div>
    {{#if updateMessage}}
    <p>{{updateMessage}}</p>
    {{/if}}
    <p style="text-align: center;">
      <a href="{{portalUrl}}" class="button">Visualizza nel Portale</a>
    </p>
  `,

  // New message notification
  newMessage: `
    <h2>Nuovo messaggio</h2>
    <p>Ciao {{recipientName}},</p>
    <p>Hai ricevuto un nuovo messaggio:</p>
    <div class="info-box">
      <p><strong>Da:</strong> {{senderName}}</p>
      <p><strong>Oggetto:</strong> {{messageSubject}}</p>
      <p>{{messagePreview}}...</p>
    </div>
    <p style="text-align: center;">
      <a href="{{messageUrl}}" class="button">Leggi Messaggio</a>
    </p>
  `,

  // Welcome email
  welcome: `
    <h2>Benvenuto in {{companyName}}!</h2>
    <p>Ciao {{recipientName}},</p>
    <p>Il tuo account è stato creato con successo.</p>
    <div class="info-box">
      <p><strong>Email:</strong> {{email}}</p>
      <p><strong>Ruolo:</strong> {{role}}</p>
    </div>
    <p>Per iniziare, accedi al sistema:</p>
    <p style="text-align: center;">
      <a href="{{loginUrl}}" class="button">Accedi</a>
    </p>
  `
};

// Compile templates
const compiledTemplates: Record<string, HandlebarsTemplateDelegate> = {};
Object.entries(templates).forEach(([key, template]) => {
  compiledTemplates[key] = compile(template);
});

const compiledBase = compile(baseTemplate);

// Types
interface EmailOptions {
  to: string | string[];
  subject: string;
  template: keyof typeof templates;
  data: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
  }>;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Send email function
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const { to, subject, template, data, attachments, cc, bcc, replyTo } = options;

    // Get company info from env or defaults
    const companyInfo = {
      companyName: process.env.COMPANY_NAME || 'SuperCRM',
      companyAddress: process.env.COMPANY_ADDRESS || 'Via Roma 123, Milano',
      companyLogo: process.env.COMPANY_LOGO_URL
    };

    // Compile template
    const bodyHtml = compiledTemplates[template]({ ...data, ...companyInfo });
    const fullHtml = compiledBase({ ...companyInfo, body: bodyHtml });

    // Send email
    const result = await transporter.sendMail({
      from: `${companyInfo.companyName} <${process.env.SMTP_FROM || 'noreply@supercrm.it'}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : undefined,
      bcc: bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : undefined,
      replyTo,
      subject,
      html: fullHtml,
      attachments
    });

    console.log(`Email sent to ${to}: ${result.messageId}`);

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('Error sending email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Specific email functions
export async function sendPortalInvitation(params: {
  to: string;
  recipientName: string;
  senderName: string;
  portalType: 'Clienti' | 'Fornitori';
  inviteUrl: string;
  permissions: string[];
  welcomeMessage?: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: `Invito al Portale ${params.portalType}`,
    template: 'portalInvitation',
    data: params
  });
}

export async function sendPasswordReset(params: {
  to: string;
  recipientName: string;
  resetUrl: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: 'Richiesta reset password',
    template: 'passwordReset',
    data: params
  });
}

export async function sendTaskReminder(params: {
  to: string;
  recipientName: string;
  taskTitle: string;
  taskDescription?: string;
  dueDate: string;
  taskUrl: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: `Promemoria: ${params.taskTitle}`,
    template: 'taskReminder',
    data: params
  });
}

export async function sendEventReminder(params: {
  to: string;
  recipientName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation?: string;
  eventDescription?: string;
  eventUrl: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: `Promemoria: ${params.eventTitle}`,
    template: 'eventReminder',
    data: params
  });
}

export async function sendQuote(params: {
  to: string;
  recipientName: string;
  senderName: string;
  quoteNumber: string;
  quoteSubject: string;
  quoteAmount: string;
  validUntil: string;
  notes?: string;
  pdfBuffer: Buffer;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: `Preventivo ${params.quoteNumber}`,
    template: 'quoteSent',
    data: params,
    attachments: [{
      filename: `Preventivo_${params.quoteNumber}.pdf`,
      content: params.pdfBuffer
    }]
  });
}

export async function sendInvoice(params: {
  to: string;
  recipientName: string;
  senderName: string;
  invoiceNumber: string;
  invoiceAmount: string;
  dueDate: string;
  pdfBuffer: Buffer;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: `Fattura ${params.invoiceNumber}`,
    template: 'invoiceSent',
    data: params,
    attachments: [{
      filename: `Fattura_${params.invoiceNumber}.pdf`,
      content: params.pdfBuffer
    }]
  });
}

export async function sendProjectUpdate(params: {
  to: string;
  recipientName: string;
  projectCode: string;
  projectName: string;
  projectStatus: string;
  projectProgress: number;
  updateMessage?: string;
  portalUrl: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: `Aggiornamento Commessa ${params.projectCode}`,
    template: 'projectUpdate',
    data: params
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  recipientName: string;
  email: string;
  role: string;
  loginUrl: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: params.to,
    subject: 'Benvenuto in SuperCRM',
    template: 'welcome',
    data: params
  });
}

export default {
  sendEmail,
  sendPortalInvitation,
  sendPasswordReset,
  sendTaskReminder,
  sendEventReminder,
  sendQuote,
  sendInvoice,
  sendProjectUpdate,
  sendWelcomeEmail
};
