# New Beginning Outreach - Intake Portal

A production-ready client intake and tracking system built with Next.js, Tailwind CSS v4, and Supabase.

## 🚀 One-Click Setup (Recommended)

To set up your environment, install dependencies, and get started, simply run:

```bash
npm run setup
```

This guided script will walk you through the entire process.

---

## 🛠️ Manual Installation

### 1. Environment Setup

Clone the environment template and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

### 2. Database Setup (Required)

1. Log in to your [Supabase Dashboard](https://app.supabase.com).
2. Go to the **SQL Editor**.
3. Copy the contents of [`schema.sql`](./schema.sql) and run it.

### 3. Installation

```bash
npm install
```

### 4. Running

```bash
npm run dev
```

---

## 🏗️ Architecture & Features

- **Layered Backend**: Controllers, Services, and Repositories.
- **Modern UI**: Tailwind CSS v4 + OKLCH colors + Framer Motion.
- **Secure**: Granular RLS policies and Zod validation.
- **Tested**: Unit test suite included (`npm test`).

*Enterprise Class • HIPAA Compliant • Secure*
