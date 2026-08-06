# Production Mobile Order API Contract

## Verification status

**UNVERIFIED — backend source unavailable in this workspace.**

This document records the result of a read-only contract audit. The production
backend repository `exzibo-mag` is not present in the workspace, and no backend
source snapshot containing the order implementation was available to inspect.

The mobile repository contains only a local/mock Orders screen. It does not
contain a production order client, order DTOs, realtime client, websocket/SSE
implementation, or verified order endpoint definitions.

No runtime code, endpoint, DTO, authentication flow, database schema, or
deployment configuration was modified.

## 1. Order List API

**Status:** Not verifiable.

The following backend source files are required but missing:

- The backend route file that registers the authenticated order-list endpoint.
- The backend controller/handler/service that implements order listing.
- The backend request schema or validator for list query parameters.
- The backend response serializer/DTO for the order list.
- The backend error handler or error-schema definitions used by that route.
- The backend authentication and authorization middleware applied to that route.

The following contract fields cannot be documented without those files:

- HTTP method
- URL
- Authentication requirements
- Required headers
- Query parameters
- Response DTO
- Error responses

No endpoint or DTO is inferred from the mobile mock data.

## 2. Order Details API

**Status:** Not verifiable.

The backend route, handler/service, request validator, response DTO, error
definitions, and authorization middleware for an order-details endpoint are
missing from this workspace.

It is therefore unknown whether a production order-details API is implemented.

## 3. Order Status Update API

**Status:** Not verifiable.

The following backend source files are required but missing:

- The route file registering status-update operations.
- The handler/service implementing status transitions.
- The request DTO/schema for status updates.
- The response DTO/serializer.
- The transition-validation implementation.
- The authorization and permission checks.
- Any transaction, locking, idempotency, or conflict-handling implementation.

The following cannot be safely documented:

- Status-update endpoint and HTTP method
- Request DTO
- Response DTO
- Validation rules
- Authorization requirements
- Allowed status transitions
- Retry or conflict behavior

The mobile UI labels (`Accept`, `Start`, `Mark ready`, and `Complete`) are
design-time mock labels and are not treated as production status values.

## 4. Cancel/Reject API

**Status:** Not verifiable.

The backend route, handler/service, request/response schemas, authorization
checks, and transition rules for cancel or reject operations are missing.

It is unknown whether cancel/reject is implemented as:

- A dedicated endpoint
- The status-update endpoint
- Another existing backend operation

No endpoint is inferred.

## 5. Order Lifecycle

**Status:** Not verifiable.

The production status enum and lifecycle transition implementation are not
available in this workspace.

The legal statuses and legal transitions cannot be listed without the backend
source that defines and validates them.

The following mock-screen labels must not be considered verified production
statuses:

- `new`
- `confirmed`
- `preparing`
- `ready`

No other status is added or inferred.

## 6. Realtime

**Status:** Not verifiable.

No production realtime implementation is present in the mobile repository, and
the backend repository containing the production implementation is unavailable.

The following backend source files are required but missing:

- Realtime transport/server initialization.
- Realtime route or connection handler.
- Authentication/authorization middleware for realtime connections.
- Subscription handler and restaurant-scoping logic.
- Event-name/type definitions.
- Event payload DTOs or serializers.
- Reconnect and retry implementation.
- Ordering, deduplication, replay, cursor, or sequence handling.

The following cannot be documented:

- Transport
- Endpoint or connection URL
- Authentication
- Subscription flow
- Event names
- Event payload DTOs
- Reconnect behavior
- Retry behavior
- Ordering guarantees
- Duplicate protection

No websocket, SSE, subscription, event name, or polling fallback is invented.

## 7. Restaurant Isolation

**Status:** Not verifiable for orders.

The backend source files that must be inspected are missing:

- Better Auth session extraction used by order routes/realtime.
- App Member lookup and authorization middleware.
- Restaurant UID resolution logic.
- Restaurant membership/permission checks.
- Order-to-restaurant scoping queries.
- Realtime subscription restaurant-scope enforcement.

The mobile repository does contain an existing authenticated bootstrap flow and
restaurant-selection boundary, but that does not reveal how the production
order backend enforces isolation.

The following cannot be asserted for order APIs without backend source:

- How Better Auth is consumed by order routes
- How App Members are checked
- Whether and how Restaurant UID is supplied
- Which permissions are required
- How order records are constrained to the authenticated restaurant
- How realtime subscriptions are constrained to the restaurant

No client-supplied restaurant ID, role, permission, or user ID is introduced.

## 8. Idempotency

**Status:** Not verifiable.

The backend implementation files for idempotency are missing. In particular,
the following cannot be located:

- Idempotency-header parsing/validation.
- Idempotency-key format rules.
- Duplicate-request behavior.
- Key expiration/retention rules.
- Idempotency storage implementation.
- Scope rules for restaurant, user, route, or request body.

No idempotency header, retry policy, expiration, storage mechanism, or duplicate
behavior is inferred.

## 9. Error DTOs

**Status:** Not verifiable for orders.

The backend order error schemas and error serializer are missing. Every
production order error shape therefore remains unknown, including:

- Validation errors
- Unauthorized/session-expired errors
- Forbidden/membership errors
- Not-found errors
- Invalid-transition errors
- Conflict/idempotency errors
- Rate-limit errors
- Realtime subscription errors
- Server/network error envelopes

The mobile repository's generic `ApiError` transport class is not evidence of
the production order error DTO and is not used to infer one.

## 10. Polling

Polling cannot be verified because the backend repository and the production
mobile order contract are unavailable.

The exact required statement **“No polling exists.”** cannot honestly be made
from the files available in this workspace. The mobile repository contains no
order polling implementation, but that does not establish whether the
production backend provides or requires polling.

The backend files required to resolve this are:

- The production order client/consumer contract, if one exists.
- The order realtime transport implementation.
- Any documented or implemented fallback scheduler/timer.
- Any reconnect or missed-event recovery logic.

## Missing backend source required to complete this document

The `exzibo-mag` repository or a source snapshot containing all of the
following is required:

1. Authenticated order route registration.
2. Order list and detail handlers/services.
3. Order request/response DTOs and validators.
4. Status transition enum and validation logic.
5. Cancel/reject implementation, if present.
6. Better Auth/App Member/permission middleware used by orders.
7. Restaurant UID and order restaurant-isolation logic.
8. Idempotency implementation and storage.
9. Error DTOs and error serialization.
10. Realtime transport, subscriptions, event definitions, payloads,
    reconnect/retry, ordering, and deduplication logic.
11. Polling or missed-event fallback implementation, if present.

No exact backend file paths can be named because the backend repository itself
is absent from this workspace.

## Conclusion

The production Mobile Order API contract cannot be produced from the available
repository without guessing. The correct next step is to provide the
`exzibo-mag` backend repository or a source snapshot containing the files listed
above. Until then, the mobile Orders screen must not be connected to invented
endpoints, statuses, DTOs, realtime events, or polling behavior.