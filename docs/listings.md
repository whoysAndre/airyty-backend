# Listings

Base URL: `http://localhost:3000/api/listings`

Endpoints marcados como **HOST** requieren JWT de un usuario con rol `HOST`:
```
Authorization: Bearer <token>
```

Las imágenes se manejan como `multipart/form-data`. Cada imagen se sube a Cloudinary y se almacena como `{ url, public_id }` en un array JSON en la base de datos.

---

### GET `/listings`

Retorna listings activos con paginación y filtros opcionales vía query params.

**Query params**

| Param      | Type     | Required | Description                          |
|------------|----------|----------|--------------------------------------|
| `city`     | `string` | No       | Filtrar por ciudad (case-insensitive) |
| `country`  | `string` | No       | Filtrar por país (case-insensitive)  |
| `guests`   | `number` | No       | Capacidad mínima requerida           |
| `minPrice` | `number` | No       | Precio mínimo por noche              |
| `maxPrice` | `number` | No       | Precio máximo por noche              |
| `page`     | `number` | No       | Página (default: `1`)                |
| `limit`    | `number` | No       | Resultados por página (default: `10`)|

**Response `200`**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Cozy apartment in Barcelona",
      "city": "Barcelona",
      "country": "Spain",
      "maxGuests": 4,
      "pricePerNight": "85.00",
      "images": [{ "url": "https://res.cloudinary.com/...", "public_id": "abc123" }],
      "host": { "id": "uuid", "name": "John", "avatarUrl": "https://..." }
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

### GET `/listings/:id`

Retorna el detalle completo de un listing.

**Response `200`**
```json
{
  "id": "uuid",
  "title": "Cozy apartment in Barcelona",
  "description": "...",
  "city": "Barcelona",
  "country": "Spain",
  "maxGuests": 4,
  "pricePerNight": "85.00",
  "isActive": true,
  "images": [{ "url": "https://res.cloudinary.com/...", "public_id": "abc123" }],
  "host": { "id": "uuid", "name": "John", "avatarUrl": "https://..." },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors**
- `404` — Listing not found

---

### POST `/listings` — HOST

Crea un nuevo listing. Acepta `multipart/form-data` para subir imágenes (máximo 10).

**Request — `multipart/form-data`**

| Field           | Type     | Required | Description                                          |
|-----------------|----------|----------|------------------------------------------------------|
| `title`         | `string` | Yes      | Mínimo 5 caracteres                                  |
| `description`   | `string` | Yes      | Mínimo 10 caracteres                                 |
| `city`          | `string` | Yes      |                                                      |
| `country`       | `string` | Yes      |                                                      |
| `maxGuests`     | `number` | Yes      | Mínimo 1                                             |
| `pricePerNight` | `number` | Yes      | Valor positivo                                       |
| `images`        | `file[]` | No       | jpeg/png/jpg/webp/avif, max 5MB por imagen           |

**Response `201`**
```json
{
  "id": "uuid",
  "hostId": "uuid",
  "title": "Cozy apartment in Barcelona",
  "description": "...",
  "city": "Barcelona",
  "country": "Spain",
  "maxGuests": 4,
  "pricePerNight": "85.00",
  "images": [{ "url": "https://res.cloudinary.com/...", "public_id": "abc123" }],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors**
- `400` — Tipo de archivo inválido
- `401` — Unauthorized
- `403` — Forbidden (rol no es HOST)

---

### GET `/listings/host/my-listings` — HOST

Retorna todos los listings del host autenticado, incluyendo los inactivos.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "title": "Cozy apartment in Barcelona",
    "isActive": true,
    ...
  }
]
```

**Errors**
- `401` — Unauthorized
- `403` — Forbidden

---

### PATCH `/listings/:id` — HOST

Actualiza los campos de texto de un listing. Solo el host propietario puede modificarlo.

**Request — `application/json`**

Todos los campos son opcionales:

| Field           | Type     | Description              |
|-----------------|----------|--------------------------|
| `title`         | `string` | Mínimo 5 caracteres      |
| `description`   | `string` | Mínimo 10 caracteres     |
| `city`          | `string` |                          |
| `country`       | `string` |                          |
| `maxGuests`     | `number` | Mínimo 1                 |
| `pricePerNight` | `number` | Valor positivo           |

**Response `200`** — Listing actualizado completo.

**Errors**
- `401` — Unauthorized
- `403` — No es el propietario del listing
- `404` — Listing not found

---

### POST `/listings/:id/images` — HOST

Agrega imágenes a un listing existente (máximo 10 por request). Solo el host propietario puede agregarlas.

**Request — `multipart/form-data`**

| Field    | Type     | Required | Description                               |
|----------|----------|----------|-------------------------------------------|
| `images` | `file[]` | Yes      | jpeg/png/jpg/webp/avif, max 5MB por imagen |

**Response `200`** — Listing con el array de imágenes actualizado.

**Errors**
- `400` — No files provided / tipo de archivo inválido
- `401` — Unauthorized
- `403` — No es el propietario del listing
- `404` — Listing not found

---

### DELETE `/listings/:id/images` — HOST

Elimina una imagen específica del listing. La imagen es borrada de Cloudinary y removida del array.

**Request — `application/json`**

```json
{
  "publicId": "cloudinary_public_id"
}
```

**Response `200`** — Listing con el array de imágenes actualizado.

**Errors**
- `401` — Unauthorized
- `403` — No es el propietario del listing
- `404` — Listing not found / imagen no encontrada en el listing

---

### PATCH `/listings/:id/toggle-active` — HOST

Alterna el estado `isActive` del listing (`true` ↔ `false`). Un listing inactivo no aparece en los resultados públicos.

**Response `200`** — Listing con el nuevo valor de `isActive`.

**Errors**
- `401` — Unauthorized
- `403` — No es el propietario del listing
- `404` — Listing not found

---

### DELETE `/listings/:id` — HOST

Elimina el listing permanentemente. Borra todas sus imágenes de Cloudinary antes de eliminar el registro.

**Response `200`**
```json
{
  "status": 200,
  "message": "Listing deleted successfully"
}
```

**Errors**
- `401` — Unauthorized
- `403` — No es el propietario del listing
- `404` — Listing not found
