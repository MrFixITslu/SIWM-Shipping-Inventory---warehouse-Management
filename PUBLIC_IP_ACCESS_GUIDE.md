# Public IP Access Configuration Guide

## Overview
This guide explains how to configure the Vision79 SIWM system to allow authentication from users with public IP addresses.

## Backend Configuration

### 1. Environment Variables
Add the following to your `backend/.env` file:

```env
# Public IP Access Configuration
ALLOW_PUBLIC_IP=true

# Server Configuration
HOST=0.0.0.0
PORT=4000

# CORS Configuration (optional - leave empty for defaults)
CORS_ORIGIN=
```

### 2. Network Configuration

#### Windows Firewall
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings" and then "Allow another app"
4. Browse to your Node.js executable (usually `C:\Program Files\nodejs\node.exe`)
5. Add both Private and Public network access

#### Router Configuration
1. Access your router's admin panel (usually 192.168.1.1 or 192.168.0.1)
2. Navigate to Port Forwarding
3. Add a rule:
   - Protocol: TCP
   - External Port: 4000
   - Internal IP: Your computer's local IP
   - Internal Port: 4000

### 3. Security Considerations

#### Rate Limiting
The system includes built-in rate limiting:
- General requests: 500 requests per 15 minutes
- Authentication requests: 50 requests per 15 minutes

#### IP Logging
All authentication attempts are logged with IP addresses for security monitoring.

#### CORS Configuration
- Development mode allows all origins
- Production should specify exact allowed origins in `CORS_ORIGIN`

## Frontend Configuration

### 1. API Base URL
Update your frontend configuration to use your public IP:

```typescript
// In services/apiConfig.ts
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-public-domain.com/api/v1'
  : 'http://your-public-ip:4000/api/v1';
```

### 2. Environment Variables
Add to your frontend `.env`:

```env
VITE_API_BASE_URL=http://your-public-ip:4000/api/v1
```

## Testing Public Access

### 1. Find Your Public IP
```bash
# Windows
curl ifconfig.me

# Or visit whatismyipaddress.com
```

### 2. Test Connectivity
```bash
# Test if port is accessible
telnet your-public-ip 4000

# Test API endpoint
curl http://your-public-ip:4000/api/v1
```

### 3. Test Authentication
```bash
curl -X POST http://your-public-ip:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## Production Considerations

### 1. HTTPS Configuration
For production, use HTTPS:
```env
USE_HTTPS=true
SSL_CERT_PATH=/path/to/certificate.crt
SSL_KEY_PATH=/path/to/private.key
```

### 2. Reverse Proxy
Consider using Nginx or Apache as a reverse proxy:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. Security Headers
The system includes modern security headers via Helmet middleware.

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if backend is running
   - Verify firewall settings
   - Check router port forwarding

2. **CORS Errors**
   - Ensure `ALLOW_PUBLIC_IP=true` in backend
   - Check browser console for specific CORS errors

3. **Authentication Fails**
   - Verify user credentials exist in database
   - Check server logs for IP-based login attempts

### Debug Commands

```bash
# Check if port is listening
netstat -an | findstr :4000

# Check Node.js processes
tasklist | findstr node

# Kill all Node.js processes (if needed)
taskkill /IM node.exe /F
```

## Monitoring

### Log Files
The system logs:
- All authentication attempts with IP addresses
- CORS blocked origins
- Request IP addresses when public access is enabled

### Security Monitoring
Monitor these logs for:
- Unusual login patterns
- Failed authentication attempts
- Requests from unexpected IP ranges

## Support

For additional help:
1. Check server logs for error messages
2. Verify network configuration
3. Test with a simple curl request first
4. Ensure all environment variables are set correctly 