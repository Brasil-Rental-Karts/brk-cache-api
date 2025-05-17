# BRK Cache API

A high-performance Redis cache API built with Node.js, Express, TypeScript, and Redis. This API provides fast access to club entity data stored in Redis.

## Features

- Fast Redis-based caching system
- TypeScript for type safety
- Express.js for API routing
- Endpoints for retrieving club data:
  - Get all clubs
  - Get club by ID
  - Get clubs by name
- Extensible architecture for future entity types

## Project Structure

```
├── src/
│   ├── config/
│   │   └── redis.ts         # Redis connection configuration
│   ├── controllers/
│   │   └── club.controller.ts # Club data operations
│   ├── models/
│   │   └── club.model.ts    # Club entity model and interfaces
│   ├── routes/
│   │   ├── club.routes.ts   # Club API routes
│   │   └── index.ts         # Main routes index
│   └── index.ts             # Application entry point
├── .env                     # Environment variables
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Redis instance (configured in .env)

## Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in `.env` file (already set up)

## Running the API

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm run build
npm start
```

## API Endpoints

### Get all clubs
```
GET /api/clubs
```

### Get club by ID
```
GET /api/clubs/id/:id
```

### Get clubs by name
```
GET /api/clubs/name/:name
```

## Redis Data Format

### Key Pattern
```
clubs:<guid>
```

### Value Format (JSON)
```json
{
  "id": "0a7f18b9-d5b9-4901-b40c-4e05dc62a6e5",
  "createdAt": "2025-05-17T17:16:49.828799",
  "updatedAt": "2025-05-17T17:16:49.828799",
  "name": "BRK Racing Club",
  "foundationDate": null,
  "description": "The Racing Club from Redis",
  "logoUrl": null,
  "ownerId": "5054c02b-0a75-4d39-a888-4a8ed89dcff6",
  "_timestamp": 1747502209.828799
}
```

## Extending for Future Entities

To add support for a new entity type:

1. Create a new model file in `src/models/`
2. Create a new controller in `src/controllers/`
3. Create new routes in `src/routes/`
4. Add the routes to the main router in `src/routes/index.ts`

## Performance Considerations

- Uses Redis pipelining for batch operations
- Implements efficient error handling
- Optimized for fast response times
- Uses connection pooling with retry strategies