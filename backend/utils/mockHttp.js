// backend/utils/mockHttp.js

// Create a mock request object for testing
function createMockRequest(options = {}) {
    return {
        ip: options.ip || '127.0.0.1',
        headers: options.headers || {},
        body: options.body || {},
        query: options.query || {},
        params: options.params || {},
        method: options.method || 'GET',
        url: options.url || '/test',
        ...options
    };
}

// Create a mock response object for testing
function createMockResponse() {
    const res = {
        statusCode: 200,
        data: null,
        headers: {},
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        json: function(data) {
            this.data = data;
            return this;
        },
        send: function(data) {
            this.data = data;
            return this;
        },
        set: function(headers) {
            Object.assign(this.headers, headers);
            return this;
        }
    };
    
    return res;
}

// Create a mock next function for testing
function createMockNext() {
    return function(error) {
        if (error) {
            console.error('Mock next function called with error:', error);
        }
    };
}

module.exports = {
    createMockRequest,
    createMockResponse,
    createMockNext
}; 