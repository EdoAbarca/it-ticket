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

### Admin Ticket Management (US-13)
Admins have full CRUD capabilities to manage all tickets in the system. This enables support staff to view, update, and delete tickets as needed for system management.

**Admin Endpoints:**
- `GET /admin/tickets` - List all tickets with pagination, filtering, and sorting
  - Query parameters: `page`, `limit`, `sortBy`, `sortOrder`, `status`, `priority`
  - Returns paginated list of all tickets from all users
- `GET /admin/tickets/:id` - Get specific ticket by ID
  - Returns ticket details including status history
  - No ownership check - admins can view any ticket
- `PATCH /admin/tickets/:id/status` - Update ticket status
  - Required: status (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
  - Creates status history entry
  - Sends email notification to ticket owner
- `PATCH /admin/tickets/:id` - Update ticket details
  - Optional fields: title, description, priority, imageUrl
  - Allows partial updates (can update just one field)
  - Validates priority values (LOW, MEDIUM, HIGH, CRITICAL)
- `DELETE /admin/tickets/:id` - Delete a ticket
  - Cascade deletes related comments and status history
  - Permanent deletion (no soft delete)
- `POST /admin/tickets/:id/comments` - Create comment on any ticket
- `GET /admin/tickets/:id/comments` - View all comments on any ticket
- `GET /admin/tickets/:id/history` - View ticket status change history

**Security:**
- Protected by JWT authentication + AdminGuard
- Only users with `isAdmin: true` can access admin endpoints
- Input validation using class-validator decorators
- No security vulnerabilities detected by CodeQL scanner

**Validation:**
- Title and description are strings (when provided)
- Priority must be one of: LOW, MEDIUM, HIGH, CRITICAL
- Status must be one of: OPEN, IN_PROGRESS, RESOLVED, CLOSED
- All update fields are optional (partial updates supported)

**Testing:**
- 7 new unit tests for update and delete operations
- Test coverage: 70%+ for tickets module
- Edge cases tested: not found, partial updates
- All 106 tests passing

**Example Requests:**

List all tickets with filtering:
```
GET /admin/tickets?page=1&limit=10&status=OPEN&sortBy=createdAt&sortOrder=desc
```

Update ticket details:
```json
PATCH /admin/tickets/:id
{
  "title": "Updated ticket title",
  "priority": "HIGH",
  "description": "Updated description"
}
```

Update only priority:
```json
PATCH /admin/tickets/:id
{
  "priority": "CRITICAL"
}
```

Delete ticket:
```
DELETE /admin/tickets/:id
```

Response:
```json
{
  "message": "Ticket deleted successfully"
}
```

## Future Enhancements
- Add e2e tests for ticket creation flow
- Add ticket assignment to support staff
- Email notifications for ticket creation and comments
