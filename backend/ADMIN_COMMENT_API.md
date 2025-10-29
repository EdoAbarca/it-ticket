# Admin Comment Management API

This document describes the admin comment management endpoints added in US-14.

## Overview

Admins can perform full CRUD operations on all comments in the system for content moderation purposes. These endpoints require:
- Valid JWT authentication token
- Admin privileges (isAdmin: true)

## Endpoints

### Update Comment

**Endpoint:** `PATCH /admin/tickets/comments/:commentId`

**Description:** Update the content of any comment in the system.

**Authentication:** Required (Admin only)

**URL Parameters:**
- `commentId` (string, required): The unique identifier of the comment to update

**Request Body:**
```json
{
  "content": "Updated comment content"
}
```

**Validation:**
- `content` must be a non-empty string
- `content` must have at least 1 character

**Response (200 OK):**
```json
{
  "message": "Comment updated successfully",
  "comment": {
    "id": "comment-123",
    "content": "Updated comment content",
    "ticketId": "ticket-456",
    "userId": "user-789",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:45:00.000Z",
    "user": {
      "id": "user-789",
      "username": "john_doe",
      "email": "john@example.com",
      "isAdmin": false
    }
  }
}
```

**Error Responses:**
- `404 Not Found`: Comment does not exist
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not an admin
- `400 Bad Request`: Validation failed (e.g., empty content)

---

### Delete Comment

**Endpoint:** `DELETE /admin/tickets/comments/:commentId`

**Description:** Delete any comment from the system permanently.

**Authentication:** Required (Admin only)

**URL Parameters:**
- `commentId` (string, required): The unique identifier of the comment to delete

**Response (200 OK):**
```json
{
  "message": "Comment deleted successfully"
}
```

**Error Responses:**
- `404 Not Found`: Comment does not exist
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: User is not an admin

---

## Security Considerations

1. **Admin-Only Access:** Both endpoints are protected by AdminGuard, ensuring only users with `isAdmin: true` can access them.

2. **No Ownership Validation:** Unlike regular user comment operations, admins can modify or delete any comment regardless of who created it.

3. **Audit Trail:** Consider implementing audit logging for admin actions in production environments (not included in this implementation).

4. **Validation:** Input validation is performed using class-validator to prevent injection attacks and ensure data integrity.

## Example Usage

### Using cURL

**Update a comment:**
```bash
curl -X PATCH http://localhost:3000/admin/tickets/comments/comment-123 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "This comment has been moderated by admin"}'
```

**Delete a comment:**
```bash
curl -X DELETE http://localhost:3000/admin/tickets/comments/comment-123 \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## Testing

The implementation includes comprehensive unit tests:
- Service layer tests for `updateComment()` and `deleteComment()`
- Controller layer tests for both endpoints
- Edge cases including non-existent comments
- 100% code coverage for new functionality

Run tests with:
```bash
npm test
npm run test:cov  # For coverage report
```
