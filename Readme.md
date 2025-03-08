# Document Scanner System

A web application for scanning and comparing text documents with a built-in credit system.

## Features

- User authentication (register, login)
- Credit system (daily free credits, credit requests)
- Document scanning and similarity matching
- Admin dashboard with analytics

## Requirements

- Node.js (v14 or higher)
- MongoDB
- Redis

## Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd document-scanner
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with the following content:
   ```
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/document-scanner
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_jwt_secret_key
   DAILY_FREE_CREDITS=20
   ```

4. Create uploads directory
   ```
   mkdir -p src/uploads
   ```

5. Start Redis server
   ```
   redis-server
   ```

6. Start the application
   ```
   node src/server.js
   ```

7. Access the application at http://localhost:3000

## API Documentation

Import the Postman collection for easy API testing.

## License

MIT