# DocScan - AI-Powered Document Scanner

A modern web application for scanning, storing, and comparing text documents with an integrated credit system and AI-powered matching capabilities.

## Features

- **User Authentication**: Secure registration and login system
- **Document Management**: Upload, view, and organize text documents
- **AI-Powered Scanning**: Scan documents to find similar content using advanced matching algorithms
- **Credit System**: Built-in credit system with daily free credits and admin-approved credit requests
- **Scan History**: Track all document scans with detailed results
- **Admin Dashboard**: Comprehensive admin panel for user management, credit approvals, and analytics
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## Project Structure

```
docSys/
├── index.js                # Main entry point
├── .env                    # Environment variables
├── uploads/                # Temporary storage for uploaded files
├── storage/                # Fallback storage when Redis is unavailable
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── utils/              # Utility functions
└── public/                 # frontend files
```


## Technologies Used

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- Redis (optional, for document caching)
- JWT for authentication
- bcrypt for password hashing

### Frontend
- HTML5, CSS3, JavaScript
- Font Awesome for icons
- Responsive design principles

## Requirements

- Node.js (v14 or higher)
- MongoDB
- Redis (optional, falls back to file storage)

## Installation

1. Clone the repository
   ```
   git clone <repository-url>
   cd docscan
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with the following content:
   ```
   PORT=3000
   URL_MONGO=mongodb://localhost:27017/docscan
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_jwt_secret_key
   DAILY_FREE_CREDITS=20
   AI_MATCHING_ENABLED=true
   HUGGINGFACE_API_TOKEN=your_huggingface_token (optional)
   ```

4. Create required directories
   ```
   mkdir -p uploads storage
   ```

5. Start the application
   ```
   npm start
   ```

6. Access the application at http://localhost:3000

## Usage

### User Roles

- **Regular Users**: Can upload documents, scan for matches, and request credits
- **Admin Users**: Can manage users, approve credit requests, and view analytics

### Document Scanning

1. Navigate to the "Scan Document" page
2. Upload a text document
3. Choose whether to use AI for better matching (costs 1 credit)
4. View the scan results and potential matches

### Credit System

- Each user receives daily free credits
- Additional credits can be requested through the Credits page
- Admins can approve or reject credit requests

## API Documentation

Complete API documentation is available in Postman:

[DocScan API Documentation](https://documenter.getpostman.com/view/30265715/2sAYdoGTCK)

The application provides a RESTful API with the following main endpoints:

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/profile` - Get user profile

### Documents
- `POST /api/documents/scan` - Scan a document
- `GET /api/documents` - Get all user documents
- `GET /api/documents/:id` - Get a specific document
- `GET /api/documents/history` - Get scan history

### Credits
- `POST /api/credits/request` - Request additional credits
- `GET /api/credits/requests` - Get user's credit requests
- `GET /api/credits/admin/requests` - (Admin) Get all credit requests
- `PUT /api/credits/admin/requests/:id` - (Admin) Update credit request status

### Analytics
- `GET /api/analytics` - (Admin) Get system analytics

For detailed request and response examples, please refer to the [Postman documentation](https://documenter.getpostman.com/view/30265715/2sAYdoGTCK).

## Development

### Adding New Features

1. Create necessary models in `src/models/`
2. Implement business logic in `src/services/`
3. Create controllers in `src/controllers/`
4. Define routes in `src/routes/`
5. Update the frontend in `public/`

### Testing

The application includes comprehensive error handling and logging to facilitate debugging and testing.

## License

MIT