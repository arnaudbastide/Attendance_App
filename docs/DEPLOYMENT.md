# Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the Roc4Tech Attendance Management System in production environments.

## Deployment Options

### 1. Docker Deployment (Recommended)
### 2. Traditional Server Deployment
### 3. Cloud Platform Deployment
### 4. Kubernetes Deployment

## Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04 LTS or CentOS 8
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 20GB free space
- **Network**: Stable internet connection

### Software Requirements
- **Node.js**: v16.x or higher
- **PostgreSQL**: v12.x or higher
- **Nginx**: Web server and reverse proxy
- **Redis**: For caching and sessions (optional)
- **Docker**: v20.x or higher (for Docker deployment)
- **Git**: Version control

## Production Checklist

### Security
- [ ] SSL/TLS certificates
- [ ] Firewall configuration
- [ ] Database encryption
- [ ] Environment variables secured
- [ ] API rate limiting enabled
- [ ] CORS properly configured

### Performance
- [ ] Database indexing
- [ ] Connection pooling
- [ ] Caching enabled
- [ ] CDN configuration
- [ ] Load balancing setup

### Monitoring
- [ ] Application monitoring
- [ ] Database monitoring
- [ ] Server monitoring
- [ ] Log aggregation
- [ ] Alert configuration

### Backup
- [ ] Database backup strategy
- [ ] File backup strategy
- [ ] Disaster recovery plan
- [ ] Regular backup testing

## Docker Deployment

### Step 1: Prepare Environment

1. **Install Docker and Docker Compose**
   ```bash
   # Ubuntu
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker $USER
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Create project directory**
   ```bash
   mkdir -p /opt/roc4tech-attendance
   cd /opt/roc4tech-attendance
   ```

### Step 2: Create Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:14-alpine
    container_name: roc4tech-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: roc4tech_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: roc4tech_attendance
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db-init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - roc4tech-network

  # Backend API
  backend:
    build: ./backend
    container_name: roc4tech-backend
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: roc4tech_attendance
      DB_USER: roc4tech_user
      DB_PASSWORD: ${DB_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRE: 7d
      PORT: 5000
    ports:
      - "5000:5000"
    depends_on:
      - postgres
    networks:
      - roc4tech-network

  # Admin Dashboard
  admin-dashboard:
    build: ./admin-dashboard
    container_name: roc4tech-admin
    restart: unless-stopped
    environment:
      REACT_APP_API_URL: http://backend:5000/api
      GENERATE_SOURCEMAP: false
    ports:
      - "3000:80"
    depends_on:
      - backend
    networks:
      - roc4tech-network

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: roc4tech-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - admin-dashboard
    networks:
      - roc4tech-network

volumes:
  postgres_data:

networks:
  roc4tech-network:
    driver: bridge
```

### Step 3: Create Environment Configuration

Create `.env` file:

```bash
# Database
DB_PASSWORD=your_secure_db_password

# JWT
JWT_SECRET=your_super_secure_jwt_secret_key

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password

# SSL (Optional)
SSL_CERT_PATH=./ssl/cert.pem
SSL_KEY_PATH=./ssl/key.pem
```

### Step 4: Create Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:5000;
    }

    upstream admin {
        server admin-dashboard:80;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=admin:10m rate=5r/s;

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

        # Backend API
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
        }

        # WebSocket support
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Admin Dashboard
        location / {
            limit_req zone=admin burst=10 nodelay;
            
            proxy_pass http://admin/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options nosniff;
        }
    }
}
```

### Step 5: Deploy

```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## Traditional Server Deployment

### Step 1: Server Setup

1. **Update system**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install dependencies**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # Install Nginx
   sudo apt install nginx
   
   # Install PM2 for process management
   sudo npm install -g pm2
   ```

### Step 2: Database Setup

1. **Create database and user**
   ```bash
   sudo -u postgres psql
   ```
   ```sql
   CREATE DATABASE roc4tech_attendance;
   CREATE USER roc4tech_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE roc4tech_attendance TO roc4tech_user;
   \q
   ```

2. **Configure PostgreSQL**
   ```bash
   sudo nano /etc/postgresql/14/main/postgresql.conf
   ```
   ```
   # Connection Settings
   listen_addresses = 'localhost'
   port = 5432
   max_connections = 100
   
   # Memory Settings
   shared_buffers = 256MB
   effective_cache_size = 1GB
   work_mem = 4MB
   ```

### Step 3: Backend Deployment

1. **Clone and setup backend**
   ```bash
   cd /opt
   sudo git clone https://github.com/your-org/roc4tech-attendance.git
   cd roc4tech-attendance/backend
   
   # Install dependencies
   npm install --production
   
   # Copy environment file
   cp .env.example .env
   nano .env  # Edit with production values
   ```

2. **Setup PM2**
   ```bash
   # Create PM2 ecosystem file
   nano ecosystem.config.js
   ```
   ```javascript
   module.exports = {
     apps: [{
       name: 'roc4tech-backend',
       script: 'server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 5000
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   ```

3. **Start backend**
   ```bash
   pm2 start ecosystem.config.js
   pm2 startup
   pm2 save
   ```

### Step 4: Admin Dashboard Deployment

1. **Build admin dashboard**
   ```bash
   cd ../admin-dashboard
   npm install
   npm run build
   ```

2. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/roc4tech-admin
   ```
   ```nginx
   server {
       listen 80;
       server_name admin.your-domain.com;
   
       location / {
           root /opt/roc4tech-attendance/admin-dashboard/build;
           index index.html;
           try_files $uri $uri/ /index.html;
       }
   
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/roc4tech-admin /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### Step 5: SSL Certificate

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d admin.your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Cloud Platform Deployment

### AWS Deployment

1. **EC2 Instance Setup**
   ```bash
   # Launch EC2 instance (Ubuntu 20.04)
   # Security group: Allow ports 22, 80, 443, 5000
   ```

2. **RDS Database Setup**
   ```bash
   # Create PostgreSQL RDS instance
   # Configure security groups
   # Note connection endpoint
   ```

3. **S3 for File Storage**
   ```bash
   # Create S3 bucket for file uploads
   # Configure IAM roles
   ```

4. **CloudFront CDN**
   ```bash
   # Create CloudFront distribution
   # Configure custom domain
   ```

### Google Cloud Platform

1. **Compute Engine**
   ```bash
   # Create VM instance
   # Configure firewall rules
   ```

2. **Cloud SQL**
   ```bash
   # Create PostgreSQL instance
   # Configure private IP
   ```

3. **Cloud Storage**
   ```bash
   # Create bucket for uploads
   # Configure lifecycle policies
   ```

### Azure Deployment

1. **Virtual Machine**
   ```bash
   # Create Linux VM
   # Configure network security groups
   ```

2. **Azure Database for PostgreSQL**
   ```bash
   # Create database instance
   # Configure connection security
   ```

3. **Azure Blob Storage**
   ```bash
   # Create storage account
   # Configure CORS settings
   ```

## Kubernetes Deployment

### Step 1: Create Kubernetes Manifests

1. **Namespace**
   ```yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: roc4tech-attendance
   ```

2. **PostgreSQL Deployment**
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: postgres
     namespace: roc4tech-attendance
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: postgres
     template:
       metadata:
         labels:
           app: postgres
       spec:
         containers:
         - name: postgres
           image: postgres:14-alpine
           env:
           - name: POSTGRES_USER
             value: roc4tech_user
           - name: POSTGRES_PASSWORD
             valueFrom:
               secretKeyRef:
                 name: postgres-secret
                 key: password
           - name: POSTGRES_DB
             value: roc4tech_attendance
           ports:
           - containerPort: 5432
           volumeMounts:
           - name: postgres-storage
             mountPath: /var/lib/postgresql/data
         volumes:
         - name: postgres-storage
           persistentVolumeClaim:
             claimName: postgres-pvc
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: postgres-service
     namespace: roc4tech-attendance
   spec:
     selector:
       app: postgres
     ports:
     - port: 5432
       targetPort: 5432
   ```

3. **Backend Deployment**
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: backend
     namespace: roc4tech-attendance
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: backend
     template:
       metadata:
         labels:
           app: backend
       spec:
         containers:
         - name: backend
           image: your-registry/roc4tech-backend:latest
           env:
           - name: NODE_ENV
             value: production
           - name: DB_HOST
             value: postgres-service
           - name: DB_PASSWORD
             valueFrom:
               secretKeyRef:
                 name: postgres-secret
                 key: password
           ports:
           - containerPort: 5000
   ---
   apiVersion: v1
   kind: Service
   metadata:
     name: backend-service
     namespace: roc4tech-attendance
   spec:
     selector:
       app: backend
     ports:
     - port: 5000
       targetPort: 5000
   ```

### Step 2: Deploy to Kubernetes

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Create secrets
kubectl create secret generic postgres-secret \
  --from-literal=password=your_secure_password \
  -n roc4tech-attendance

# Deploy applications
kubectl apply -f postgres-deployment.yaml
kubectl apply -f backend-deployment.yaml
kubectl apply -f admin-deployment.yaml

# Create ingress
kubectl apply -f ingress.yaml
```

## Monitoring and Logging

### Application Monitoring

1. **PM2 Monitoring**
   ```bash
   pm2 monit
   pm2 logs
   ```

2. **Health Checks**
   ```bash
   curl http://localhost:5000/health
   ```

### Database Monitoring

1. **PostgreSQL Monitoring**
   ```sql
   -- Check active connections
   SELECT * FROM pg_stat_activity;
   
   -- Check database size
   SELECT pg_size_pretty(pg_database_size('roc4tech_attendance'));
   ```

2. **Query Performance**
   ```sql
   -- Enable query statistics
   CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
   
   -- Check slow queries
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY total_time DESC
   LIMIT 10;
   ```

### Server Monitoring

1. **System Resources**
   ```bash
   # CPU usage
   top
   htop
   
   # Memory usage
   free -h
   
   # Disk usage
   df -h
   
   # Network connections
   netstat -tuln
   ```

2. **Log Management**
   ```bash
   # System logs
   sudo journalctl -f
   
   # Application logs
   tail -f /var/log/nginx/error.log
   tail -f /opt/roc4tech-attendance/backend/logs/out.log
   ```

## Backup and Recovery

### Database Backup

```bash
# Full database backup
pg_dump -U roc4tech_user -h localhost roc4tech_attendance > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/opt/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -U roc4tech_user -h localhost roc4tech_attendance | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +7 -delete
```

### File Backup

```bash
# Backup uploaded files
rsync -av /opt/roc4tech-attendance/backend/uploads/ /opt/backups/uploads/

# Backup configuration files
rsync -av /opt/roc4tech-attendance/backend/.env /opt/backups/config/
```

### Disaster Recovery

1. **Database Recovery**
   ```bash
   # Restore from backup
   psql -U roc4tech_user -h localhost roc4tech_attendance < backup.sql
   ```

2. **Application Recovery**
   ```bash
   # Restore configuration
   cp /opt/backups/config/.env /opt/roc4tech-attendance/backend/
   
   # Restart services
   pm2 restart all
   systemctl restart nginx
   ```

## Security Hardening

### Server Security

1. **Firewall Configuration**
   ```bash
   # UFW (Ubuntu)
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **SSH Hardening**
   ```bash
   sudo nano /etc/ssh/sshd_config
   ```
   ```
   Port 2222
   PermitRootLogin no
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```

### Application Security

1. **Environment Variables**
   ```bash
   # Secure .env file
   chmod 600 .env
   chown $USER:$USER .env
   ```

2. **SSL Configuration**
   ```nginx
   # Strong SSL configuration
   ssl_protocols TLSv1.2 TLSv1.3;
   ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
   ssl_prefer_server_ciphers off;
   ```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port
   sudo lsof -i :5000
   
   # Kill process
   sudo kill -9 <PID>
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL status
   sudo systemctl status postgresql
   
   # Check connection
   pg_isready -h localhost -p 5432
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER /opt/roc4tech-attendance
   sudo chmod -R 755 /opt/roc4tech-attendance
   ```

### Log Analysis

1. **Application Logs**
   ```bash
   # PM2 logs
   pm2 logs --lines 100
   
   # System logs
   sudo journalctl -u nginx -f
   ```

2. **Database Logs**
   ```bash
   # PostgreSQL logs
   sudo tail -f /var/log/postgresql/postgresql-14-main.log
   ```

## Support

For deployment support:
- Check troubleshooting section
- Review logs for errors
- Contact DevOps team
- Create GitHub issues for deployment bugs

---

**Next Steps**: After successful deployment, proceed to the monitoring and maintenance phase.