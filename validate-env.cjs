#!/usr/bin/env node

/**
 * Vision79 SIWM Environment Validation Script
 * Validates production environment variables and tests connections
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
    log(`✅ ${message}`, 'green');
}

function logWarning(message) {
    log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
    log(`❌ ${message}`, 'red');
}

function logInfo(message) {
    log(`ℹ️  ${message}`, 'blue');
}

// Validation functions
function validateRequiredVariables(env) {
    logInfo('Validating required environment variables...');
    
    const required = [
        'NODE_ENV',
        'JWT_SECRET',
        'DB_USER',
        'DB_PASSWORD',
        'DB_HOST',
        'DB_NAME',
        'REDIS_URL',
        'REDIS_PASSWORD'
    ];
    
    const missing = [];
    
    for (const variable of required) {
        if (!env[variable]) {
            missing.push(variable);
        }
    }
    
    if (missing.length > 0) {
        logError(`Missing required variables: ${missing.join(', ')}`);
        return false;
    }
    
    logSuccess('All required variables are set');
    return true;
}

function validateSecurityVariables(env) {
    logInfo('Validating security configuration...');
    
    // Check JWT secret strength
    if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
        logError('JWT_SECRET is too weak (minimum 32 characters)');
        return false;
    }
    
    // Check session secret
    if (env.SESSION_SECRET && env.SESSION_SECRET.length < 32) {
        logError('SESSION_SECRET is too weak (minimum 32 characters)');
        return false;
    }
    
    // Check password requirements
    const passwordMinLength = parseInt(env.PASSWORD_MIN_LENGTH) || 8;
    if (passwordMinLength < 8) {
        logWarning('PASSWORD_MIN_LENGTH should be at least 8');
    }
    
    // Check bcrypt rounds
    const bcryptRounds = parseInt(env.BCRYPT_ROUNDS) || 10;
    if (bcryptRounds < 10) {
        logWarning('BCRYPT_ROUNDS should be at least 10 for production');
    }
    
    logSuccess('Security configuration is valid');
    return true;
}

function validateDatabaseConfiguration(env) {
    logInfo('Validating database configuration...');
    
    // Check database connection parameters
    if (!env.DB_HOST || !env.DB_USER || !env.DB_PASSWORD || !env.DB_NAME) {
        logError('Database connection parameters are incomplete');
        return false;
    }
    
    // Check SSL configuration
    if (env.DB_SSL !== 'true') {
        logWarning('Database SSL is not enabled - recommended for production');
    }
    
    // Check connection pool settings
    const poolMax = parseInt(env.DB_POOL_MAX) || 10;
    const poolMin = parseInt(env.DB_POOL_MIN) || 2;
    
    if (poolMax < 5) {
        logWarning('DB_POOL_MAX should be at least 5 for production');
    }
    
    if (poolMin < 2) {
        logWarning('DB_POOL_MIN should be at least 2 for production');
    }
    
    logSuccess('Database configuration is valid');
    return true;
}

function validateRedisConfiguration(env) {
    logInfo('Validating Redis configuration...');
    
    if (!env.REDIS_URL) {
        logError('REDIS_URL is not set');
        return false;
    }
    
    if (!env.REDIS_PASSWORD) {
        logWarning('REDIS_PASSWORD is not set - Redis will run without authentication');
    }
    
    // Check memory configuration
    const maxMemory = env.REDIS_MAX_MEMORY || '256mb';
    if (!maxMemory.includes('mb') && !maxMemory.includes('gb')) {
        logWarning('REDIS_MAX_MEMORY should specify units (mb/gb)');
    }
    
    logSuccess('Redis configuration is valid');
    return true;
}

function validateCorsConfiguration(env) {
    logInfo('Validating CORS configuration...');
    
    if (!env.ALLOWED_ORIGINS) {
        logError('ALLOWED_ORIGINS is not set');
        return false;
    }
    
    const origins = env.ALLOWED_ORIGINS.split(',');
    const hasHttps = origins.some(origin => origin.trim().startsWith('https://'));
    
    if (!hasHttps) {
        logWarning('No HTTPS origins found in ALLOWED_ORIGINS - recommended for production');
    }
    
    logSuccess('CORS configuration is valid');
    return true;
}

function validateRateLimiting(env) {
    logInfo('Validating rate limiting configuration...');
    
    const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS) || 900000;
    const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS) || 500;
    
    if (windowMs < 60000) {
        logWarning('RATE_LIMIT_WINDOW_MS is very short - consider increasing');
    }
    
    if (maxRequests > 1000) {
        logWarning('RATE_LIMIT_MAX_REQUESTS is very high - consider reducing for security');
    }
    
    logSuccess('Rate limiting configuration is valid');
    return true;
}

function validateEmailConfiguration(env) {
    logInfo('Validating email configuration...');
    
    const emailFields = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM_ADDRESS'];
    const missing = emailFields.filter(field => !env[field]);
    
    if (missing.length > 0) {
        logWarning(`Email configuration incomplete: ${missing.join(', ')}`);
        return false;
    }
    
    // Check email security
    if (env.EMAIL_SECURE !== 'true') {
        logWarning('EMAIL_SECURE should be true for production');
    }
    
    if (env.EMAIL_REQUIRE_TLS !== 'true') {
        logWarning('EMAIL_REQUIRE_TLS should be true for production');
    }
    
    logSuccess('Email configuration is valid');
    return true;
}

function validateAIServices(env) {
    logInfo('Validating AI services configuration...');
    
    if (!env.GEMINI_API_KEY) {
        logWarning('GEMINI_API_KEY is not set - AI features will be disabled');
        return false;
    }
    
    if (!env.GEMINI_API_ENDPOINT) {
        logWarning('GEMINI_API_ENDPOINT is not set - using default');
    }
    
    logSuccess('AI services configuration is valid');
    return true;
}

function validateMonitoringConfiguration(env) {
    logInfo('Validating monitoring configuration...');
    
    if (!env.SENTRY_DSN) {
        logWarning('SENTRY_DSN is not set - error tracking will be disabled');
    }
    
    if (!env.NEW_RELIC_LICENSE_KEY) {
        logWarning('NEW_RELIC_LICENSE_KEY is not set - performance monitoring will be disabled');
    }
    
    logSuccess('Monitoring configuration is valid');
    return true;
}

function validateLoggingConfiguration(env) {
    logInfo('Validating logging configuration...');
    
    const logLevel = env.LOG_LEVEL || 'info';
    const validLevels = ['error', 'warn', 'info', 'debug'];
    
    if (!validLevels.includes(logLevel)) {
        logWarning(`Invalid LOG_LEVEL: ${logLevel}`);
    }
    
    if (env.LOG_FORMAT !== 'json') {
        logWarning('LOG_FORMAT should be "json" for production');
    }
    
    logSuccess('Logging configuration is valid');
    return true;
}

// Test database connection
async function testDatabaseConnection(env) {
    logInfo('Testing database connection...');
    
    try {
        const { Pool } = require('pg');
        
        const pool = new Pool({
            user: env.DB_USER,
            host: env.DB_HOST,
            database: env.DB_NAME,
            password: env.DB_PASSWORD,
            port: parseInt(env.DB_PORT) || 5432,
            ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
            max: parseInt(env.DB_POOL_MAX) || 10,
            min: parseInt(env.DB_POOL_MIN) || 2,
            idleTimeoutMillis: parseInt(env.DB_POOL_IDLE_TIMEOUT) || 30000,
            acquireTimeoutMillis: parseInt(env.DB_POOL_ACQUIRE_TIMEOUT) || 60000
        });
        
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        await pool.end();
        
        logSuccess('Database connection successful');
        return true;
    } catch (error) {
        logError(`Database connection failed: ${error.message}`);
        return false;
    }
}

// Test Redis connection
async function testRedisConnection(env) {
    logInfo('Testing Redis connection...');
    
    try {
        const redis = require('redis');
        const client = redis.createClient({
            url: env.REDIS_URL,
            password: env.REDIS_PASSWORD
        });
        
        await client.connect();
        await client.ping();
        await client.disconnect();
        
        logSuccess('Redis connection successful');
        return true;
    } catch (error) {
        logError(`Redis connection failed: ${error.message}`);
        return false;
    }
}

// Main validation function
async function validateEnvironment() {
    console.log('🔍 Vision79 SIWM Environment Validation');
    console.log('=======================================');
    console.log('');
    
    // Load environment variables
    const envPath = path.join(__dirname, 'backend', '.env.production');
    
    if (!fs.existsSync(envPath)) {
        logError('backend/.env.production not found');
        logInfo('Run setup-env.sh first to create environment files');
        process.exit(1);
    }
    
    // Load dotenv
    require('dotenv').config({ path: envPath });
    
    const env = process.env;
    
    // Run validations
    const validations = [
        () => validateRequiredVariables(env),
        () => validateSecurityVariables(env),
        () => validateDatabaseConfiguration(env),
        () => validateRedisConfiguration(env),
        () => validateCorsConfiguration(env),
        () => validateRateLimiting(env),
        () => validateEmailConfiguration(env),
        () => validateAIServices(env),
        () => validateMonitoringConfiguration(env),
        () => validateLoggingConfiguration(env)
    ];
    
    let passed = 0;
    let total = validations.length;
    
    for (const validation of validations) {
        try {
            if (validation()) {
                passed++;
            }
        } catch (error) {
            logError(`Validation error: ${error.message}`);
        }
    }
    
    console.log('');
    console.log('📊 Validation Results');
    console.log('====================');
    console.log(`Passed: ${passed}/${total}`);
    
    if (passed === total) {
        logSuccess('All validations passed!');
    } else {
        logWarning(`${total - passed} validation(s) failed`);
    }
    
    // Test connections if database and Redis are configured
    if (env.DB_HOST && env.REDIS_URL) {
        console.log('');
        console.log('🔗 Connection Tests');
        console.log('==================');
        
        await testDatabaseConnection(env);
        await testRedisConnection(env);
    }
    
    console.log('');
    logInfo('Validation complete. Review any warnings or errors above.');
}

// Run validation
if (require.main === module) {
    validateEnvironment().catch(error => {
        logError(`Validation failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = {
    validateEnvironment,
    validateRequiredVariables,
    validateSecurityVariables,
    validateDatabaseConfiguration,
    validateRedisConfiguration,
    validateCorsConfiguration,
    validateRateLimiting,
    validateEmailConfiguration,
    validateAIServices,
    validateMonitoringConfiguration,
    validateLoggingConfiguration,
    testDatabaseConnection,
    testRedisConnection
}; 