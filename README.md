# E-Mail Client

Minimalistischer E-Mail-Client mit Next.js, shadcn/ui, ImapFlow (IMAP) und Nodemailer (SMTP).

## Setup

1. `.env.local` aus `.env.example` kopieren und mit echten Werten füllen
2. Für Gmail: App-Passwort unter [Google App Passwords](https://myaccount.google.com/apppasswords) erstellen (2FA erforderlich)
3. `npm install && npm run dev`

## Nutzung

- Links: Sidebar mit Ordnern (INBOX, Sent, ...)
- Mitte: Inbox-Liste (letzte 20 E-Mails)
- Rechts: E-Mail-Inhalt (nach Klick auf eine E-Mail)
- Oben rechts: "Verfassen" zum Senden neuer E-Mails

## API

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/emails/list` | POST | Ordnerliste abrufen |
| `/api/emails/inbox` | POST | Inbox-E-Mails abrufen (`{ page, pageSize }`) |
| `/api/emails/[uid]` | GET | Einzelne E-Mail laden |
| `/api/emails/send` | POST | E-Mail senden (body: `{ to, subject, text, html? }`) |
