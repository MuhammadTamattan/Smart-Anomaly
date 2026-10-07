import { processAiAssistantQuery, gatherSecurityContext } from '../services/aiAssistantService.js';

/**
 * Handle AI Assistant chat query
 * POST /api/ai-assistant/chat
 * Restricted to authenticated ADMIN users
 */
export const chatWithAssistant = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and cannot be empty',
      });
    }

    if (message.length > 2500) {
      return res.status(400).json({
        success: false,
        message: 'Message exceeds maximum allowed character length (2500)',
      });
    }

    const sanitizedMessage = message.trim();

    // Call service to gather database context & generate response
    const result = await processAiAssistantQuery(sanitizedMessage, history);

    return res.status(200).json({
      success: true,
      reply: result.reply,
      metadata: {
        provider: result.provider,
        model: result.model,
        groundedContextSummary: result.groundedContextSummary,
      },
    });
  } catch (error) {
    console.error('Error in chatWithAssistant controller:', error);
    return res.status(500).json({
      success: false,
      message: 'AI Assistant service is currently unable to process your request. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/**
 * Get AI Assistant status & telemetry context snapshot
 * GET /api/ai-assistant/status
 * Restricted to authenticated ADMIN users
 */
export const getAssistantStatus = async (req, res, next) => {
  try {
    const context = await gatherSecurityContext();
    const hasExternalKey = Boolean(
      process.env.AI_API_KEY || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY
    );

    return res.status(200).json({
      success: true,
      status: 'operational',
      mode: 'read-only-advisor',
      externalProviderConfigured: hasExternalKey,
      telemetryConnected: true,
      overview: context.overview,
      timestamp: context.timestamp,
    });
  } catch (error) {
    console.error('Error in getAssistantStatus controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve AI Assistant status',
    });
  }
};
