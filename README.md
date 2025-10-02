# Undergrad CRM (Next.js + Firebase + Firestore)

### A lightweight internal CRM to track prospective undergrads, log communications, add notes, and (optionally) send follow-up emails automatically.

### Built with Next.js 15 (App Router, TypeScript), Firebase Auth + Firestore, Tailwind CSS, and a simple cron endpoint for overdue follow-ups. Email can be logged locally (mock) or sent for real via Customer.io.

#### Features

- Auth (email/password) with Firebase.

- Dashboard with quick stats.

- Students list with search + quick filters:

- Not contacted in 7 days

- High intent

- Needs essay help

- Student profile

- Progress stage (Exploring → Shortlisting → Applying → Submitted)

- Log communications (call/email/sms)

- Internal notes

- Interaction timeline

- “Trigger follow-up” button (mock or real)
- Opt-out flag: Disable auto follow-ups

- Tasks page (basic live route)

- Auto follow-up cron (/api/cron/send-overdue-followups)

- Sends a follow-up to students inactive for ≥7 days (throttled)

- Respects autoFollowupDisabled

- Logs each send to students/{id}/communications

#### Tech Stack

- Next.js 15, TypeScript, App Router

- Tailwind CSS

- Firebase Auth & Cloud Firestore

- Customer.io Transactional Email


### Getting Started
1) Clone & install
```bash
git clone https://github.com/008916759-nishitasatya/undergrad-crm.git
```
```bash
cd undergrad-crm
```
```bash
npm install
```
3) Env vars

- Create .env.local (this file is ignored; do not commit secrets):

#### Firebase (Web SDK) 
NEXT_PUBLIC_FIREBASE_API_KEY=...

NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...

NEXT_PUBLIC_FIREBASE_PROJECT_ID=...

NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...

NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...

NEXT_PUBLIC_FIREBASE_APP_ID=...


#### Customer.io (for real email)
CUSTOMERIO_SITE_ID=            # Track API (Basic)

CUSTOMERIO_API_KEY=

CUSTOMERIO_TX_API_KEY=         # Transactional API (Bearer)

CUSTOMERIO_TRANSACTIONAL_MESSAGE_ID=tm_xxxxxxxxxx

CUSTOMERIO_FROM_EMAIL=no-reply@undergraduation.com


A committed template lives at .env.local.example.

3) Firebase setup

Auth → Sign-in method → Email/Password: Enable.

Firestore → Create database (Production mode).

Rules (basic dev rule; tighten for production):

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

4) Run the dev server
npm run dev
- http://localhost:3000


#### Create a staff user via Firebase Auth or sign up if you kept signup enabled.

Firestore Data Model (minimum)
```bash
students (collection)
  {studentId} (doc)
    name: string
    email: string
    country?: string
    grade?: string
    status: "Exploring" | "Shortlisting" | "Applying" | "Submitted"
    tags?: string[]               # e.g. ["highIntent", "needsEssayHelp"]
    lastActive?: number           # ms epoch
    lastFollowupSentAt?: number   # ms epoch
    autoFollowupDisabled?: boolean
    updatedAt?: number

  {studentId}/communications (subcollection)
    {commId}
      channel: "email" | "sms" | "call"
      body: string
      subject?: string
      ts: number
      author: "staff" | "system"
      type?: "auto-followup" | "manual"
      provider?: "customerio"
      providerDeliveryId?: string
      status?: "queued" | "delivered" | "bounced" | ...
```

#### Add docs manually in the Firebase Console or build your own seed routine.

Using the App

/login — sign in with your staff account.

/dashboard — quick stats (counts by stage).

/students — search, quick filters, and a “Run auto-followups now” button that:

Scans all students

Skips recently contacted + opted out

Logs a mock email (or sends a real one if Customer.io is enabled)

/students/[id] — profile page

Change stage

Log comms (call/email/sms)

Add internal notes

Trigger follow-up (mock) button

Auto Follow-Ups (cron)

Endpoint: GET /api/cron/send-overdue-followups

Only runs if Authorization: Bearer <CRON_SECRET> matches your env.

Picks students with lastActive <= now - 7d.

Throttled: if lastFollowupSentAt > now - 7d → skip.



