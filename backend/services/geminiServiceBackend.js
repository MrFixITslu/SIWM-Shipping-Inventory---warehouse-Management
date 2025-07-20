// backend/services/geminiServiceBackend.js
const { GoogleGenAI } = require('@google/genai');
const AI_CONFIG = require('../config/aiConfig');
const fs = require('fs');
const path = require('path');

const GEMINI_CHAT_MODEL_BACKEND = AI_CONFIG.gemini.model;

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
    maxRequestsPerMinute: AI_CONFIG.rateLimits.requestsPerMinute,
    maxRequestsPerDay: AI_CONFIG.rateLimits.requestsPerDay,
    retryDelayMs: AI_CONFIG.rateLimits.retryDelayMs,
    maxRetries: AI_CONFIG.rateLimits.maxRetries
};

// Simple in-memory rate limiter (in production, use Redis)
const rateLimiter = {
    requests: [],
    lastReset: Date.now(),
    
    canMakeRequest() {
        const now = Date.now();
        
        // Reset counters if it's a new day
        if (now - this.lastReset > 24 * 60 * 60 * 1000) {
            this.requests = [];
            this.lastReset = now;
        }
        
        // Remove requests older than 1 minute
        this.requests = this.requests.filter(time => now - time < 60 * 1000);
        
        return this.requests.length < RATE_LIMIT_CONFIG.maxRequestsPerMinute;
    },
    
    recordRequest() {
        this.requests.push(Date.now());
    },
    
    getWaitTime() {
        if (this.requests.length === 0) return 0;
        const oldestRequest = Math.min(...this.requests);
        const timeSinceOldest = Date.now() - oldestRequest;
        return Math.max(0, 60000 - timeSinceOldest);
    }
};

// Error handling utilities
const isQuotaExceededError = (error) => {
    return error.message && (
        error.message.includes('quota') ||
        error.message.includes('RESOURCE_EXHAUSTED') ||
        error.message.includes('429') ||
        error.message.includes('rate limit')
    );
};

const isRetryableError = (error) => {
    return isQuotaExceededError(error) || 
           error.message.includes('500') ||
           error.message.includes('503') ||
           error.message.includes('timeout');
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const SYSTEM_INSTRUCTION_CHAT = `You are VisionBot, an AI assistant for Vision79 Shipment Inventory & Warehouse Manager. 
Your goal is to help users understand and navigate the application, provide information about logistics and warehouse management concepts, and offer suggestions based on simulated data if applicable. 
Keep responses concise and focused on the Vision79 SIWM context. 
If asked about a specific module like "Incoming Shipments", provide a brief overview of its purpose and key features (e.g., ASN processing, ETA tracking, AI delay prediction). 
If asked about "Inventory", talk about real-time levels, smart intake, and AI forecasting.
Be friendly and helpful. Do not answer general knowledge questions outside of this scope unless explicitly asked to do so as a demonstration.`;

const SYSTEM_INSTRUCTION_LOGISTICS = `You are a logistics optimization expert. Analyze shipping routes, inventory levels, and procurement data to provide intelligent recommendations for:
- Optimal shipping routes and carrier selection
- Inventory forecasting and reorder points
- Cost optimization strategies
- Risk assessment and mitigation
- Supplier performance analysis
- Warehouse layout optimization
- Compliance and regulatory guidance`;

let ai;
if (process.env.GEMINI_API_KEY) {
    try {
        ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    } catch (error) {
        console.error("Failed to initialize GoogleGenAI on backend:", error);
        ai = null;
    }
} else {
    console.warn("GEMINI_API_KEY for Gemini is not configured on the backend. AI features will be unavailable.");
    ai = null;
}

// Cache for documentation content
let documentationCache = null;

function loadDocumentationFiles() {
  if (documentationCache) return documentationCache;
  const docFiles = [
    path.join(__dirname, '../../USER_GUIDE.md'),
    path.join(__dirname, '../../README.md'),
    path.join(__dirname, '../../README_PRODUCTION.md'),
    path.join(__dirname, '../../README_ENHANCED.md'),
  ];
  documentationCache = docFiles.map(filePath => {
    try {
      if (fs.existsSync(filePath)) {
        return fs.readFileSync(filePath, 'utf8');
      }
    } catch (e) {
      console.warn('Could not read documentation file:', filePath, e.message);
    }
    return '';
  }).join('\n\n');
  return documentationCache;
}

function getDocumentationContext(userMessage) {
  // Simple heuristic: if the user asks about how to use, upload, troubleshoot, or any feature, include docs
  const usageKeywords = [
    'how do i', 'how to', 'guide', 'manual', 'upload', 'feature', 'troubleshoot', 'error', 'problem', 'step', 'screenshot', 'instruction', 'help', 'usage', 'user guide', 'readme', 'documentation', 'explain', 'walkthrough', 'add', 'edit', 'delete', 'report', 'dashboard', 'notification', 'warehouse', 'login', 'reset', 'permission', 'role', 'inventory', 'template', 'csv', 'excel', 'faq', 'support', 'chatbot'
  ];
  const lowerMsg = userMessage.toLowerCase();
  if (usageKeywords.some(k => lowerMsg.includes(k))) {
    return loadDocumentationFiles();
  }
  return '';
}

const getChatStream = async (userMessage, history) => {
    if (!ai) {
        throw new Error("AI service not available (backend configuration issue).");
    }
    
    const geminiHistory = history ? history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    })) : [];

    // Add documentation context if relevant
    const docContext = getDocumentationContext(userMessage);
    let systemInstruction = SYSTEM_INSTRUCTION_CHAT;
    if (docContext) {
      systemInstruction += '\n\n---\n\nRelevant documentation:\n' + docContext.substring(0, 6000) + '\n'; // Limit to 6000 chars for prompt size
    }

    const chat = ai.chats.create({
        model: GEMINI_CHAT_MODEL_BACKEND,
        config: {
            systemInstruction,
        },
        history: geminiHistory,
    });

    return chat.sendMessageStream({ message: userMessage });
};

const generateText = async (prompt, retryCount = 0) => {
    if (!ai) {
        throw new Error("AI service not available (backend configuration issue).");
    }
    
    // Check rate limits
    if (!rateLimiter.canMakeRequest()) {
        const waitTime = rateLimiter.getWaitTime();
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }
    
    try {
        rateLimiter.recordRequest();
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL_BACKEND,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error(`[GeminiService] generateText error (attempt ${retryCount + 1}):`, error.message);
        
        if (isQuotaExceededError(error)) {
            const retryDelay = RATE_LIMIT_CONFIG.retryDelayMs * Math.pow(AI_CONFIG.rateLimits.backoffMultiplier, retryCount);
            console.log(`[GeminiService] Quota exceeded, retrying in ${retryDelay}ms...`);
            
            if (retryCount < RATE_LIMIT_CONFIG.maxRetries) {
                await sleep(retryDelay);
                return generateText(prompt, retryCount + 1);
            } else {
                throw new Error(AI_CONFIG.messages.quotaExceeded);
            }
        }
        
        if (isRetryableError(error) && retryCount < RATE_LIMIT_CONFIG.maxRetries) {
            const retryDelay = RATE_LIMIT_CONFIG.retryDelayMs * Math.pow(AI_CONFIG.rateLimits.backoffMultiplier, retryCount);
            console.log(`[GeminiService] Retryable error, retrying in ${retryDelay}ms...`);
            await sleep(retryDelay);
            return generateText(prompt, retryCount + 1);
        }
        
        throw error;
    }
};

const generateJson = async (prompt, retryCount = 0) => {
    if (!ai) {
        throw new Error("AI service not available (backend configuration issue).");
    }
    
    // Check rate limits
    if (!rateLimiter.canMakeRequest()) {
        const waitTime = rateLimiter.getWaitTime();
        throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before trying again.`);
    }
    
    try {
        rateLimiter.recordRequest();
        const response = await ai.models.generateContent({
            model: GEMINI_CHAT_MODEL_BACKEND,
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });
        
        // Log the raw AI response for debugging
        console.log("[GeminiService] Raw AI response:", response.text);
        
        // Parse and clean JSON as per guidelines
        let jsonStr = response.text.trim();
        // Fallback: Remove code block wrappers if present
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```[a-zA-Z0-9]*\s*/, '').replace(/```$/, '').trim();
        }
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
          jsonStr = match[2].trim();
        }
        try {
          return JSON.parse(jsonStr);
        } catch (e) {
          console.error("Backend failed to parse JSON response from Gemini:", jsonStr, e);
          throw new Error("AI returned an invalid JSON format from backend.");
        }
    } catch (error) {
        console.error(`[GeminiService] generateJson error (attempt ${retryCount + 1}):`, error.message);
        
        if (isQuotaExceededError(error)) {
            const retryDelay = RATE_LIMIT_CONFIG.retryDelayMs * Math.pow(AI_CONFIG.rateLimits.backoffMultiplier, retryCount);
            console.log(`[GeminiService] Quota exceeded, retrying in ${retryDelay}ms...`);
            
            if (retryCount < RATE_LIMIT_CONFIG.maxRetries) {
                await sleep(retryDelay);
                return generateJson(prompt, retryCount + 1);
            } else {
                throw new Error(AI_CONFIG.messages.quotaExceeded);
            }
        }
        
        if (isRetryableError(error) && retryCount < RATE_LIMIT_CONFIG.maxRetries) {
            const retryDelay = RATE_LIMIT_CONFIG.retryDelayMs * Math.pow(AI_CONFIG.rateLimits.backoffMultiplier, retryCount);
            console.log(`[GeminiService] Retryable error, retrying in ${retryDelay}ms...`);
            await sleep(retryDelay);
            return generateJson(prompt, retryCount + 1);
        }
        
        throw error;
    }
};

const extractSerialsFromPdf = async (base64PdfData) => {
    if (!ai) {
        throw new Error("AI service not available (backend configuration issue).");
    }

    const pdfPart = {
        inlineData: {
            mimeType: 'application/pdf',
            data: base64PdfData,
        },
    };

    const textPart = {
        text: `Extract all unique serial numbers from the provided PDF document. Serial numbers are typically alphanumeric strings that can include hyphens. They are often listed in a column or table. List all found serial numbers in a flat JSON array of strings. Do not include any other text or explanation. If no serial numbers are found, return an empty array [].`
    };

    const response = await ai.models.generateContent({
        model: GEMINI_CHAT_MODEL_BACKEND,
        contents: { parts: [pdfPart, textPart] },
        config: { responseMimeType: "application/json" }
    });
    
    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
          return parsed.map(String).filter(Boolean); // ensure all elements are truthy strings
      }
      // If the AI returns a single object instead of an array (e.g., { "serials": [...] }), try to find the array.
      if(typeof parsed === 'object' && parsed !== null){
          const key = Object.keys(parsed).find(k => Array.isArray(parsed[k]));
          if(key) return parsed[key].map(String).filter(Boolean);
      }
      throw new Error("AI response was valid JSON but not an array of serials.");
    } catch (e) {
      console.error("Backend failed to parse JSON response from Gemini for PDF extraction:", jsonStr, e);
      throw new Error("AI returned an invalid JSON format.");
    }
};

// New advanced logistics optimization functions
const optimizeShippingRoute = async (origin, destination, constraints) => {
    if (!ai) {
        throw new Error("AI service not available (backend configuration issue).");
    }

    const prompt = `Analyze the shipping route from ${origin} to ${destination} with the following constraints: ${JSON.stringify(constraints)}.
    
    Provide optimization recommendations in JSON format:
    {
        "optimalRoute": {
            "waypoints": [],
            "estimatedTime": "",
            "estimatedCost": "",
            "riskFactors": []
        },
        "alternativeRoutes": [],
        "costSavings": "",
        "timeSavings": "",
        "recommendations": []
    }`;

    return await generateJson(prompt);
};

const forecastInventory = async (historicalData, currentStock, leadTimes) => {
    if (!ai) {
        throw new Error("AI service not available (backend configuration issue).");
    }

    const prompt = `Based on the following data, provide inventory forecasting recommendations:
    
    Historical Data: ${JSON.stringify(historicalData)}
    Current Stock: ${JSON.stringify(currentStock)}
    Lead Times: ${JSON.stringify(leadTimes)}
    
    Return JSON format:
    {
        "forecast": {
            "nextMonth": {},
            "nextQuarter": {},
            "nextYear": {}
        },
        "reorderPoints": {},
        "riskItems": [],
        "optimizationSuggestions": []
    }`;

    return await generateJson(prompt);
};

const analyzeSupplierPerformance = async (supplierData, orderHistory) => {
    if (!ai) {
        throw new Error("AI service not available (backend configuration issue).");
    }

    const prompt = `Analyze supplier performance based on:
    
    Supplier Data: ${JSON.stringify(supplierData)}
    Order History: ${JSON.stringify(orderHistory)}
    
    Return JSON format:
    {
        "performanceScore": 0,
        "onTimeDelivery": 0,
        "qualityRating": 0,
        "costEffectiveness": 0,
        "recommendations": [],
        "riskAssessment": ""
    }`;

    return await generateJson(prompt);
};

const optimizeWarehouseLayout = async (currentLayout, inventoryData, orderPatterns) => {
    if (!ai) {
        throw new Error("AI service not available (backend configuration issue).");
    }

    const prompt = `Optimize warehouse layout based on:
    
    Current Layout: ${JSON.stringify(currentLayout)}
    Inventory Data: ${JSON.stringify(inventoryData)}
    Order Patterns: ${JSON.stringify(orderPatterns)}
    
    Return JSON format:
    {
        "optimizedLayout": {},
        "efficiencyImprovements": "",
        "spaceUtilization": 0,
        "pickPathOptimization": {},
        "recommendations": []
    }`;

    return await generateJson(prompt);
};

const generateProcurementInsights = async (procurementData, marketTrends) => {
    if (!ai) {
        throw new Error("AI service not available (backend configuration issue).");
    }

    const prompt = `Generate procurement insights based on:
    
    Procurement Data: ${JSON.stringify(procurementData)}
    Market Trends: ${JSON.stringify(marketTrends)}
    
    Return JSON format:
    {
        "costAnalysis": {},
        "supplierRecommendations": [],
        "negotiationPoints": [],
        "riskMitigation": [],
        "marketOpportunities": []
    }`;

    return await generateJson(prompt);
};

// Utility: List available Gemini models using the current API key
if (require.main === module) {
    (async () => {
        if (!ai) {
            console.error('Gemini AI is not configured. Set GEMINI_API_KEY in your environment.');
            process.exit(1);
        }
        try {
            const models = await ai.models.list();
            console.log('Available Gemini models:');
            for (const model of models) {
                console.log(`- ${model.name} (ID: ${model.id})`);
            }
        } catch (err) {
            console.error('Failed to list Gemini models:', err);
        }
    })();
}

module.exports = {
    getChatStream,
    generateText,
    generateJson,
    extractSerialsFromPdf,
    optimizeShippingRoute,
    forecastInventory,
    analyzeSupplierPerformance,
    optimizeWarehouseLayout,
    generateProcurementInsights,
    isQuotaExceededError,
    isRetryableError,
};
