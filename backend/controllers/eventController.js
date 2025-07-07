
const sseService = require('../services/sseService');

const handleSseConnection = (req, res, next) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // Flush the headers to establish the connection

    sseService.addClient(res);
};

module.exports = {
    handleSseConnection,
};
