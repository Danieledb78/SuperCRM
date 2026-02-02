import { Request, Response } from 'express';

// AI Controller - Integrazione ChatGPT, Claude e altri modelli AI
// Fornisce assistente AI integrato con contesto CRM

// ============================================
// AI CONFIGURATION
// ============================================

// Get all AI configurations
export const getAIConfigurations = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;

    res.json({
      data: [],
      total: 0
    });
  } catch (error) {
    console.error('Error fetching AI configurations:', error);
    res.status(500).json({ error: 'Failed to fetch AI configurations' });
  }
};

// Get single AI configuration
export const getAIConfiguration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      id,
      name: '',
      provider: 'OPENAI',
      model: 'gpt-4',
      isActive: true,
      isDefault: false
    });
  } catch (error) {
    console.error('Error fetching AI configuration:', error);
    res.status(500).json({ error: 'Failed to fetch AI configuration' });
  }
};

// Create AI configuration
export const createAIConfiguration = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const {
      name,
      provider,
      model,
      apiKey,
      baseUrl,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      systemPrompt,
      includeContext,
      contextModules,
      dailyTokenLimit,
      monthlyTokenLimit,
      enabledFeatures,
      isDefault
    } = req.body;

    if (!name || !provider || !model || !apiKey) {
      return res.status(400).json({
        error: 'Name, provider, model, and API key are required'
      });
    }

    const config = {
      id: `ai_${Date.now()}`,
      name,
      provider,
      model,
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2000,
      topP,
      frequencyPenalty,
      presencePenalty,
      systemPrompt: systemPrompt || getDefaultSystemPrompt(provider),
      includeContext: includeContext !== false,
      contextModules: contextModules || ['contacts', 'companies', 'deals', 'projects'],
      dailyTokenLimit,
      monthlyTokenLimit,
      tokensUsedToday: 0,
      tokensUsedMonth: 0,
      enabledFeatures: enabledFeatures || ['chat', 'summarize'],
      isActive: true,
      isDefault: isDefault || false,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json(config);
  } catch (error) {
    console.error('Error creating AI configuration:', error);
    res.status(500).json({ error: 'Failed to create AI configuration' });
  }
};

// Update AI configuration
export const updateAIConfiguration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    res.json({
      id,
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error updating AI configuration:', error);
    res.status(500).json({ error: 'Failed to update AI configuration' });
  }
};

// Delete AI configuration
export const deleteAIConfiguration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({ message: 'AI configuration deleted' });
  } catch (error) {
    console.error('Error deleting AI configuration:', error);
    res.status(500).json({ error: 'Failed to delete AI configuration' });
  }
};

// Test AI configuration
export const testAIConfiguration = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Send a test message to verify configuration
    const testMessage = 'Rispondi con "OK" se funziona correttamente.';

    // In real implementation, call the AI API
    res.json({
      success: true,
      response: 'OK',
      latency: 500, // ms
      tokensUsed: 10
    });
  } catch (error) {
    console.error('Error testing AI configuration:', error);
    res.status(500).json({ error: 'Failed to test AI configuration' });
  }
};

// ============================================
// CONVERSATIONS
// ============================================

// Get all conversations
export const getConversations = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const { contextType, contextId, page = 1, pageSize = 20 } = req.query;

    const filters: any = { organizationId, userId };
    if (contextType) filters.contextType = contextType;
    if (contextId) filters.contextId = contextId;

    res.json({
      data: [],
      pagination: {
        total: 0,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: 0
      }
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

// Get single conversation with messages
export const getConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({
      id,
      title: '',
      contextType: null,
      contextId: null,
      messages: [],
      totalTokens: 0,
      messageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
};

// Start new conversation
export const createConversation = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const { configurationId, title, contextType, contextId } = req.body;

    // Get context summary if linked to an entity
    let contextSummary = null;
    if (contextType && contextId) {
      contextSummary = await getContextSummary(contextType, contextId);
    }

    const conversation = {
      id: `conv_${Date.now()}`,
      title: title || 'Nuova conversazione',
      contextType,
      contextId,
      contextSummary,
      totalTokens: 0,
      messageCount: 0,
      isArchived: false,
      organizationId,
      userId,
      configurationId: configurationId || 'default',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

// Delete conversation
export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

// Archive conversation
export const archiveConversation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;

    res.json({
      id,
      isArchived,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
};

// ============================================
// CHAT
// ============================================

// Send message to AI
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { organizationId, id: userId } = req.user!;
    const { message, configurationId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // In real implementation:
    // 1. Get AI configuration
    // 2. Build conversation history
    // 3. Add CRM context if enabled
    // 4. Call AI API (OpenAI, Anthropic, etc.)
    // 5. Save messages to database
    // 6. Update token usage

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'USER',
      content: message,
      createdAt: new Date()
    };

    // Simulated AI response
    const assistantMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'ASSISTANT',
      content: generateAIResponse(message),
      model: 'gpt-4',
      promptTokens: 50,
      completionTokens: 100,
      totalTokens: 150,
      createdAt: new Date()
    };

    res.json({
      userMessage,
      assistantMessage,
      tokensUsed: assistantMessage.totalTokens
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Stream message response
export const streamMessage = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // In real implementation, stream from AI API
    const response = generateAIResponse(message);
    const words = response.split(' ');

    for (const word of words) {
      res.write(`data: ${JSON.stringify({ content: word + ' ' })}\n\n`);
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (error) {
    console.error('Error streaming message:', error);
    res.status(500).json({ error: 'Failed to stream message' });
  }
};

// Rate message
export const rateMessage = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const { rating, feedback } = req.body;

    res.json({
      messageId,
      rating,
      feedback,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Error rating message:', error);
    res.status(500).json({ error: 'Failed to rate message' });
  }
};

// ============================================
// AI FEATURES
// ============================================

// Summarize entity
export const summarizeEntity = async (req: Request, res: Response) => {
  try {
    const { entityType, entityId } = req.params;

    // Get entity data and generate summary
    const summary = `Riepilogo ${entityType} ${entityId}: [Qui verrebbe inserito il riepilogo generato dall'AI]`;

    res.json({
      entityType,
      entityId,
      summary,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error summarizing entity:', error);
    res.status(500).json({ error: 'Failed to summarize' });
  }
};

// Suggest email response
export const suggestEmailResponse = async (req: Request, res: Response) => {
  try {
    const { emailId } = req.params;
    const { tone = 'professional' } = req.query;

    // Get email content and generate suggested response
    const suggestion = `Gentile [Nome],

Grazie per la sua email. [Suggerimento risposta generato dall'AI]

Cordiali saluti`;

    res.json({
      emailId,
      tone,
      suggestion,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error suggesting email response:', error);
    res.status(500).json({ error: 'Failed to suggest response' });
  }
};

// Analyze deal
export const analyzeDeal = async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;

    const analysis = {
      dealId,
      winProbability: 0.75,
      strengths: [
        'Budget confermato',
        'Decisore identificato',
        'Timeline definita'
      ],
      weaknesses: [
        'Presenza di competitor',
        'Processo decisionale lungo'
      ],
      suggestedActions: [
        'Organizzare demo tecnica',
        'Coinvolgere referenze simili'
      ],
      generatedAt: new Date()
    };

    res.json(analysis);
  } catch (error) {
    console.error('Error analyzing deal:', error);
    res.status(500).json({ error: 'Failed to analyze deal' });
  }
};

// Translate text
export const translateText = async (req: Request, res: Response) => {
  try {
    const { text, targetLanguage, sourceLanguage } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({ error: 'Text and target language are required' });
    }

    // In real implementation, use AI to translate
    const translation = `[Traduzione in ${targetLanguage}]: ${text}`;

    res.json({
      originalText: text,
      translatedText: translation,
      sourceLanguage: sourceLanguage || 'auto',
      targetLanguage,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error translating text:', error);
    res.status(500).json({ error: 'Failed to translate' });
  }
};

// Generate content
export const generateContent = async (req: Request, res: Response) => {
  try {
    const { type, context, tone, length } = req.body;

    // Types: email, proposal, report, description, follow_up
    let content = '';

    switch (type) {
      case 'email':
        content = 'Email generata dall\'AI...';
        break;
      case 'proposal':
        content = 'Proposta commerciale generata...';
        break;
      case 'follow_up':
        content = 'Email di follow-up generata...';
        break;
      default:
        content = 'Contenuto generato...';
    }

    res.json({
      type,
      content,
      tone: tone || 'professional',
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ error: 'Failed to generate content' });
  }
};

// ============================================
// PROMPT TEMPLATES
// ============================================

// Get prompt templates
export const getPromptTemplates = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { category, isPublic } = req.query;

    res.json({
      data: getDefaultPromptTemplates(),
      total: 10
    });
  } catch (error) {
    console.error('Error fetching prompt templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};

// Create prompt template
export const createPromptTemplate = async (req: Request, res: Response) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const { name, description, category, prompt, variables, provider, model, temperature, maxTokens } = req.body;

    const template = {
      id: `prompt_${Date.now()}`,
      name,
      description,
      category,
      prompt,
      variables: variables || [],
      provider,
      model,
      temperature,
      maxTokens,
      usageCount: 0,
      isActive: true,
      isPublic: false,
      organizationId,
      createdById: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating prompt template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

// Use prompt template
export const usePromptTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { variables, contextType, contextId } = req.body;

    // Get template, substitute variables, call AI

    res.json({
      templateId: id,
      result: 'Risultato dell\'esecuzione del template...',
      tokensUsed: 150,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Error using prompt template:', error);
    res.status(500).json({ error: 'Failed to use template' });
  }
};

// ============================================
// USAGE & STATISTICS
// ============================================

// Get AI usage statistics
export const getAIUsageStats = async (req: Request, res: Response) => {
  try {
    const { organizationId } = req.user!;
    const { period = '30d' } = req.query;

    res.json({
      tokensUsedToday: 0,
      tokensUsedMonth: 0,
      dailyLimit: 100000,
      monthlyLimit: 1000000,
      conversationsCount: 0,
      messagesCount: 0,
      averageTokensPerMessage: 0,
      usageByFeature: {
        chat: 0,
        summarize: 0,
        translate: 0,
        analyze: 0,
        generate: 0
      },
      usageByDay: [],
      topUsers: []
    });
  } catch (error) {
    console.error('Error getting AI usage stats:', error);
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function getDefaultSystemPrompt(provider: string): string {
  return `Sei un assistente AI integrato nel CRM SuperCRM.
Hai accesso ai dati di contatti, aziende, trattative e commesse.
Rispondi in italiano in modo professionale e conciso.
Quando fornisci informazioni sui dati CRM, sii preciso e specifico.
Se non hai informazioni sufficienti, chiedi chiarimenti.`;
}

async function getContextSummary(contextType: string, contextId: string): Promise<string> {
  // In real implementation, fetch entity and create summary
  return `Contesto: ${contextType} ID ${contextId}`;
}

function generateAIResponse(message: string): string {
  // Placeholder for AI response generation
  return `Questa è una risposta simulata al messaggio: "${message}". In una implementazione reale, questa risposta verrebbe generata dal modello AI configurato (OpenAI GPT-4, Anthropic Claude, ecc.).`;
}

function getDefaultPromptTemplates() {
  return [
    {
      id: 'template_1',
      name: 'Riepilogo Cliente',
      category: 'analysis',
      prompt: 'Analizza i dati del cliente {{clientName}} e fornisci un riepilogo completo delle interazioni, opportunità e stato attuale.',
      variables: ['clientName']
    },
    {
      id: 'template_2',
      name: 'Email Follow-up',
      category: 'sales',
      prompt: 'Genera una email di follow-up professionale per {{contactName}} riguardo a {{dealTitle}}. Tono: {{tone}}',
      variables: ['contactName', 'dealTitle', 'tone']
    },
    {
      id: 'template_3',
      name: 'Analisi Commessa',
      category: 'analysis',
      prompt: 'Analizza lo stato della commessa {{projectCode}} e identifica potenziali rischi, ritardi e opportunità di miglioramento.',
      variables: ['projectCode']
    },
    {
      id: 'template_4',
      name: 'Proposta Commerciale',
      category: 'sales',
      prompt: 'Genera una bozza di proposta commerciale per {{companyName}} per un impianto {{projectType}} da {{powerKw}} kW.',
      variables: ['companyName', 'projectType', 'powerKw']
    },
    {
      id: 'template_5',
      name: 'Risposta Email',
      category: 'support',
      prompt: 'Suggerisci una risposta all\'email del cliente. Contesto: {{emailContext}}. Tono: {{tone}}',
      variables: ['emailContext', 'tone']
    }
  ];
}

export default {
  getAIConfigurations,
  getAIConfiguration,
  createAIConfiguration,
  updateAIConfiguration,
  deleteAIConfiguration,
  testAIConfiguration,
  getConversations,
  getConversation,
  createConversation,
  deleteConversation,
  archiveConversation,
  sendMessage,
  streamMessage,
  rateMessage,
  summarizeEntity,
  suggestEmailResponse,
  analyzeDeal,
  translateText,
  generateContent,
  getPromptTemplates,
  createPromptTemplate,
  usePromptTemplate,
  getAIUsageStats
};
