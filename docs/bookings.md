# Bookings

Base URL: `http://localhost:3000/api/bookings`

Todos los endpoints requieren JWT en el header:
```
Authorization: Bearer <token>
```

**Flujo de estados permitidos:**
```
PENDING → CONFIRMED → COMPLETED
PENDING → CANCELLED
CONFIRMED → CANCELLED
```

---

### POST `/bookings` — GUEST

Crea una nueva reserva. El `totalPrice` se calcula automáticamente (`noches × pricePerNight`). Valida disponibilidad de fechas contra reservas existentes con status `PENDING` o `CONFIRMED`.

**Request — `application/json`**

| Field       | Type     | Required | Description                  |
|-------------|----------|----------|------------------------------|
| `listingId` | `string` | Yes      | UUID del listing a reservar  |
| `checkIn`   | `date`   | Yes      | Fecha de entrada (ISO 8601)  |
| `checkOut`  | `date`   | Yes      | Fecha de salida (ISO 8601)   |
| `guestCount`| `number` | Yes      | Cantidad de huéspedes (min 1)|

```json
{
  "listingId": "uuid",
  "checkIn": "2024-06-01",
  "checkOut": "2024-06-07",
  "guestCount": 2
}
```

**Response `201`**
```json
{
  "id": "uuid",
  "guestId": "uuid",
  "listingId": "uuid",
  "checkIn": "2024-06-01T00:00:00.000Z",
  "checkOut": "2024-06-07T00:00:00.000Z",
  "guestCount": 2,
  "totalPrice": "510.00",
  "status": "PENDING",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "listing": {
    "id": "uuid",
    "title": "Cozy apartment in Barcelona",
    "city": "Barcelona",
    "country": "Spain",
    "pricePerNight": "85.00"
  }
}
```

**Errors**
- `400` — Check-in en el pasado
- `400` — Check-out no es posterior al check-in
- `400` — Fechas solapadas con una reserva existente
- `400` — `guestCount` excede el máximo del listing
- `400` — Listing no disponible (inactivo)
- `403` — El host no puede reservar su propio listing
- `404` — Listing not found

---

### GET `/bookings/my-bookings` — GUEST

Retorna todas las reservas del guest autenticado, ordenadas por fecha de creación descendente.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "checkIn": "2024-06-01T00:00:00.000Z",
    "checkOut": "2024-06-07T00:00:00.000Z",
    "guestCount": 2,
    "totalPrice": "510.00",
    "status": "CONFIRMED",
    "listing": {
      "id": "uuid",
      "title": "Cozy apartment in Barcelona",
      "city": "Barcelona",
      "country": "Spain",
      "images": [{ "url": "https://res.cloudinary.com/...", "public_id": "abc123" }]
    }
  }
]
```

---

### PATCH `/bookings/:id/cancel` — GUEST

Cancela una reserva propia. No se puede cancelar una reserva ya `CANCELLED` o `COMPLETED`.

**Request** — No body required.

**Response `200`**
```json
{
  "id": "uuid",
  "status": "CANCELLED",
  ...
}
```

**Errors**
- `400` — Reserva ya cancelada
- `400` — No se puede cancelar una reserva completada
- `403` — No es el guest de la reserva
- `404` — Booking not found

---

### GET `/bookings/host/incoming` — HOST

Retorna todas las reservas de los listings del host autenticado, ordenadas por fecha de creación descendente.

**Response `200`**
```json
[
  {
    "id": "uuid",
    "checkIn": "2024-06-01T00:00:00.000Z",
    "checkOut": "2024-06-07T00:00:00.000Z",
    "guestCount": 2,
    "totalPrice": "510.00",
    "status": "PENDING",
    "listing": {
      "id": "uuid",
      "title": "Cozy apartment in Barcelona",
      "city": "Barcelona",
      "country": "Spain"
    },
    "guest": {
      "id": "uuid",
      "name": "Jane Doe",
      "avatarUrl": "https://res.cloudinary.com/..."
    }
  }
]
```

---

### PATCH `/bookings/:id/status` — HOST

Actualiza el status de una reserva. Solo el host propietario del listing puede hacerlo.

**Transiciones válidas:**

| Desde       | Hacia                       |
|-------------|-----------------------------|
| `PENDING`   | `CONFIRMED`, `CANCELLED`    |
| `CONFIRMED` | `COMPLETED`, `CANCELLED`    |
| `CANCELLED` | — (estado terminal)         |
| `COMPLETED` | — (estado terminal)         |

**Request — `application/json`**
```json
{
  "status": "CONFIRMED"
}
```

**Response `200`** — Booking con el nuevo status.

**Errors**
- `400` — Transición de estado no permitida
- `403` — No es el host del listing
- `404` — Booking not found

---

### GET `/bookings/:id` — GUEST o HOST

Retorna el detalle completo de una reserva. Accesible por el guest que la creó o por el host del listing.

**Response `200`**
```json
{
  "id": "uuid",
  "checkIn": "2024-06-01T00:00:00.000Z",
  "checkOut": "2024-06-07T00:00:00.000Z",
  "guestCount": 2,
  "totalPrice": "510.00",
  "status": "CONFIRMED",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "listing": {
    "id": "uuid",
    "title": "Cozy apartment in Barcelona",
    "city": "Barcelona",
    "country": "Spain",
    "pricePerNight": "85.00",
    "hostId": "uuid"
  },
  "guest": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatarUrl": "https://res.cloudinary.com/..."
  }
}
```

**Errors**
- `403` — No es el guest ni el host del listing
- `404` — Booking not found
