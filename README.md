# Express DynamoDB Sandbox

A sandbox project that demonstrates how to use Express.js with DynamoDB, Node.js, Bluebird, Joi, Vogels, and Jade.

## Project Structure

```
express-dynamodb-sandbox/
├── server.js                 # Main server file
├── package.json              # Project dependencies
├── .env                      # Environment variables (gitignored)
├── .gitignore                # Git ignore file
├── configs/                  # Configuration files
│   ├── db.js                 # DynamoDB configuration
│   └── express.js            # Express configuration
├── lib/                      # Utility libraries
│   ├── logger.js             # Logging utility
│   └── validation.js         # Joi validation helper
├── models/                   # Database models
│   └── index.js              # Model exports
├── routes/                   # API routes
│   ├── index.js              # Route exports
│   └── users.js              # User routes example
├── scripts/                  # Utility scripts
│   ├── create-tables.js      # Script to create DynamoDB tables
│   └── test-connection.js    # Script to test DynamoDB connection
├── services/                 # Business logic
│   └── user-service.js       # User service example
├── views/                    # Jade templates
│   ├── layout.jade           # Main layout
│   ├── index.jade            # Home page
│   └── error.jade            # Error page
└── public/                   # Static assets
    ├── css/
    │   └── style.css         # Main stylesheet
    ├── js/
    │   └── main.js           # Main JavaScript file
    └── img/                  # Image directory
```

## Prerequisites

- Node.js (>= 14.0.0)
- npm or yarn
- DynamoDB Local (optional, for local development)

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd express-dynamodb-sandbox
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your configuration.

4. Install and run DynamoDB Local (optional):
   ```bash
   # Install DynamoDB Local
   mkdir -p dynamodb
   cd dynamodb
   wget https://d1ni2b6xgvw0s0.cloudfront.net/v2.x/dynamodb_local_latest.tar.gz
   tar -xzf dynamodb_local_latest.tar.gz
   cd ..
   
   # Run DynamoDB Local
   java -Djava.library.path=./dynamodb/DynamoDBLocal_lib -jar ./dynamodb/DynamoDBLocal.jar -sharedDb
   ```

5. Create DynamoDB tables:
   ```bash
   npm run create-tables
   ```

6. Start the server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

7. Access the application:
    - Web interface: http://localhost:3000
    - API endpoints: http://localhost:3000/api/users

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| GET | /api/users/:id | Get user by ID |
| POST | /api/users | Create a new user |
| PUT | /api/users/:id | Update a user |
| DELETE | /api/users/:id | Delete a user |

## Tech Stack

- **Backend:**
    - Node.js
    - Express.js
    - Jade (Template Engine)
    - AWS SDK for JavaScript
    - Bluebird (Promises)
    - Joi (Validation)
    - UUID (for generating IDs)

- **Database:**
    - Amazon DynamoDB Local (for development)
    - Amazon DynamoDB (for production)

## License

MIT