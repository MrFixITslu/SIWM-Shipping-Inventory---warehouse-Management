# Windows Troubleshooting Guide for Vision79 SIWM

This guide helps you resolve common issues when running Vision79 SIWM on Windows.

## 🚀 Quick Start

### Option 1: Simple Development Setup
```bash
# Double-click this file or run in PowerShell:
.\start-dev.bat
```

### Option 2: PowerShell Setup
```powershell
# Run in PowerShell:
.\start-dev.ps1
```

### Option 3: Manual Setup
```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Generate secrets
npm run generate-secrets

# Start development
npm run dev
```

## 🔧 Common Issues and Solutions

### 1. Docker Compose Not Found

**Error:** `docker-compose : The term 'docker-compose' is not recognized`

**Solutions:**
- Use the new Docker Compose command: `docker compose` (without hyphen)
- Install Docker Compose separately: `winget install Docker.DockerCompose`
- Use Docker Desktop which includes Compose

**Alternative:** Start databases manually
```bash
# Install PostgreSQL and Redis manually, or use:
docker compose up -d postgres redis
```

### 2. Node.js Not Found

**Error:** `node : The term 'node' is not recognized`

**Solution:**
1. Download Node.js from https://nodejs.org/
2. Install Node.js 18+ (LTS version recommended)
3. Restart your terminal/PowerShell
4. Verify installation: `node --version`

### 3. npm Not Found

**Error:** `npm : The term 'npm' is not recognized`

**Solution:**
- npm comes with Node.js, reinstall Node.js
- Or install npm separately: `winget install OpenJS.NodeJS`

### 4. PowerShell Execution Policy

**Error:** `Cannot be loaded because running scripts is disabled`

**Solution:**
```powershell
# Run PowerShell as Administrator and execute:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 5. Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solutions:**
```bash
# Find process using port 5173 (frontend)
netstat -ano | findstr :5173

# Find process using port 4000 (backend)
netstat -ano | findstr :4000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### 6. Database Connection Issues

**Error:** `ECONNREFUSED` or database connection failures

**Solutions:**
1. **Using Docker:**
   ```bash
   docker compose up -d postgres redis
   ```

2. **Manual Installation:**
   - Install PostgreSQL: https://www.postgresql.org/download/windows/
   - Install Redis: https://github.com/microsoftarchive/redis/releases
   - Or use cloud databases

3. **Check Database Status:**
   ```bash
   # Check if PostgreSQL is running
   netstat -ano | findstr :5432
   
   # Check if Redis is running
   netstat -ano | findstr :6379
   ```

### 7. Environment File Issues

**Error:** Missing environment variables

**Solution:**
```bash
# Copy example files
copy .env.example .env
copy backend\.env.example backend\.env

# Edit the files with your configuration
notepad .env
notepad backend\.env
```

### 8. Build Failures

**Error:** Build process fails

**Solutions:**
1. **Clear cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

2. **Update Node.js:**
   - Ensure you're using Node.js 18+

3. **Check disk space:**
   ```powershell
   Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, FreeSpace, Size
   ```

### 9. SSL Certificate Issues

**Error:** SSL certificate problems

**Solutions:**
1. **For Development:** Use HTTP instead of HTTPS
   ```bash
   npm run dev:http
   ```

2. **Generate Self-Signed Certificates:**
   ```bash
   npm run generate-ssl
   ```

3. **Use mkcert for local HTTPS:**
   ```bash
   # Install mkcert
   winget install FiloSottile.mkcert
   
   # Generate certificates
   mkcert -install
   mkcert localhost
   ```

### 10. Performance Issues

**Solutions:**
1. **Increase Node.js memory:**
   ```bash
   set NODE_OPTIONS=--max-old-space-size=4096
   npm run dev
   ```

2. **Disable antivirus scanning for project folder**
3. **Use SSD instead of HDD**
4. **Close unnecessary applications**

## 🛠️ Development Tools

### Recommended Tools:
- **VS Code:** https://code.visualstudio.com/
- **Postman:** https://www.postman.com/ (for API testing)
- **DBeaver:** https://dbeaver.io/ (for database management)
- **Redis Desktop Manager:** https://github.com/uglide/RedisDesktopManager

### VS Code Extensions:
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Tailwind CSS IntelliSense
- PostgreSQL

## 📊 Monitoring and Debugging

### Check System Resources:
```powershell
# CPU and Memory usage
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10

# Disk usage
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, FreeSpace, Size

# Network connections
netstat -an | findstr :5173
netstat -an | findstr :4000
```

### View Logs:
```bash
# Application logs
Get-Content logs\app.log -Tail 20

# Real-time logs
Get-Content logs\app.log -Wait
```

### Debug Mode:
```bash
# Start with debug logging
set DEBUG=* && npm run dev
```

## 🔒 Security Checklist

- [ ] Change default passwords in `.env` files
- [ ] Use strong JWT secrets
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Regular security updates
- [ ] Monitor for suspicious activity

## 📞 Getting Help

### Before Asking for Help:
1. Check this troubleshooting guide
2. Check the main `TROUBLESHOOTING.md` file
3. Check the `README.md` for setup instructions
4. Search existing issues

### When Reporting Issues:
1. Include your Windows version
2. Include Node.js and npm versions
3. Include the exact error message
4. Include steps to reproduce the issue
5. Include relevant log files

### Useful Commands:
```bash
# System information
systeminfo

# Node.js version
node --version && npm --version

# Docker version
docker --version

# Check if ports are in use
netstat -ano | findstr :5173
netstat -ano | findstr :4000
```

## 🎯 Quick Commands Reference

```bash
# Development
.\start-dev.bat                    # Quick start
.\start-dev.ps1                    # PowerShell start
npm run dev                        # Manual start

# Production
.\deploy-production.bat            # Quick deployment
.\deploy-production.ps1            # PowerShell deployment
npm run build                      # Build for production

# Database
docker compose up -d postgres redis  # Start databases
docker compose down                 # Stop databases

# Monitoring
.\monitor.ps1                      # System monitoring
Get-Content logs\app.log -Tail 20  # View recent logs
```

---

**Need more help?** Check the main documentation files or create an issue with detailed information about your problem. 