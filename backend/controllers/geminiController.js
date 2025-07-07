
// backend/controllers/geminiController.js
const geminiServiceBackend = require('../services/geminiServiceBackend');

const handleChatStream = async (req, res, next) => {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: 'Valid "message" string is required.' });
    }
    if (history && !Array.isArray(history)) {
        return res.status(400).json({ message: '"history" must be an array if provided.' });
    }

    try {
        const stream = await geminiServiceBackend.getChatStream(message, history);
        
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of stream) {
            if (chunk.text) {
                res.write(chunk.text);
            }
        }
        res.end();
    } catch (error) {
        console.error('Error in handleChatStream:', error.message);
        if (!res.headersSent) {
            const statusCode = error.message.includes("not available") ? 503 : 500;
            res.status(statusCode).json({ message: error.message || "Error streaming AI chat response." });
        } else {
            res.end(); // End stream if headers already sent
        }
    }
};

const handlePdfExtraction = async (req, res, next) => {
    const { pdfData } = req.body;
    if (!pdfData || typeof pdfData !== 'string') {
        return res.status(400).json({ message: 'Valid "pdfData" base64 string is required.' });
    }
    try {
        const serials = await geminiServiceBackend.extractSerialsFromPdf(pdfData);
        res.json({ serials });
    } catch (error) {
        console.error('Error in handlePdfExtraction:', error.message);
        const statusCode = error.message.includes("not available") ? 503 : 500;
        res.status(statusCode).json({ message: error.message || "Error extracting serials from PDF." });
    }
};

module.exports = {
    handleChatStream,
    handlePdfExtraction,
};
