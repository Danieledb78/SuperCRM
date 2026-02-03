import prisma from '../lib/prisma';

// ============================================
// TYPES
// ============================================

interface SmsOptions {
  to: string;
  message: string;
  organizationId: string;
  from?: string;
}

interface WhatsAppOptions {
  to: string;
  message: string;
  organizationId: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  mediaUrl?: string;
}

interface MessageResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider?: string;
}

interface ProviderConfig {
  // Twilio
  accountSid?: string;
  authToken?: string;
  phoneNumber?: string;
  messagingServiceSid?: string;
  // Vonage
  apiKey?: string;
  apiSecret?: string;
  // MessageBird
  accessKey?: string;
  // WhatsApp Meta
  phoneNumberId?: string;
  accessToken?: string;
  businessAccountId?: string;
  // 360dialog
  apiKey360?: string;
  channelId?: string;
}

// ============================================
// SMS SERVICE
// ============================================

export async function sendSms(options: SmsOptions): Promise<MessageResult> {
  const { to, message, organizationId, from } = options;

  // Get active SMS provider for organization
  const provider = await prisma.messagingProvider.findFirst({
    where: {
      organizationId,
      isActive: true,
      type: {
        in: ['SMS_TWILIO', 'SMS_VONAGE', 'SMS_MESSAGEBIRD']
      }
    },
    orderBy: { isDefault: 'desc' }
  });

  if (!provider) {
    console.log('[MessagingService] No SMS provider configured');
    return {
      success: false,
      error: 'Nessun provider SMS configurato'
    };
  }

  // Check limits
  const limitCheck = await checkProviderLimits(provider);
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || 'Limite messaggi raggiunto'
    };
  }

  try {
    const config = provider.config as ProviderConfig;
    let result: MessageResult;

    switch (provider.type) {
      case 'SMS_TWILIO':
        result = await sendSmsTwilio(to, message, config, from);
        break;
      case 'SMS_VONAGE':
        result = await sendSmsVonage(to, message, config, from);
        break;
      case 'SMS_MESSAGEBIRD':
        result = await sendSmsMessageBird(to, message, config, from);
        break;
      default:
        return { success: false, error: 'Provider non supportato' };
    }

    // Update counters on success
    if (result.success) {
      await incrementProviderCounter(provider.id);
    }

    return { ...result, provider: provider.name };
  } catch (error) {
    console.error('[MessagingService] SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore invio SMS',
      provider: provider.name
    };
  }
}

// Twilio SMS implementation
async function sendSmsTwilio(
  to: string,
  message: string,
  config: ProviderConfig,
  from?: string
): Promise<MessageResult> {
  const { accountSid, authToken, phoneNumber, messagingServiceSid } = config;

  if (!accountSid || !authToken) {
    return { success: false, error: 'Credenziali Twilio mancanti' };
  }

  try {
    // Twilio API call
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const body = new URLSearchParams({
      To: formatPhoneNumber(to),
      Body: message
    });

    if (messagingServiceSid) {
      body.append('MessagingServiceSid', messagingServiceSid);
    } else if (from || phoneNumber) {
      body.append('From', from || phoneNumber || '');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[MessagingService] SMS sent via Twilio: ${data.sid}`);
      return { success: true, messageId: data.sid };
    } else {
      console.error('[MessagingService] Twilio error:', data);
      return { success: false, error: data.message || 'Errore Twilio' };
    }
  } catch (error) {
    console.error('[MessagingService] Twilio exception:', error);
    return { success: false, error: 'Errore connessione Twilio' };
  }
}

// Vonage (Nexmo) SMS implementation
async function sendSmsVonage(
  to: string,
  message: string,
  config: ProviderConfig,
  from?: string
): Promise<MessageResult> {
  const { apiKey, apiSecret } = config;

  if (!apiKey || !apiSecret) {
    return { success: false, error: 'Credenziali Vonage mancanti' };
  }

  try {
    const response = await fetch('https://rest.nexmo.com/sms/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        api_secret: apiSecret,
        to: formatPhoneNumber(to).replace('+', ''),
        from: from || 'SuperCRM',
        text: message
      })
    });

    const data = await response.json();

    if (data.messages?.[0]?.status === '0') {
      console.log(`[MessagingService] SMS sent via Vonage: ${data.messages[0]['message-id']}`);
      return { success: true, messageId: data.messages[0]['message-id'] };
    } else {
      console.error('[MessagingService] Vonage error:', data);
      return { success: false, error: data.messages?.[0]?.['error-text'] || 'Errore Vonage' };
    }
  } catch (error) {
    console.error('[MessagingService] Vonage exception:', error);
    return { success: false, error: 'Errore connessione Vonage' };
  }
}

// MessageBird SMS implementation
async function sendSmsMessageBird(
  to: string,
  message: string,
  config: ProviderConfig,
  from?: string
): Promise<MessageResult> {
  const { accessKey } = config;

  if (!accessKey) {
    return { success: false, error: 'Credenziali MessageBird mancanti' };
  }

  try {
    const response = await fetch('https://rest.messagebird.com/messages', {
      method: 'POST',
      headers: {
        'Authorization': `AccessKey ${accessKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        originator: from || 'SuperCRM',
        recipients: [formatPhoneNumber(to).replace('+', '')],
        body: message
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[MessagingService] SMS sent via MessageBird: ${data.id}`);
      return { success: true, messageId: data.id };
    } else {
      console.error('[MessagingService] MessageBird error:', data);
      return { success: false, error: data.errors?.[0]?.description || 'Errore MessageBird' };
    }
  } catch (error) {
    console.error('[MessagingService] MessageBird exception:', error);
    return { success: false, error: 'Errore connessione MessageBird' };
  }
}

// ============================================
// WHATSAPP SERVICE
// ============================================

export async function sendWhatsApp(options: WhatsAppOptions): Promise<MessageResult> {
  const { to, message, organizationId, templateId, templateVariables, mediaUrl } = options;

  // Get active WhatsApp provider for organization
  const provider = await prisma.messagingProvider.findFirst({
    where: {
      organizationId,
      isActive: true,
      type: {
        in: ['WHATSAPP_META', 'WHATSAPP_TWILIO', 'WHATSAPP_360DIALOG']
      }
    },
    orderBy: { isDefault: 'desc' }
  });

  if (!provider) {
    console.log('[MessagingService] No WhatsApp provider configured');
    return {
      success: false,
      error: 'Nessun provider WhatsApp configurato. Configura un provider dalle impostazioni.'
    };
  }

  // Check limits
  const limitCheck = await checkProviderLimits(provider);
  if (!limitCheck.allowed) {
    return {
      success: false,
      error: limitCheck.error || 'Limite messaggi raggiunto'
    };
  }

  try {
    const config = provider.config as ProviderConfig;
    let result: MessageResult;

    switch (provider.type) {
      case 'WHATSAPP_META':
        result = await sendWhatsAppMeta(to, message, config, templateId, templateVariables, mediaUrl);
        break;
      case 'WHATSAPP_TWILIO':
        result = await sendWhatsAppTwilio(to, message, config, templateId, templateVariables);
        break;
      case 'WHATSAPP_360DIALOG':
        result = await sendWhatsApp360Dialog(to, message, config, templateId, templateVariables);
        break;
      default:
        return { success: false, error: 'Provider non supportato' };
    }

    // Update counters on success
    if (result.success) {
      await incrementProviderCounter(provider.id);
    }

    return { ...result, provider: provider.name };
  } catch (error) {
    console.error('[MessagingService] WhatsApp error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore invio WhatsApp',
      provider: provider.name
    };
  }
}

// Meta WhatsApp Business API implementation
async function sendWhatsAppMeta(
  to: string,
  message: string,
  config: ProviderConfig,
  templateId?: string,
  templateVariables?: Record<string, string>,
  mediaUrl?: string
): Promise<MessageResult> {
  const { phoneNumberId, accessToken } = config;

  if (!phoneNumberId || !accessToken) {
    return { success: false, error: 'Credenziali Meta WhatsApp mancanti' };
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
    const phone = formatPhoneNumber(to).replace('+', '');

    let body: any;

    if (templateId) {
      // Send template message
      body = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'template',
        template: {
          name: templateId,
          language: { code: 'it' },
          components: templateVariables ? [
            {
              type: 'body',
              parameters: Object.entries(templateVariables).map(([_, value]) => ({
                type: 'text',
                text: value
              }))
            }
          ] : []
        }
      };
    } else if (mediaUrl) {
      // Send media message
      const mediaType = getMediaType(mediaUrl);
      body = {
        messaging_product: 'whatsapp',
        to: phone,
        type: mediaType,
        [mediaType]: {
          link: mediaUrl,
          caption: message
        }
      };
    } else {
      // Send text message
      body = {
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message }
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok && data.messages?.[0]?.id) {
      console.log(`[MessagingService] WhatsApp sent via Meta: ${data.messages[0].id}`);
      return { success: true, messageId: data.messages[0].id };
    } else {
      console.error('[MessagingService] Meta WhatsApp error:', data);
      return {
        success: false,
        error: data.error?.message || 'Errore Meta WhatsApp'
      };
    }
  } catch (error) {
    console.error('[MessagingService] Meta WhatsApp exception:', error);
    return { success: false, error: 'Errore connessione Meta WhatsApp' };
  }
}

// Twilio WhatsApp implementation
async function sendWhatsAppTwilio(
  to: string,
  message: string,
  config: ProviderConfig,
  templateId?: string,
  templateVariables?: Record<string, string>
): Promise<MessageResult> {
  const { accountSid, authToken, phoneNumber } = config;

  if (!accountSid || !authToken || !phoneNumber) {
    return { success: false, error: 'Credenziali Twilio WhatsApp mancanti' };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    // Format numbers for WhatsApp
    const toNumber = `whatsapp:${formatPhoneNumber(to)}`;
    const fromNumber = `whatsapp:${phoneNumber}`;

    // Replace template variables if present
    let finalMessage = message;
    if (templateVariables) {
      Object.entries(templateVariables).forEach(([key, value]) => {
        finalMessage = finalMessage.replace(`{{${key}}}`, value);
      });
    }

    const body = new URLSearchParams({
      To: toNumber,
      From: fromNumber,
      Body: finalMessage
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`[MessagingService] WhatsApp sent via Twilio: ${data.sid}`);
      return { success: true, messageId: data.sid };
    } else {
      console.error('[MessagingService] Twilio WhatsApp error:', data);
      return { success: false, error: data.message || 'Errore Twilio WhatsApp' };
    }
  } catch (error) {
    console.error('[MessagingService] Twilio WhatsApp exception:', error);
    return { success: false, error: 'Errore connessione Twilio WhatsApp' };
  }
}

// 360dialog WhatsApp implementation
async function sendWhatsApp360Dialog(
  to: string,
  message: string,
  config: ProviderConfig,
  templateId?: string,
  templateVariables?: Record<string, string>
): Promise<MessageResult> {
  const { apiKey360 } = config;

  if (!apiKey360) {
    return { success: false, error: 'Credenziali 360dialog mancanti' };
  }

  try {
    const url = 'https://waba.360dialog.io/v1/messages';
    const phone = formatPhoneNumber(to).replace('+', '');

    let body: any;

    if (templateId) {
      body = {
        to: phone,
        type: 'template',
        template: {
          namespace: 'default',
          name: templateId,
          language: { policy: 'deterministic', code: 'it' },
          components: templateVariables ? [
            {
              type: 'body',
              parameters: Object.entries(templateVariables).map(([_, value]) => ({
                type: 'text',
                text: value
              }))
            }
          ] : []
        }
      };
    } else {
      body = {
        to: phone,
        type: 'text',
        text: { body: message }
      };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'D360-API-KEY': apiKey360,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok && data.messages?.[0]?.id) {
      console.log(`[MessagingService] WhatsApp sent via 360dialog: ${data.messages[0].id}`);
      return { success: true, messageId: data.messages[0].id };
    } else {
      console.error('[MessagingService] 360dialog error:', data);
      return {
        success: false,
        error: data.meta?.developer_message || 'Errore 360dialog'
      };
    }
  } catch (error) {
    console.error('[MessagingService] 360dialog exception:', error);
    return { success: false, error: 'Errore connessione 360dialog' };
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Format phone number to E.164 format
function formatPhoneNumber(phone: string): string {
  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If doesn't start with +, assume Italian number
  if (!cleaned.startsWith('+')) {
    // Remove leading 0 if present (common in Italian numbers)
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    // Add Italian country code
    cleaned = '+39' + cleaned;
  }

  return cleaned;
}

// Check provider limits
async function checkProviderLimits(provider: any): Promise<{ allowed: boolean; error?: string }> {
  const now = new Date();

  // Reset daily counter if needed
  const lastResetDaily = new Date(provider.lastResetDaily);
  if (now.toDateString() !== lastResetDaily.toDateString()) {
    await prisma.messagingProvider.update({
      where: { id: provider.id },
      data: { sentToday: 0, lastResetDaily: now }
    });
    provider.sentToday = 0;
  }

  // Reset monthly counter if needed
  const lastResetMonth = new Date(provider.lastResetMonth);
  if (now.getMonth() !== lastResetMonth.getMonth() || now.getFullYear() !== lastResetMonth.getFullYear()) {
    await prisma.messagingProvider.update({
      where: { id: provider.id },
      data: { sentThisMonth: 0, lastResetMonth: now }
    });
    provider.sentThisMonth = 0;
  }

  // Check daily limit
  if (provider.dailyLimit && provider.sentToday >= provider.dailyLimit) {
    return {
      allowed: false,
      error: `Limite giornaliero raggiunto (${provider.dailyLimit} messaggi)`
    };
  }

  // Check monthly limit
  if (provider.monthlyLimit && provider.sentThisMonth >= provider.monthlyLimit) {
    return {
      allowed: false,
      error: `Limite mensile raggiunto (${provider.monthlyLimit} messaggi)`
    };
  }

  return { allowed: true };
}

// Increment provider counters
async function incrementProviderCounter(providerId: string): Promise<void> {
  await prisma.messagingProvider.update({
    where: { id: providerId },
    data: {
      sentToday: { increment: 1 },
      sentThisMonth: { increment: 1 }
    }
  });
}

// Get media type from URL
function getMediaType(url: string): 'image' | 'video' | 'document' | 'audio' {
  const extension = url.split('.').pop()?.toLowerCase();

  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const videoExtensions = ['mp4', '3gp', 'avi', 'mov'];
  const audioExtensions = ['mp3', 'ogg', 'amr', 'aac'];

  if (imageExtensions.includes(extension || '')) return 'image';
  if (videoExtensions.includes(extension || '')) return 'video';
  if (audioExtensions.includes(extension || '')) return 'audio';

  return 'document';
}

// ============================================
// WEBHOOK HANDLERS FOR INCOMING MESSAGES
// ============================================

export interface IncomingMessage {
  provider: string;
  from: string;
  to: string;
  message: string;
  messageId: string;
  timestamp: Date;
  type: 'sms' | 'whatsapp';
  mediaUrl?: string;
  status?: string;
}

// Parse Twilio webhook
export function parseTwilioWebhook(body: any): IncomingMessage | null {
  try {
    const isWhatsApp = body.From?.startsWith('whatsapp:');

    return {
      provider: 'twilio',
      from: body.From?.replace('whatsapp:', '') || '',
      to: body.To?.replace('whatsapp:', '') || '',
      message: body.Body || '',
      messageId: body.MessageSid || body.SmsSid || '',
      timestamp: new Date(),
      type: isWhatsApp ? 'whatsapp' : 'sms',
      mediaUrl: body.MediaUrl0,
      status: body.SmsStatus || body.MessageStatus
    };
  } catch (error) {
    console.error('[MessagingService] Error parsing Twilio webhook:', error);
    return null;
  }
}

// Parse Meta WhatsApp webhook
export function parseMetaWhatsAppWebhook(body: any): IncomingMessage | null {
  try {
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) return null;

    return {
      provider: 'meta',
      from: message.from || '',
      to: value.metadata?.display_phone_number || '',
      message: message.text?.body || message.caption || '',
      messageId: message.id || '',
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      type: 'whatsapp',
      mediaUrl: message.image?.url || message.video?.url || message.document?.url
    };
  } catch (error) {
    console.error('[MessagingService] Error parsing Meta webhook:', error);
    return null;
  }
}

// Parse Vonage webhook
export function parseVonageWebhook(body: any): IncomingMessage | null {
  try {
    return {
      provider: 'vonage',
      from: body.msisdn || body.from || '',
      to: body.to || '',
      message: body.text || body.message?.content?.text || '',
      messageId: body.messageId || body['message-id'] || '',
      timestamp: new Date(body['message-timestamp'] || body.timestamp),
      type: 'sms'
    };
  } catch (error) {
    console.error('[MessagingService] Error parsing Vonage webhook:', error);
    return null;
  }
}

// ============================================
// PROVIDER MANAGEMENT
// ============================================

export interface ProviderSetup {
  type: string;
  name: string;
  config: ProviderConfig;
  dailyLimit?: number;
  monthlyLimit?: number;
}

// Test provider connection
export async function testProvider(setup: ProviderSetup): Promise<{ success: boolean; error?: string }> {
  try {
    // Basic validation based on provider type
    switch (setup.type) {
      case 'SMS_TWILIO':
      case 'WHATSAPP_TWILIO':
        if (!setup.config.accountSid || !setup.config.authToken) {
          return { success: false, error: 'Account SID e Auth Token richiesti' };
        }
        // Test API connection
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${setup.config.accountSid}.json`;
        const twilioAuth = Buffer.from(`${setup.config.accountSid}:${setup.config.authToken}`).toString('base64');
        const twilioResponse = await fetch(twilioUrl, {
          headers: { 'Authorization': `Basic ${twilioAuth}` }
        });
        if (!twilioResponse.ok) {
          return { success: false, error: 'Credenziali Twilio non valide' };
        }
        break;

      case 'SMS_VONAGE':
        if (!setup.config.apiKey || !setup.config.apiSecret) {
          return { success: false, error: 'API Key e API Secret richiesti' };
        }
        break;

      case 'SMS_MESSAGEBIRD':
        if (!setup.config.accessKey) {
          return { success: false, error: 'Access Key richiesto' };
        }
        break;

      case 'WHATSAPP_META':
        if (!setup.config.phoneNumberId || !setup.config.accessToken) {
          return { success: false, error: 'Phone Number ID e Access Token richiesti' };
        }
        // Test API connection
        const metaUrl = `https://graph.facebook.com/v18.0/${setup.config.phoneNumberId}`;
        const metaResponse = await fetch(metaUrl, {
          headers: { 'Authorization': `Bearer ${setup.config.accessToken}` }
        });
        if (!metaResponse.ok) {
          return { success: false, error: 'Credenziali Meta non valide' };
        }
        break;

      case 'WHATSAPP_360DIALOG':
        if (!setup.config.apiKey360) {
          return { success: false, error: 'API Key richiesta' };
        }
        break;

      default:
        return { success: false, error: 'Tipo provider non supportato' };
    }

    return { success: true };
  } catch (error) {
    console.error('[MessagingService] Provider test error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore durante il test'
    };
  }
}

// Get provider stats
export async function getProviderStats(organizationId: string): Promise<any[]> {
  const providers = await prisma.messagingProvider.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      type: true,
      isActive: true,
      isDefault: true,
      dailyLimit: true,
      monthlyLimit: true,
      sentToday: true,
      sentThisMonth: true
    }
  });

  return providers.map(p => ({
    ...p,
    dailyUsagePercent: p.dailyLimit ? Math.round((p.sentToday / p.dailyLimit) * 100) : null,
    monthlyUsagePercent: p.monthlyLimit ? Math.round((p.sentThisMonth / p.monthlyLimit) * 100) : null
  }));
}

export default {
  sendSms,
  sendWhatsApp,
  testProvider,
  getProviderStats,
  parseTwilioWebhook,
  parseMetaWhatsAppWebhook,
  parseVonageWebhook
};
