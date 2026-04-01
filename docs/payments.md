# Payments

Base URL: `http://localhost:3000/api/payments`

Todos los endpoints requieren JWT en el header:
```
Authorization: Bearer <token>
```

> **Nota:** El módulo de pagos está simulado. Al pagar, el sistema marca el pago como `SUCCEEDED` directamente sin procesar una transacción real. Está preparado para reemplazar la simulación con Stripe en el futuro.

---

### POST `/payments/booking/:bookingId` — GUEST

Procesa el pago de una reserva. Crea el registro `Payment` como `SUCCEEDED` y actualiza el `Booking` a `CONFIRMED` en una sola transacción.

**Request** — No body required.

**Response `201`**
```json
{
  "id": "uuid",
  "bookingId": "uuid",
  "amount": "510.00",
  "currency": "usd",
  "status": "SUCCEEDED",
  "stripePaymentIntentId": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors**
- `400` — La reserva está cancelada
- `400` — La reserva ya fue pagada
- `403` — No es el guest de la reserva
- `404` — Booking not found

---

### GET `/payments/booking/:bookingId` — GUEST o HOST

Retorna el pago asociado a una reserva. Accesible por el guest que realizó la reserva o por el host del listing.

**Response `200`**
```json
{
  "id": "uuid",
  "bookingId": "uuid",
  "amount": "510.00",
  "currency": "usd",
  "status": "SUCCEEDED",
  "stripePaymentIntentId": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "booking": {
    "guestId": "uuid",
    "listing": {
      "hostId": "uuid"
    }
  }
}
```

**Errors**
- `403` — No es el guest ni el host del listing
- `404` — Payment not found

---

### POST `/payments/booking/:bookingId/refund` — GUEST

Reembolsa un pago exitoso. Actualiza el `Payment` a `REFUNDED` y el `Booking` a `CANCELLED` en una sola transacción.

**Request** — No body required.

**Response `200`**
```json
{
  "id": "uuid",
  "bookingId": "uuid",
  "amount": "510.00",
  "currency": "usd",
  "status": "REFUNDED",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

**Errors**
- `400` — El pago ya fue reembolsado
- `400` — Solo se pueden reembolsar pagos con status `SUCCEEDED`
- `403` — No es el guest de la reserva
- `404` — Payment not found
