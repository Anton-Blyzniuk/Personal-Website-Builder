# Personal Website Builder — API Documentation

> **For frontend / AI agent developers.** This document describes every endpoint, request shape, response shape, auth flow, and constraint you need to build the frontend.

---

## Table of Contents

1. [Base URL & Versioning](#base-url--versioning)
2. [Authentication](#authentication)
3. [Error Format](#error-format)
4. [Pagination](#pagination)
5. [Endpoints](#endpoints)
   - [Health](#health)
   - [Auth — Tokens](#auth--tokens)
   - [Users — Registration](#users--registration)
   - [Users — Profile](#users--profile)
   - [Users — Password](#users--password)
   - [Users — API Credentials](#users--api-credentials)
   - [PWB Units](#pwb-units)
   - [Media — Photos](#media--photos)
   - [Media — PDF Resume](#media--pdf-resume)
   - [Media — Education Unit Image](#media--education-unit-image)
   - [Media — Portfolio Item Image](#media--portfolio-item-image)
   - [Teammates](#teammates)
6. [Data Schemas](#data-schemas)
   - [PWBUnit full object](#pwbunit-full-object)
   - [PWBUnit list item](#pwbunit-list-item)
   - [User profile](#user-profile)
   - [Teammate](#teammate)
7. [Throttle Limits](#throttle-limits)
8. [Interactive Docs](#interactive-docs)

---

## Base URL & Versioning

```
/api/v1/
```

All paths below are relative to this prefix.

---

## Authentication

The API supports two auth methods. Both set the authenticated user for every protected endpoint.

### JWT (primary)

**Obtain tokens**

```
POST /token/
Content-Type: application/json

{ "email": "user@example.com", "password": "..." }
```

Response:
```json
{ "access": "<jwt>", "refresh": "<jwt>" }
```

**Use access token** — add to every protected request:
```
Authorization: Bearer <access>
```

Access token lifetime: **120 minutes**.
Refresh token lifetime: **3 days**.

**Refresh access token**

```
POST /token/refresh/
Content-Type: application/json

{ "refresh": "<refresh_token>" }
```

Response: `{ "access": "<new_jwt>" }`

---

### API Key (alternative)

Used for programmatic / headless access. Both headers must be present together; providing only one returns `401`.

```
X-Api-Key: <key>
X-Api-Secret: <secret>
```

See [Users — API Credentials](#users--api-credentials) for how to generate these.

---

## Error Format

All validation and auth errors return JSON. Common shapes:

```json
{ "detail": "Human-readable message." }
```
```json
{ "field_name": ["Error message for that field."] }
```
```json
{ "field_name": { "nested_field": ["Error."] } }
```

Standard HTTP status codes:
| Code | Meaning |
|------|---------|
| 400 | Validation error |
| 401 | Not authenticated |
| 403 | Authenticated but not the owner |
| 404 | Resource not found |
| 409 | Conflict (e.g. duplicate) |

---

## Pagination

List endpoints that support pagination return:

```json
{
  "count": 42,
  "next": "http://example.com/api/v1/pwbunits/?page=2",
  "previous": null,
  "results": [ ... ]
}
```

Default page size: **20**. Override with `?page_size=N` (max 100).

The `teammates` list is **not paginated** — it returns a plain array.

---

## Endpoints

### Health

#### `GET /ping/`

Public. Returns API health status.

**Response 200:**
```json
{ "ping": "pong" }
```

---

### Auth — Tokens

#### `POST /token/`

Obtain JWT access + refresh tokens. Throttled: **20 req/hour** per IP.

**Request:**
```json
{ "email": "string", "password": "string" }
```

**Response 200:**
```json
{ "access": "string", "refresh": "string" }
```

**Response 401:** invalid credentials.

---

#### `POST /token/refresh/`

Exchange a refresh token for a new access token.

**Request:**
```json
{ "refresh": "string" }
```

**Response 200:**
```json
{ "access": "string" }
```

---

### Users — Registration

#### `POST /user/register/`

Public. Throttled: **10 req/hour** per IP.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string"
}
```

Password is validated against Django's default validators (min length, not common, not numeric-only, not too similar to other fields).

**Response 201:**
```json
{ "access": "string", "refresh": "string" }
```

**Response 400:** validation error (duplicate email, weak password, missing fields).

---

#### `POST /admin/register/`

Public. Throttled: **10 req/hour** per IP. Creates a staff + superuser account.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "first_name": "string",
  "last_name": "string",
  "secret_code": "string"
}
```

`secret_code` must match the server-side `ADMIN_REGISTRATION_SECRET_CODE` env var.

**Response 201:**
```json
{ "access": "string", "refresh": "string" }
```

**Response 400:** invalid secret code or other validation error.

---

### Users — Profile

#### `GET /user/my-info/`

Requires auth. Returns the authenticated user's profile.

**Response 200:** [User profile object](#user-profile)

---

#### `PATCH /user/my-info/`

Requires auth. Updates first name, last name, and/or profile picture. All fields optional.

**Request** — `application/json` or `multipart/form-data`:
```
first_name   string   optional
last_name    string   optional
profile_picture  file   optional (image file, nullable)
```

**Response 200:** [User profile object](#user-profile)

---

### Users — Password

#### `POST /user/change-password/`

Requires auth.

**Request:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

**Response 200:**
```json
{ "details": "password changed." }
```

**Response 400:** wrong current password or new password fails validation.

---

### Users — API Credentials

API credentials allow headless access via `X-Api-Key` / `X-Api-Secret` headers. One credential set per user (OneToOne). The **secret is only returned once** — at creation and rotation.

#### `GET /user/api-key/`

Requires auth. Returns the current key (no secret).

**Response 200:**
```json
{ "key": "string", "created_at": "datetime", "is_active": true }
```

**Response 404:** no credentials exist yet.

---

#### `POST /user/api-key/`

Requires auth. Generates a new key + secret.

**Response 201:**
```json
{ "key": "string", "secret": "string", "created_at": "datetime" }
```

**Response 409:** credentials already exist — DELETE first or use `/rotate/`.

---

#### `DELETE /user/api-key/`

Requires auth. Permanently revokes credentials.

**Response 204:** revoked.
**Response 404:** no credentials found.

---

#### `POST /user/api-key/rotate/`

Requires auth. Generates a new secret for the existing key. The old secret is immediately invalidated.

**Response 200:**
```json
{ "key": "string", "secret": "string", "created_at": "datetime" }
```

**Response 404:** no credentials found.

---

### PWB Units

A **PWBUnit** is a personal website/CV entry. Each unit has a unique `unit_name` slug (used as the URL identifier). Retrieve is **public**; all writes require being the owner.

#### `GET /pwbunits/`

Requires auth. Lists only the authenticated user's own units.

**Response 200:** paginated list of [PWBUnit list items](#pwbunit-list-item).

---

#### `POST /pwbunits/`

Requires auth. Creates a new unit. Returns the full unit object.

**Request:** [PWBUnit create payload](#pwbunit-create--update-payload)

**Response 201:** [PWBUnit full object](#pwbunit-full-object)

**Response 400:** validation error (e.g. `unit_name` already taken, date range invalid).

---

#### `GET /pwbunits/<unit_name>/`

**Public** — no auth needed. Retrieves a single unit by its slug.

**Response 200:** [PWBUnit full object](#pwbunit-full-object)
**Response 404:** unit not found.

---

#### `PATCH /pwbunits/<unit_name>/`

Requires auth + ownership. Partial update. Only fields included in the request are changed.

For **nested arrays** (skills, links, etc.): if a key is present, the entire array for that relation is **replaced**. If a key is absent, that relation is untouched.

**Request:** any subset of [PWBUnit update fields](#pwbunit-create--update-payload) (no `unit_name`).

**Response 200:** [PWBUnit full object](#pwbunit-full-object)

---

#### `PUT /pwbunits/<unit_name>/`

Requires auth + ownership. Full replacement (all non-optional fields required). Nested arrays behave the same as PATCH — absent keys are treated as empty arrays.

**Request:** all required fields from [PWBUnit update fields](#pwbunit-create--update-payload).

**Response 200:** [PWBUnit full object](#pwbunit-full-object)

---

#### `DELETE /pwbunits/<unit_name>/`

Requires auth + ownership. Permanently deletes the unit and all related data (cascade).

**Response 204:** deleted.
**Response 403:** not the owner.

---

### Media — Photos

Photos are stored on Cloudinary. The upload field is `image`. Accepted formats: **JPEG, PNG, WebP, GIF**.

#### `GET /pwbunits/<unit_name>/photos/`

Requires auth + ownership. Lists all photos for the unit.

**Response 200:** array of photo objects:
```json
[
  { "id": 1, "image": "https://...", "is_main": true },
  { "id": 2, "image": "https://...", "is_main": false }
]
```

---

#### `POST /pwbunits/<unit_name>/photos/`

Requires auth + ownership. Upload via `multipart/form-data`.

```
image     file    required
is_main   bool    optional (default false) — "true"/"1"/"yes" accepted
```

Only one photo can be `is_main=true` at a time. Setting a new photo as main automatically demotes the previous main.

**Response 201:** photo object `{ "id": N, "image": "https://...", "is_main": bool }`

**Response 400:** missing file or unsupported format.

---

#### `PATCH /pwbunits/<unit_name>/photos/<pk>/`

Requires auth + ownership. Update `is_main` flag.

```json
{ "is_main": "true" }
```

**Response 200:** photo object.
**Response 400:** `is_main` field missing.

---

#### `DELETE /pwbunits/<unit_name>/photos/<pk>/`

Requires auth + ownership.

**Response 204:** deleted.

---

### Media — PDF Resume

#### `POST /pwbunits/<unit_name>/pdf-resume/`

Requires auth + ownership. Upload or replace the PDF resume. Use `multipart/form-data`, field name `file`. Only `application/pdf` accepted.

**Response 200:**
```json
{ "pdf_resume": "https://res.cloudinary.com/..." }
```

The URL includes the `fl_attachment` Cloudinary flag so browsers trigger a download.

**Response 400:** missing file or not a PDF.

---

#### `DELETE /pwbunits/<unit_name>/pdf-resume/`

Requires auth + ownership. Removes the PDF resume.

**Response 204:** removed.

---

### Media — Education Unit Image

#### `POST /pwbunits/<unit_name>/education-units/<pk>/image/`

Requires auth + ownership. Upload or replace the image for a specific education unit. `multipart/form-data`, field `image`. Accepted: JPEG, PNG, WebP, GIF.

**Response 200:**
```json
{ "image": "https://res.cloudinary.com/..." }
```

---

#### `DELETE /pwbunits/<unit_name>/education-units/<pk>/image/`

Requires auth + ownership.

**Response 204:** removed.

---

### Media — Portfolio Item Image

#### `POST /pwbunits/<unit_name>/portfolio-items/<pk>/image/`

Requires auth + ownership. Upload or replace the image for a specific portfolio item. `multipart/form-data`, field `image`. Accepted: JPEG, PNG, WebP, GIF.

**Response 200:**
```json
{ "image": "https://res.cloudinary.com/..." }
```

---

#### `DELETE /pwbunits/<unit_name>/portfolio-items/<pk>/image/`

Requires auth + ownership.

**Response 204:** removed.

---

### Teammates

Read-only for everyone. Write access is admin-only (not exposed via these endpoints).

#### `GET /teammates/`

Public. Returns all teammates. **Not paginated.**

**Response 200:** array of [Teammate list objects](#teammate).

---

#### `GET /teammates/<pk>/`

Public. Returns a single teammate with full details including `story` and `date_of_birth`.

**Response 200:** [Teammate retrieve object](#teammate).
**Response 404:** not found.

---

## Data Schemas

### PWBUnit full object

Returned by `GET /pwbunits/<unit_name>/`, `POST /pwbunits/`, and update endpoints.

```jsonc
{
  "unit_name": "john-doe",           // unique slug, URL identifier
  "first_name": "John",
  "last_name": "Doe",
  "headline": "Senior Engineer",     // max 120 chars
  "email": "john@example.com",
  "phone": "+1234567890",            // nullable
  "location": "New York",            // nullable
  "about": "About me...",            // nullable, long text
  "pdf_resume": "https://res.cloudinary.com/.../fl_attachment/...",  // nullable, download URL

  "photos": [
    { "id": 1, "image": "https://...", "is_main": true }
  ],

  "skills": [
    {
      "name": "Python",
      "category": "Backend",         // nullable
      "level": "Expert",             // nullable; one of: Beginner, Intermediate, Advanced, Expert
      "order": 0
    }
  ],

  "links": [
    { "name": "GitHub", "url": "https://github.com/johndoe" }
  ],

  "languages": [
    {
      "name": "English",
      "level": "Native"
      // levels: A1 Begginer, A2 Elementary, B1 Intermediate, B2 Upper-Intermediate,
      //         C1 Advanced, C2 Advanced Proficy, Native, Bilingual
    }
  ],

  "experience_units": [
    {
      "id": 1,
      "title": "Senior Engineer",
      "organization": "Acme Corp",   // nullable
      "location": "NY",              // nullable
      "description": "Built things", // nullable
      "from_date": "2020-01-01",     // YYYY-MM-DD
      "to_date": null,               // null means "present"
      "order": 0
    }
  ],

  "education_units": [
    {
      "id": 1,
      "institution": "MIT",
      "degree": "BSc",               // nullable
      "field_of_study": "CS",        // nullable
      "location": "Cambridge",       // nullable
      "from_date": "2015-09-01",
      "to_date": "2019-06-01",       // nullable
      "description": null,           // nullable
      "image": "https://...",        // nullable, Cloudinary URL
      "order": 0
    }
  ],

  "portfolio_items": [
    {
      "id": 1,
      "title": "My App",
      "category": "Web",             // nullable
      "description": "A web app",    // nullable
      "date": "2023-05-01",          // nullable
      "image": "https://...",        // nullable, Cloudinary URL
      "order": 0,
      "links": [
        { "name": "Live", "url": "https://myapp.example.com" }
      ]
    }
  ],

  "certifications": [
    {
      "name": "AWS Certified",
      "issuing_organization": "Amazon",
      "issue_date": "2022-01-01",    // nullable
      "expiry_date": null,           // nullable; must be after issue_date
      "credential_id": null,         // nullable
      "credential_url": null,        // nullable
      "order": 0
    }
  ],

  "awards": [
    {
      "title": "Best Dev",
      "issuer": "DevConf",           // nullable
      "date": "2023-06-01",          // nullable
      "description": null,           // nullable
      "order": 0
    }
  ],

  "custom_sections": [
    {
      "title": "Publications",
      "order": 0,
      "items": [
        {
          "title": "My Paper",
          "subtitle": "Journal",     // nullable
          "from_date": null,         // nullable
          "to_date": null,           // nullable; must be after from_date if both set
          "description": null,       // nullable
          "url": null,               // nullable
          "order": 0
        }
      ]
    }
  ]
}
```

---

### PWBUnit list item

Returned by `GET /pwbunits/` (no nested data, lightweight).

```json
{
  "unit_name": "john-doe",
  "first_name": "John",
  "last_name": "Doe",
  "headline": "Senior Engineer",
  "email": "john@example.com",
  "phone": "+1234567890",
  "location": "New York"
}
```

---

### PWBUnit create / update payload

Used for `POST /pwbunits/` and `PATCH`/`PUT /pwbunits/<unit_name>/`.

```jsonc
{
  // Required on create only:
  "unit_name": "john-doe",          // slug format, globally unique

  // Required scalar fields:
  "first_name": "John",
  "last_name": "Doe",
  "headline": "Senior Engineer",
  "email": "john@example.com",

  // Optional scalar fields:
  "phone": "+1234567890",
  "location": "New York",
  "about": "About me...",

  // Optional nested arrays (each replaces the entire relation when present):
  "skills":           [ /* SkillWrite */ ],
  "links":            [ /* LinkWrite */ ],
  "languages":        [ /* LanguageWrite */ ],
  "experience_units": [ /* ExperienceUnitWrite */ ],
  "education_units":  [ /* EducationUnitWrite */ ],
  "portfolio_items":  [ /* PortfolioItemWrite */ ],
  "certifications":   [ /* CertificationWrite */ ],
  "awards":           [ /* AwardWrite */ ],
  "custom_sections":  [ /* CustomSectionWrite */ ]
}
```

**Write schemas for nested arrays:**

```jsonc
// SkillWrite
{ "name": "Python", "category": "Backend", "level": "Expert", "order": 0 }

// LinkWrite
{ "name": "GitHub", "url": "https://..." }

// LanguageWrite
{ "name": "English", "level": "Native" }

// ExperienceUnitWrite
{
  "title": "Engineer",
  "organization": "Acme",  // optional
  "location": "NY",        // optional
  "description": "...",    // optional
  "from_date": "2020-01-01",
  "to_date": "2023-01-01", // optional; must be strictly after from_date
  "order": 0
}

// EducationUnitWrite
{
  "institution": "MIT",
  "degree": "BSc",          // optional
  "field_of_study": "CS",   // optional
  "location": "Cambridge",  // optional
  "from_date": "2015-09-01",
  "to_date": "2019-06-01",  // optional; must be strictly after from_date
  "description": "...",     // optional
  "order": 0
  // Note: image is managed separately via the education-unit image endpoint
}

// PortfolioItemWrite
{
  "title": "My App",
  "category": "Web",   // optional
  "description": "...", // optional
  "date": "2023-05-01", // optional
  "order": 0,
  "links": [           // optional
    { "name": "Live", "url": "https://..." }
  ]
  // Note: image is managed separately via the portfolio-item image endpoint
}

// CertificationWrite
{
  "name": "AWS Certified",
  "issuing_organization": "Amazon",
  "issue_date": "2022-01-01",  // optional
  "expiry_date": "2025-01-01", // optional; must be strictly after issue_date
  "credential_id": "ABC123",   // optional
  "credential_url": "https://...", // optional
  "order": 0
}

// AwardWrite
{ "title": "Best Dev", "issuer": "DevConf", "date": "2023-06-01", "description": "...", "order": 0 }

// CustomSectionWrite
{
  "title": "Publications",
  "order": 0,
  "items": [  // optional
    {
      "title": "My Paper",
      "subtitle": "Journal",    // optional
      "from_date": "2023-01-01", // optional
      "to_date": "2023-06-01",   // optional; must be strictly after from_date
      "description": "...",      // optional
      "url": "https://...",      // optional
      "order": 0
    }
  ]
}
```

---

### User profile

Returned by `GET /user/my-info/` and `PATCH /user/my-info/`.

```json
{
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Doe",
  "is_staff": false,
  "is_superuser": false,
  "last_login": "2026-04-28T10:00:00Z",
  "date_joined": "2026-01-01T00:00:00Z",
  "profile_picture": "https://res.cloudinary.com/..."
}
```

`profile_picture` is `null` if not set.

---

### Teammate

**List shape** (`GET /teammates/`):
```json
{
  "id": 1,
  "first_name": "Alice",
  "last_name": "Smith",
  "email": "alice@example.com",
  "photo": "https://res.cloudinary.com/...",
  "project_roles": [
    { "id": 1, "name": "Frontend Developer" }
  ],
  "links": [
    { "id": 1, "name": "GitHub", "link": "https://github.com/alice" }
  ]
}
```

**Retrieve shape** (`GET /teammates/<pk>/`) — same plus:
```json
{
  "date_of_birth": "1990-05-15",
  "story": "Alice joined the team in 2021..."
}
```

`photo`, `date_of_birth`, and `story` are `null` if not set.

---

## Throttle Limits

| Scope | Limit | Applies to |
|-------|-------|-----------|
| `registration` | 10/hour | `POST /user/register/`, `POST /admin/register/` |
| `token` | 20/hour | `POST /token/` |

Limits are per anonymous IP. Authenticated endpoints are not throttled by default.

---

## Interactive Docs

The API ships with live, explorable documentation:

| URL | Format |
|-----|--------|
| `/api/v1/swagger/` | Swagger UI |
| `/api/v1/redoc/` | ReDoc |
| `/api/v1/schema/` | Raw OpenAPI 3 JSON/YAML |
