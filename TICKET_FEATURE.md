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

## Admin Features

### Admin Comment on Any Ticket (US-11)
Admins have the ability to comment on any ticket in the system, regardless of ownership. This enables support staff to provide direct assistance to users.

**Admin Endpoints:**
- `POST /admin/tickets/:id/comments` - Create comment on any ticket
- `GET /admin/tickets/:id/comments` - View all comments on any ticket

**Security:**
- Protected by JWT authentication + AdminGuard
- Only users with `isAdmin: true` can access admin endpoints
- Comments include user information with isAdmin flag for identification

**Testing:**
- 7 new tests added for admin comment functionality
- All tests passing (75 total)
- Test coverage maintained above 80%

### Admin User Management (US-12)
Admins have full CRUD capabilities to manage user accounts in the system. This enables admins to create new users, update existing users, view user details, and delete users as needed.

**Admin Endpoints:**
- `GET /admin/users` - List all users with pagination and sorting
  - Query parameters: `page` (default: 1), `limit` (default: 10, max: 100), `sortBy` (default: createdAt), `order` (asc/desc, default: desc)
  - Returns paginated list of users with metadata
- `GET /admin/users/:id` - Get specific user by ID
  - Returns user details including ticket and comment counts
- `POST /admin/users` - Create a new user
  - Required: username, email, password (min 6 chars)
  - Optional: isAdmin (default: false)
  - Password is automatically hashed with bcrypt
- `PATCH /admin/users/:id` - Update existing user
  - All fields optional: username, email, password, isAdmin
  - Validates uniqueness of username and email
  - Password is automatically hashed if provided
- `DELETE /admin/users/:id` - Delete a user
  - Cascade deletes related tickets, comments, etc.

**Security:**
- Protected by JWT authentication + AdminGuard
- Only users with `isAdmin: true` can access admin endpoints
- Passwords never returned in API responses
- Input validation using class-validator decorators
- Duplicate email/username detection
- No security vulnerabilities detected by CodeQL scanner

**Validation:**
- Username and email uniqueness enforced
- Email format validation
- Password minimum length: 6 characters
- Pagination limits: page > 0, limit between 1-100
- Sort fields limited to: createdAt, username, email

**Testing:**
- 23 unit tests covering all CRUD operations
- Test coverage: 91.66% for users module
- Edge cases tested: duplicates, not found, invalid pagination
- All tests passing

**Example Requests:**

List users with pagination:
```
GET /admin/users?page=1&limit=10&sortBy=createdAt&order=desc
```

Create a new user:
```json
POST /admin/users
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securepass123",
  "isAdmin": false
}
```

Update user:
```json
PATCH /admin/users/:id
{
  "email": "newemail@example.com",
  "isAdmin": true
}
```

## Future Enhancements
- Add e2e tests for ticket creation flow
- Implement ticket update and delete functionality
- Add ticket assignment to support staff
- Email notifications for ticket creation and comments
