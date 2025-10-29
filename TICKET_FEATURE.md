# Ticket Creation Feature

## Overview
This feature allows users to create IT support tickets with the following capabilities:
- Required fields: title and description
- Priority selection: LOW, MEDIUM, HIGH, CRITICAL
- Optional image attachment (up to 5MB)
- Automatic status assignment (OPEN)
- User association via JWT authentication

## Backend API Endpoints

### POST /tickets
Create a new ticket.

**Authentication**: Required (JWT Bearer token)

**Request Body** (multipart/form-data):
```json
{
  "title": "Cannot access email",
  "description": "Getting error when trying to login to email client",
  "priority": "HIGH"
}
```

Optional file field: `image` (max 5MB, jpg/jpeg/png/gif)

**Response**:
```json
{
  "message": "Ticket created successfully",
  "ticket": {
    "id": "uuid",
    "title": "Cannot access email",
    "description": "Getting error when trying to login to email client",
    "priority": "HIGH",
    "status": "OPEN",
    "imageUrl": "/uploads/filename.jpg",
    "userId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "username": "testuser",
      "email": "test@example.com"
    }
  }
}
```

### GET /tickets
List all tickets for the authenticated user.

**Authentication**: Required (JWT Bearer token)

**Response**:
```json
[
  {
    "id": "uuid",
    "title": "Ticket title",
    "description": "Ticket description",
    "priority": "MEDIUM",
    "status": "OPEN",
    "imageUrl": null,
    "userId": "uuid",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "username": "testuser",
      "email": "test@example.com"
    }
  }
]
```

### GET /tickets/:id
Get a specific ticket.

**Authentication**: Required (JWT Bearer token)

**Response**: Same as single ticket object above

## Frontend Routes

- `/tickets/create` - Create new ticket form
- `/dashboard` - View list of user's tickets

## Database Schema

### Ticket Model
```prisma
model Ticket {
  id          String   @id @default(uuid())
  title       String
  description String
  priority    Priority @default(MEDIUM)
  status      Status   @default(OPEN)
  imageUrl    String?
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum Status {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}
```

## Testing

### Unit Tests
- 10 test cases for TicketsService covering:
  - Ticket creation with and without images
  - Listing all user tickets
  - Retrieving specific tickets
  - User isolation (users can only access their own tickets)

### Test Coverage
- TicketsService: 100%
- Overall backend: >80% coverage maintained

## Security Features
1. JWT authentication required for all endpoints
2. File upload validation:
   - Only image types allowed (jpg, jpeg, png, gif)
   - Maximum file size: 5MB
3. User isolation: Users can only create and view their own tickets
4. Input validation using class-validator decorators
5. No vulnerabilities detected by CodeQL scanner

## Future Enhancements
- Add e2e tests for ticket creation flow
- Implement ticket update and delete functionality
- Add ticket assignment to support staff
- Implement ticket status transitions
- Add comments/notes to tickets
- Email notifications for ticket creation
