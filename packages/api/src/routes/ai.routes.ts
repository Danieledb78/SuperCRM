import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as aiController from '../controllers/ai.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============================================
// AI CONFIGURATION
// ============================================

// Get all AI configurations
router.get('/configurations', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), aiController.getAIConfigurations);

// Get single AI configuration
router.get('/configurations/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), aiController.getAIConfiguration);

// Create AI configuration
router.post('/configurations', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), aiController.createAIConfiguration);

// Update AI configuration
router.put('/configurations/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), aiController.updateAIConfiguration);

// Delete AI configuration
router.delete('/configurations/:id', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO']), aiController.deleteAIConfiguration);

// Test AI configuration
router.post('/configurations/:id/test', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CTO']), aiController.testAIConfiguration);

// ============================================
// CONVERSATIONS
// ============================================

// Get all conversations
router.get('/conversations', aiController.getConversations);

// Get single conversation
router.get('/conversations/:id', aiController.getConversation);

// Create new conversation
router.post('/conversations', aiController.createConversation);

// Delete conversation
router.delete('/conversations/:id', aiController.deleteConversation);

// Archive conversation
router.post('/conversations/:id/archive', aiController.archiveConversation);

// ============================================
// CHAT
// ============================================

// Send message
router.post('/conversations/:conversationId/messages', aiController.sendMessage);

// Stream message response
router.post('/conversations/:conversationId/messages/stream', aiController.streamMessage);

// Rate message
router.post('/messages/:messageId/rate', aiController.rateMessage);

// ============================================
// AI FEATURES
// ============================================

// Summarize entity
router.get('/summarize/:entityType/:entityId', aiController.summarizeEntity);

// Suggest email response
router.get('/suggest-response/email/:emailId', aiController.suggestEmailResponse);

// Analyze deal
router.get('/analyze/deal/:dealId', aiController.analyzeDeal);

// Translate text
router.post('/translate', aiController.translateText);

// Generate content
router.post('/generate', aiController.generateContent);

// ============================================
// PROMPT TEMPLATES
// ============================================

// Get prompt templates
router.get('/templates', aiController.getPromptTemplates);

// Create prompt template
router.post('/templates', aiController.createPromptTemplate);

// Use prompt template
router.post('/templates/:id/use', aiController.usePromptTemplate);

// ============================================
// USAGE & STATISTICS
// ============================================

// Get AI usage statistics
router.get('/usage', authorize(['SUPER_ADMIN', 'ADMIN', 'CEO', 'CFO', 'CTO']), aiController.getAIUsageStats);

export default router;
