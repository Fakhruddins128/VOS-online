# VOS Backend - Node.js/Express API Server

This is the backend API server for the VOS (Vendor Order System) application, built with Node.js, Express, and Microsoft SQL Server.

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Initialize Database**
   ```bash
   node scripts/initDb.js
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📦 Dependencies

### Core Dependencies
- **express** - Web application framework
- **mssql** - Microsoft SQL Server driver
- **cors** - Cross-origin resource sharing
- **helmet** - Security middleware
- **morgan** - HTTP request logger
- **express-rate-limit** - Rate limiting middleware
- **express-validator** - Input validation and sanitization
- **dotenv** - Environment variable loader

### Development Dependencies
- **nodemon** - Development server with auto-restart

## 🔧 Configuration

### Environment Variables (.env)

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_SERVER=localhost
DB_DATABASE=VOS_DB
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=1433
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true

# Rate Limiting (all optional; defaults shown)
# Global limit applied to every request
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=1000
# Stricter limit for /api/users auth endpoints, keyed per IP + account.
# Only failed attempts are counted.
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=20
```

> Values must be positive integers; anything else falls back to the default.

### Database Setup

1. **Create Database**
   ```sql
   CREATE DATABASE VOS_DB;
   ```

2. **Run Initialization Script**
   ```bash
   node scripts/initDb.js
   ```

## 🛠️ API Endpoints

### Health Check
- `GET /health` - Server health status
- `GET /api/db-test` - Database connection test

### Users API
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user

### Products API
- `GET /api/products` - Get all products (supports filtering)
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Soft delete product
- `GET /api/products/categories` - Get distinct categories

## 🔒 Security Features

### Rate Limiting
- **General**: 100 requests per 15 minutes
- **Auth endpoints**: 5 requests per 15 minutes

### CORS Configuration
- Configured for specific origins
- Supports credentials
- Allows common HTTP methods

### Input Validation
- Server-side validation using express-validator
- Sanitization of user inputs
- Comprehensive error handling

### Security Headers
- Helmet middleware for security headers
- Content Security Policy
- XSS protection

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database connection configuration
├── middleware/
│   ├── errorHandler.js      # Global error handling
│   └── validation.js        # Input validation rules
├── routes/
│   ├── users.js            # User CRUD operations
│   └── products.js         # Product CRUD operations
├── scripts/
│   └── initDb.js           # Database initialization
├── sql/
│   └── schema.sql          # Database schema and sample data
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
├── server.js              # Main server file
└── README.md              # This file
```

## 🧪 Testing

### Manual Testing

1. **Health Check**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Database Test**
   ```bash
   curl http://localhost:5000/api/db-test
   ```

3. **Users API**
   ```bash
   # Get all users
   curl http://localhost:5000/api/users
   
   # Create user
   curl -X POST http://localhost:5000/api/users \
     -H "Content-Type: application/json" \
     -d '{"name":"John Doe","email":"john@example.com","phone":"123-456-7890"}'
   ```

4. **Products API**
   ```bash
   # Get all products
   curl http://localhost:5000/api/products
   
   # Get products by category
   curl "http://localhost:5000/api/products?category=Electronics"
   ```

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
   ```env
   NODE_ENV=production
   PORT=5000
   FRONTEND_URL=https://your-frontend-domain.com
   ```

2. **Database Configuration**
   - Use production database credentials
   - Enable SSL/TLS encryption
   - Configure connection pooling

3. **Security Considerations**
   - Use HTTPS
   - Configure proper CORS origins
   - Set up monitoring and logging
   - Implement authentication if needed

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔍 Monitoring

### Logging
- Morgan middleware for HTTP request logging
- Console logging for development
- Consider structured logging for production

### Health Monitoring
- `/health` endpoint for basic health checks
- `/api/db-test` for database connectivity
- Monitor response times and error rates

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   Error: Failed to connect to database
   ```
   - Check SQL Server is running
   - Verify credentials in `.env`
   - Ensure database exists
   - Check network connectivity

2. **Port Already in Use**
   ```
   Error: listen EADDRINUSE :::5000
   ```
   - Change PORT in `.env`
   - Kill process using the port: `netstat -ano | findstr :5000`

3. **CORS Errors**
   ```
   Access to fetch at 'http://localhost:5000' from origin 'http://localhost:5173' has been blocked by CORS policy
   ```
   - Check FRONTEND_URL in `.env`
   - Verify CORS configuration in `server.js`

4. **Validation Errors**
   - Check request body format
   - Ensure required fields are provided
   - Verify data types match validation rules

### Debug Mode

Enable debug logging:
```bash
DEBUG=* npm run dev
```

## 📝 Development

### Adding New Routes

1. Create route file in `routes/` directory
2. Add validation rules in `middleware/validation.js`
3. Import and use in `server.js`

### Database Changes

1. Update `sql/schema.sql`
2. Create migration script if needed
3. Test with `node scripts/initDb.js`

### Adding Middleware

1. Create middleware function
2. Add to appropriate route or globally in `server.js`
3. Test functionality

## 📊 Performance Tips

- Use connection pooling for database
- Implement caching for frequently accessed data
- Add pagination for large datasets
- Monitor and optimize slow queries
- Use compression middleware for responses

---

**For more information, see the main project README.md**