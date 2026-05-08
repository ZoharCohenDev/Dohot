# Dohot — Professional Field Reports

Hebrew RTL mobile app for field professionals (leak detectors, plumbers, electricians) to create and share inspection reports, quotes, and work logs using voice input and AI.

## Architecture

```
dohot/
├── apps/
│   ├── mobile/          # Expo React Native app (@dohot/mobile)
│   └── server/          # Express API server (@dohot/server)
├── packages/
│   └── shared/          # Shared TypeScript types (@dohot/shared)
└── supabase/            # Database schema and migrations
```

**Stack:** Expo 53 · React Native · Expo Router 6 · Supabase (auth + postgres + storage) · Express · Puppeteer (PDF generation) · TypeScript strict

---

## Prerequisites

- Node.js 20+
- Yarn (`npm i -g yarn`)
- Expo CLI (`npm i -g expo-cli`)
- A [Supabase](https://supabase.com) project
- (iOS) Xcode 15+ with a simulator
- (Android) Android Studio with an AVD

---

## Environment Variables

### Mobile — `apps/mobile/.env`

```env
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Server — `apps/server/.env`

```env
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
PORT=3000
```

> The server uses the **service role** key (bypasses RLS) so it can read all tables when generating PDFs. Never expose this key to the client.

---

## Supabase Setup

### 1. Run the schema

In the Supabase SQL Editor, run `supabase/schema.sql` to create all tables, RLS policies, and triggers.

### 2. Create storage buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `logos` | No | Business profile logos |
| `signatures` | No | Digital signature images |
| `report-images` | No | Photos attached to reports |
| `pdf-documents` | No | Generated PDF files |

For each bucket, add a policy that allows the authenticated owner to read/write:

```sql
-- Example for pdf-documents (repeat for each bucket)
CREATE POLICY "owner access"
ON storage.objects FOR ALL
USING (auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Enable email auth

In **Authentication → Providers**, enable Email with "Confirm email" turned **off** for development (or configure your SMTP settings for production).

---

## Running Locally

### Install dependencies

```bash
yarn install
```

### Start the API server

```bash
cd apps/server
yarn dev
# Starts on http://localhost:3000
```

### Start the mobile app

```bash
cd apps/mobile
yarn start
# Press i for iOS simulator, a for Android
```

### Type-check everything

```bash
yarn typecheck
```

---

## Key Flows

### Report wizard

1. **Customer** — name, phone, address → creates `customers` row and a draft `documents` row in the background
2. **Issue** — type (leak / waterproofing / pipe / roof / moisture) + notes
3. **Photos** — pick from gallery or camera, annotate
4. **Voice** — dictate findings; transcribed by server AI
5. **Recommendations** — AI-generated, editable priority/title/description rows
6. **Preview** — in-app PDF preview; triggers Puppeteer PDF generation on the server
7. **Send** — WhatsApp, native share sheet, or save PDF to device

### PDF generation

`POST /api/documents/:documentId/generate-pdf`

Server fetches the full document + report + customer + business profile from Supabase, renders a two-page A4 RTL Hebrew PDF via Puppeteer, uploads it to the `pdf-documents` bucket, saves the signed URL in `documents.pdf_url`, and returns it.

---

## Database Tables

| Table | Description |
|-------|-------------|
| `business_profiles` | One row per user — name, profession, logo, signature |
| `customers` | Contacts linked to a professional |
| `documents` | Parent record: type, status, amount, pdf_url |
| `reports` | Detail for report/worklog documents — findings, photos, recommendations |
| `quote_items` | Line items for quote documents |

All tables have RLS policies enforcing `professional_id = auth.uid()`.

---

## Folder Structure (mobile)

```
apps/mobile/
├── app/                     # Expo Router file-based routes
│   ├── (app)/               # Authenticated shell + wizard steps
│   ├── (auth)/              # Login, register, profile, trust
│   └── (onboarding)/        # First-run business setup
└── src/
    ├── components/          # layout/, primitives/, shared/, icons/
    ├── context/             # AuthContext, WizardContext
    ├── hooks/               # useDocuments, useCustomers, useDashboard
    ├── lib/                 # Supabase client (chunked SecureStore adapter)
    ├── screens/             # Feature screens consumed by route files
    ├── services/            # documents.ts — Supabase + API calls
    └── theme/               # tokens.ts — colors, fonts, shadows
```
