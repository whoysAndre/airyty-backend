# Users

Base URL: `http://localhost:3000/api/users`

All endpoints require a valid JWT in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

### PATCH `/users/change-role`

Promotes the authenticated user's role from `GUEST` to `HOST`. Cannot be reversed via this endpoint.

**Request** — No body required.

**Response `200`**
```json
{
  "status": 200,
  "message": "Change Role successfully"
}
```

**Errors**
- `400` — User already has HOST role
- `401` — Unauthorized
- `404` — User not found

---

### PATCH `/users/change-password`

Changes the authenticated user's password. Requires the current password for verification.

**Request — `application/json`**

| Field             | Type     | Required | Description                        |
|-------------------|----------|----------|------------------------------------|
| `password`        | `string` | Yes      | Current password                   |
| `confirmPassword` | `string` | Yes      | Must match `password`              |
| `newPassword`     | `string` | Yes      | New password, minimum 8 characters |

```json
{
  "password": "current_password",
  "confirmPassword": "current_password",
  "newPassword": "new_password123"
}
```

**Response `200`**
```json
{
  "status": 200,
  "message": "Change Password succesfully"
}
```

**Errors**
- `400` — `password` and `confirmPassword` do not match
- `401` — Unauthorized / invalid current password
- `404` — User not found

---

### PATCH `/users/update-profile`

Updates the authenticated user's name and/or profile image. Accepts `multipart/form-data`.

If the user already has a profile image, the previous one is deleted from Cloudinary before uploading the new one.

**Request — `multipart/form-data`**

| Field   | Type     | Required | Description                                               |
|---------|----------|----------|-----------------------------------------------------------|
| `name`  | `string` | No       | New display name                                          |
| `image` | `file`   | No       | New profile picture (jpeg/png/jpg/webp/avif, max 5MB)     |

**Response `200`**
```json
{
  "status": 200,
  "message": "Profile updated successfully",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "GUEST",
    "avatarUrl": "https://res.cloudinary.com/..."
  }
}
```

**Errors**
- `400` — Invalid file type
- `401` — Unauthorized
- `404` — User not found
