# LandlordBot Live - Production Version

This is the production version of LandlordBot with real authentication and persistent data storage using Supabase.

## Key Differences from Demo Version

| Feature | Demo (landlord-saas-dashboard) | Live (landlord-bot-live) |
|---------|--------------------------------|--------------------------|
| **Authentication** | Mock/demo login | Real email/password with Supabase Auth |
| **Data Storage** | localStorage (mock) | PostgreSQL database via Supabase |
| **User Data** | Generated on each session | Persistent per user account |
| **Scalability** | Single user | Unlimited real users |
| **Security** | Client-side only | Row Level Security (RLS) |

## Tech Stack

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Authentication**: Supabase Auth (email/password)
- **Database**: PostgreSQL via Supabase
- **Real-time**: Supabase Realtime subscriptions
- **Deployment**: Vercel/Netlify ready

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. A Supabase account (free tier works great)
3. (Optional) Vercel/Netlify account for deployment

### Setup Instructions

#### 1. Clone and Install

```bash
git clone <your-repo-url>
cd landlord-bot-live
npm install
```

#### 2. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Note your **Project URL** and **anon public key**
4. Go to Database > Tables and create the following tables:

**Table: users**
```sql
create table users (
  id uuid references auth.users primary key,
  email text unique not null,
  first_name text,
  last_name text,
  phone_number text,
  property_address text,
  bot_phone_number text,
  subscription_tier text default 'free',
  subscription_status text default 'active',
  max_units int default -1,
  storage_used bigint default 0,
  storage_limit bigint default 1073741824,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table users enable row level security;

-- Create policy
create policy "Users can only access their own data"
  on users
  for all
  using (auth.uid() = id);
```

**Table: units**
```sql
create table units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  address text not null,
  unit_number text,
  rent_amount numeric(10,2),
  status text default 'vacant',
  tenant_name text,
  tenant_email text,
  tenant_phone text,
  lease_start date,
  lease_end date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table units enable row level security;

create policy "Users can CRUD their own units"
  on units
  for all
  using (auth.uid() = user_id);
```

**Table: maintenance_requests**
```sql
create table maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  unit_id uuid references units(id) not null,
  title text not null,
  description text,
  status text default 'open',
  priority text default 'medium',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table maintenance_requests enable row level security;

create policy "Users can CRUD their own maintenance requests"
  on maintenance_requests
  for all
  using (auth.uid() = user_id);
```

**Table: leads**
```sql
create table leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  name text not null,
  email text,
  phone text,
  status text default 'new',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table leads enable row level security;

create policy "Users can CRUD their own leads"
  on leads
  for all
  using (auth.uid() = user_id);
```

**Table: payments**
```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) not null,
  unit_id uuid references units(id) not null,
  amount numeric(10,2) not null,
  due_date date not null,
  paid_date date,
  status text default 'pending',
  late_fee numeric(10,2) default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table payments enable row level security;

create policy "Users can CRUD their own payments"
  on payments
  for all
  using (auth.uid() = user_id);
```

#### 3. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

#### 5. Build for Production

```bash
npm run build
```

The `dist` folder will contain your production-ready app.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Netlify

1. Push your code to GitHub
2. Connect your repo to Netlify
3. Set build command: `npm run build`
4. Set publish directory: `dist`
5. Add environment variables
6. Deploy!

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **Supabase Auth**: Secure email/password authentication
- **Automatic JWT refresh**: Tokens refresh automatically
- **Password hashing**: Securely handled by Supabase

## Data Migration from Demo

If you want to migrate data from the demo version:

1. Export your localStorage data from the demo app
2. Use the Supabase API or SQL to import into the new database
3. Contact support if you need help with migration

## Support

For issues or questions:
- Check the [Troubleshooting](#troubleshooting) section below
- Open an issue on GitHub
- Email support@landlordbot.app

## Troubleshooting

**ERROR: "Supabase credentials not found"**
- Solution: Make sure `.env.local` exists and contains valid Supabase credentials

**ERROR: "Failed to fetch" when loading data**
- Solution: Check your internet connection and verify Supabase project is active

**Users can see each other's data**
- Solution: Make sure Row Level Security (RLS) is enabled on all tables

## License

Same as the demo version - see root LICENSE file.
