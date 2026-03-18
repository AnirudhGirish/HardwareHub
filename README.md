# Hardware Hub

> Internal hardware and licence management platform for MBRDI — Mercedes-Benz Research and Development India.

Hardware Hub gives every team a single place to track physical assets and software licences, manage ownership, handle loan requests, and maintain a complete audit trail — without the overhead of spreadsheets or manual processes.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Project Structure](#project-structure)
- [Authentication](#authentication)
- [Role System](#role-system)
- [Resource Lifecycle](#resource-lifecycle)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Security](#security)

---

## Overview

Hardware Hub is a full-stack internal tool built on Next.js and Supabase. It models the real-world lifecycle of company-owned assets: an admin structures the organisation into departments and teams, employees register and add the resources they own, and the platform handles the entire request → approval → loan → return flow with notifications and a permanent audit trail.

No asset is ever hard-deleted. Every state change is logged with the actor, timestamp, IP address, and relevant metadata.

---

## Features

### For All Users
- Register with full name, username, employee ID, email, department, and team
- Browse all resources across the organisation by department and team
- Request a free resource with a specified loan duration and optional message
- Cancel a pending request at any time
- Add resources you personally own — your team and department are auto-assigned
- View everything you currently own, are lending, or are borrowing from a single dashboard
- Approve or reject incoming requests on resources you permanently own
- Mark borrowed resources as returned
- Real-time in-app notifications for every relevant event

### For Admins
- Manage the full department and team hierarchy
- Create resources and assign permanent ownership to any user
- Reassign permanent ownership at any time (e.g. when someone changes teams)
- View and manage all users — activate, deactivate, reassign teams
- Deactivating a user automatically force-returns all their active loans and reverts their resources to admin custody
- Full audit log with filters by actor, entity type, action, and date range — exportable to CSV
- Manage allowed email domains for registration

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript — strict mode, zero `any` |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Validation | Zod |
| Email | Resend *(stubbed — ready to wire)* |
| Font | Inter via `next/font/google` |

---

## Architecture

```
Browser
  │
  ├── Next.js App Router (SSR by default)
  │     ├── Server Components → fetch data directly from Supabase server client
  │     └── Client Components → interactive islands only (forms, modals, tables)
  │
  ├── proxy.ts (Next.js 16 network boundary)
  │     ├── Redirects unauthenticated users to /login
  │     ├── Redirects non-admins away from /admin/*
  │     └── Redirects deactivated users to /login
  │
  └── Next.js API Routes
        ├── Session validated server-side on every route
        ├── Role checked on every admin route
        ├── Zod parses every request body
        ├── Transactions used for all multi-table writes
        ├── Audit log written on every state change
        └── Notifications created on every relevant event

Supabase
  ├── Auth — hashed passwords, access tokens, refresh tokens, PKCE reset flow
  ├── PostgreSQL — full schema with FK constraints, check constraints, unique indexes
  └── RLS — row-level security as a second layer of defence on every table
```

### SSR vs CSR Split

All pages are server-rendered by default. Client components are used only where genuine interactivity is required:

| Component | Why CSR |
|---|---|
| `LoginForm`, `RegisterForm` | Form state and validation feedback |
| Cascading department/team dropdowns | Dependent dynamic state |
| `NotificationBell` | Live unread count |
| `RequestModal`, `AddResourceModal` | Interactive forms |
| Approve / Reject buttons | Optimistic UI updates |
| Admin `DataTable` | Client-side sort, filter, pagination |
| `SessionWarning` | Timer-based expiry warning |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is sufficient for development)

### Installation

```bash
git clone https://github.com/your-org/hardware-hub.git
cd hardware-hub
npm install
```

### Configure environment variables

```bash
cp .env.example .env.local
# Fill in your Supabase project URL and anon key — see Environment Variables below
```

### Set up the database

Run the full schema SQL against your Supabase project. See [Database Setup](#database-setup) for the complete script and instructions.

### Seed the admin user

1. Create a user in your Supabase dashboard under **Authentication → Users**
2. Copy the generated UUID
3. Run the following in the Supabase SQL editor:

```sql
insert into public.users (id, email, full_name, username, role, status)
values (
  'PASTE_UUID_HERE',
  'admin@mbrdi.mercedes-benz.com',
  'System Administrator',
  'admin',
  'admin',
  'active'
);

insert into public.allowed_domains (domain)
values ('mbrdi.mercedes-benz.com');
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create a `.env.local` file at the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Resend (stubbed — not yet active)
RESEND_API_KEY=your-resend-api-key
```

Both Supabase variables are required. The Resend key is optional until email is wired up.

---

## Database Setup

Run the following in order in the Supabase SQL editor. Tables must be created in dependency order to satisfy foreign key constraints.

### 1. Core tables

```sql
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint departments_name_unique unique (name)
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid not null references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint teams_name_dept_unique unique (name, department_id)
);

create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null unique,
  full_name text not null,
  username text not null unique,
  employee_id text not null unique,
  role text not null default 'user' check (role in ('admin', 'user')),
  status text not null default 'active' check (status in ('active', 'deactivated')),
  department_id uuid references public.departments(id) on delete set null,
  team_id uuid references public.teams(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.allowed_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  created_at timestamptz not null default now()
);

create table public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('hardware', 'licence')),
  description text,
  serial_number text unique,
  status text not null default 'free' check (status in ('free', 'on_loan')),
  team_id uuid references public.teams(id) on delete set null,
  permanent_owner_id uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  requester_id uuid not null references public.users(id) on delete cascade,
  requested_duration_days integer not null check (requested_duration_days > 0 and requested_duration_days <= 365),
  message text check (char_length(message) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.loans (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  borrower_id uuid not null references public.users(id) on delete cascade,
  approved_by uuid not null references public.users(id) on delete cascade,
  start_date timestamptz not null default now(),
  end_date timestamptz not null,
  returned_at timestamptz,
  status text not null default 'active' check (status in ('active', 'returned', 'overdue')),
  created_at timestamptz not null default now(),
  constraint end_after_start check (end_date > start_date)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);
```

### 2. Triggers and indexes

```sql
-- auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger users_updated_at
  before update on public.users for each row execute function update_updated_at();

create trigger resources_updated_at
  before update on public.resources for each row execute function update_updated_at();

-- performance indexes
create index idx_resources_team_id on public.resources(team_id) where deleted_at is null;
create index idx_resources_permanent_owner on public.resources(permanent_owner_id) where deleted_at is null;
create index idx_resources_status on public.resources(status) where deleted_at is null;
create index idx_requests_resource_id on public.requests(resource_id);
create index idx_requests_requester_id on public.requests(requester_id);
create index idx_loans_resource_id on public.loans(resource_id);
create index idx_loans_status on public.loans(status);
create index idx_notifications_user_id on public.notifications(user_id);
create index idx_audit_log_created on public.audit_log(created_at desc);
create index idx_users_username on public.users(username);
```

### 3. Enable RLS

```sql
alter table public.users enable row level security;
alter table public.departments enable row level security;
alter table public.teams enable row level security;
alter table public.resources enable row level security;
alter table public.requests enable row level security;
alter table public.loans enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.allowed_domains enable row level security;
```

Full RLS policy definitions are in `/supabase/policies.sql`.

---

## Project Structure

```
hardware-hub/
├── app/
│   ├── layout.tsx                  # Root layout, Inter font, global metadata
│   ├── page.tsx                    # Landing page
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/             # PKCE reset flow
│   ├── dashboard/                  # Auth protected
│   ├── explore/                    # Auth protected — browse by dept/team
│   ├── resources/[id]/             # Resource detail + history
│   ├── notifications/
│   ├── admin/                      # Admin protected
│   │   ├── layout.tsx
│   │   ├── page.tsx                # Admin overview
│   │   ├── departments/
│   │   ├── teams/
│   │   ├── resources/
│   │   ├── users/
│   │   ├── audit/
│   │   └── domains/
│   ├── not-found.tsx
│   ├── error.tsx
│   └── forbidden/
│
├── components/
│   ├── ui/                         # Primitives: Button, Input, Badge, Modal, etc.
│   ├── layout/                     # Navbar, NotificationBell, SessionWarning
│   ├── resources/                  # ResourceCard, RequestModal, AddResourceModal
│   ├── admin/                      # DataTable, ResourceForm, AuditTable
│   └── forms/                      # LoginForm, RegisterForm, ForgotPasswordForm
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   └── server.ts               # Server client (cookies)
│   ├── schemas/                    # All Zod schemas
│   ├── types/
│   │   └── supabase.ts             # Generated Supabase types
│   └── utils/
│       ├── cn.ts                   # clsx + tailwind-merge
│       ├── sanitise.ts             # Strip HTML/scripts from free text
│       ├── auditLog.ts             # Reusable audit log writer
│       ├── notify.ts               # Reusable notification creator
│       └── extractDomain.ts
│
├── proxy.ts                        # Next.js 16 network boundary (auth + role guards)
├── middleware.ts                   # (deprecated — use proxy.ts in Next.js 16+)
└── .env.local                      # Local environment variables (never commit)
```

---

## Authentication

Hardware Hub uses Supabase Auth with email and password. Supabase handles password hashing, access tokens, and refresh token rotation natively.

### Registration flow

1. User fills the registration form — full name, username, employee ID, email, password, department, team
2. Supabase creates the auth user
3. The `/api/auth/complete-profile` endpoint validates the email domain against `allowed_domains`, checks username and employee ID uniqueness, and inserts the full profile into `public.users`
4. User lands on `/dashboard` immediately — no admin activation required

### Password reset flow

1. User submits their email on `/forgot-password`
2. Supabase sends a PKCE reset link to that email
3. User clicks the link and lands on `/reset-password`
4. New password is validated with Zod (min 8 chars, must match confirmation)
5. `supabase.auth.updateUser()` sets the new password
6. User is redirected to `/login`

### Network boundary guards (`proxy.ts`)

All route protection runs at the Next.js 16 network boundary before any page code executes:

- Unauthenticated users hitting any protected route → redirect to `/login`
- Authenticated users hitting `/admin/*` without `role = 'admin'` → redirect to `/forbidden`
- Deactivated users hitting any protected route → signed out, redirect to `/login?error=deactivated`
- Authenticated users hitting `/login` or `/register` → redirect to `/dashboard`

---

## Role System

| Role | Capabilities |
|---|---|
| `user` | Register, add own resources, browse all resources, request free resources, approve/reject requests on own resources, return borrowed resources |
| `admin` | Everything a user can do, plus: manage departments/teams, manage all resources, manage all users, view audit log, manage allowed domains |

The admin account is seeded manually. All other accounts are `user` by default. There is no self-service role elevation.

---

## Resource Lifecycle

```
Created (free)
     │
     ├── User or Admin creates resource
     │   └── permanent_owner_id set, status = 'free'
     │
     ▼
Request submitted (by another user)
     │
     ├── permanent_owner approves → Loan created, status = 'on_loan'
     └── permanent_owner rejects → status remains 'free'
          │
          ▼
     Active loan
          │
          ├── Borrower returns → status = 'free', loan.status = 'returned'
          └── end_date passes without return → loan.status = 'overdue'
               │                               both parties notified
               └── Borrower returns → same as above
```

### Key rules

- A resource must be `free` to be requestable
- A user cannot request a resource they permanently own
- Only the permanent owner can approve or reject a request
- When a user is deactivated, all their active loans are force-returned and all their owned resources revert to admin custody
- No resource is ever hard-deleted — `deleted_at` is set instead

---

## API Reference

All routes follow the same contract:

- **Request:** JSON body validated with Zod before any DB operation
- **Response:** `{ data, error, message }` with appropriate HTTP status codes
- **Auth:** Session validated server-side on every route — client identity is never trusted
- **Errors:** Raw Postgres errors are never exposed — all DB errors are caught and sanitised

### Auth
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/auth/complete-profile` | Authenticated | Save profile after Supabase signup |

### Resources
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/resources` | Authenticated | List with filters: team, status, type, search |
| GET | `/api/resources/[id]` | Authenticated | Detail + current loan + full history |
| POST | `/api/resources` | Authenticated | Create — owner/team auto-assigned for users, manual for admin |
| PATCH | `/api/resources/[id]` | Admin | Update resource or reassign permanent owner |
| DELETE | `/api/resources/[id]` | Admin | Soft delete (requires typed confirmation) |

### Requests
| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/api/requests` | Authenticated | Submit a request on a free resource |
| GET | `/api/requests` | Authenticated | Scoped list — own requests + incoming on owned resources |
| PATCH | `/api/requests/[id]/approve` | Permanent owner | Approve — creates loan in transaction |
| PATCH | `/api/requests/[id]/reject` | Permanent owner | Reject request |
| PATCH | `/api/requests/[id]/cancel` | Requester | Cancel a pending request |

### Loans
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/loans` | Authenticated | Scoped list |
| PATCH | `/api/loans/[id]/return` | Borrower | Mark resource as returned |

### Users
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | All users with filters |
| PATCH | `/api/users/[id]/deactivate` | Admin | Deactivate + full cascade (requires typed confirmation) |
| PATCH | `/api/users/[id]/activate` | Admin | Reactivate a deactivated user |
| PATCH | `/api/users/[id]/team` | Admin | Reassign department and team |

### Departments & Teams
| Method | Route | Access | Description |
|---|---|---|---|
| GET/POST | `/api/departments` | Admin | List or create |
| PATCH/DELETE | `/api/departments/[id]` | Admin | Update or soft delete |
| GET/POST | `/api/teams` | Authenticated / Admin | List or create |
| PATCH/DELETE | `/api/teams/[id]` | Admin | Update or soft delete |

### Notifications
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/notifications` | Authenticated | Own notifications with unread count |
| PATCH | `/api/notifications/[id]/read` | Authenticated | Mark one read |
| PATCH | `/api/notifications/read-all` | Authenticated | Mark all read |

### Audit & Domains
| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/api/audit` | Admin | Full log with filters. Add `?format=csv` for export |
| GET/POST | `/api/domains` | Admin | List or add allowed domains |
| DELETE | `/api/domains/[id]` | Admin | Remove a domain |

---

## Deployment

Hardware Hub is designed to deploy on Vercel with zero additional configuration.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Set the following environment variables in your Vercel project settings:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
RESEND_API_KEY
```

Ensure your Supabase project has the correct **Site URL** and **Redirect URLs** set under Authentication → URL Configuration:

```
Site URL:       https://your-domain.vercel.app
Redirect URLs:  https://your-domain.vercel.app/reset-password
```

---

## Security

### Layered defence

| Layer | Mechanism |
|---|---|
| Network boundary | `proxy.ts` — auth and role checks before any page code runs |
| API routes | Server-side session validation on every route, role check on every admin route |
| Database | Supabase RLS policies enforce access rules at the data layer |
| Input | Zod validates every request body; HTML/scripts stripped from all free text |
| Auth | Supabase handles password hashing, token rotation, and PKCE — no custom JWT logic |

### Data integrity

- No hard deletes anywhere — all records have `deleted_at`
- All multi-table writes use Postgres transactions — no partial state ever
- `updated_at` triggers maintained at the DB level, not application level
- Unique constraints on usernames, employee IDs, serial numbers, and domain names
- Audit log is append-only — no update or delete routes exist for it

### Audit trail

Every state-changing operation writes a row to `audit_log` with:

- `actor_id` — who performed the action
- `action` — machine-readable action string (e.g. `resource.created`, `loan.approved`)
- `entity_type` + `entity_id` — what was affected
- `metadata` — relevant context as JSON
- `ip_address` + `user_agent` — from request headers
- `created_at` — immutable timestamp

The audit log is readable only by admins and is exportable to CSV.

### Destructive actions

All irreversible admin actions (deactivate user, delete resource) require a typed confirmation string in the request body, enforced at the API level. The UI presents a `ConfirmDialog` component before allowing submission.

---

## Notification Events

| Event | Recipients |
|---|---|
| Request submitted | Permanent owner |
| Request approved | Requester |
| Request rejected | Requester |
| Loan returned | Permanent owner |
| Loan overdue | Borrower + Permanent owner |
| Resource reassigned | New permanent owner |
| Account deactivated | Affected user |

Notifications are delivered in-app. Email delivery via Resend is stubbed and ready to activate.

---

*Hardware Hub — Built by team in MBRDI · Mercedes-Benz Research and Development India*