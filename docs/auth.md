# Auth

Base URL: `http://localhost:3000/api/auth`

---

### POST `/auth/register`

Registers a new user. Accepts `multipart/form-data` to allow optional profile image upload.

**Request — `multipart/form-data`**

| Field      | Type     | Required | Description                                              |
|------------|----------|----------|----------------------------------------------------------|
| `name`     | `string` | Yes      | Full name of the user                                    |
| `email`    | `string` | Yes      | Valid email address                                      |
| `password` | `string` | Yes      | Minimum 8 characters                                     |
| `role`     | `string` | No       | `GUEST` (default) or `HOST`                              |
| `image`    | `file`   | No       | Profile picture (jpeg/png/jpg/webp/avif, max 5MB)        |

**Response `201`**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "GUEST"
  },
  "token": "jwt_token"
}
```

**Errors**
- `400` — Invalid file type
- `409` — Email already in use

---

### POST `/auth/login`

Authenticates an existing user and returns a JWT.

**Request — `application/json`**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `200`**
```json
{
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "GUEST"
  },
  "token": "jwt_token"
}
```

**Errors**
- `401` — Invalid credentials
