# Testing Guide

This guide is for judges or first-time reviewers.

## 1. Quick Health Check

From the project root:

```powershell
cd frontend
npm install
npm run lint
npm run build
```

```powershell
cd ..\backend
.\mvnw.cmd test
```

Expected result:

- frontend lint passes
- frontend build passes
- backend tests pass

## 2. Start the App

Terminal 1:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Terminal 2:

```powershell
cd frontend
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

## 3. Test Without External Credentials

This verifies the core app UX.

1. Register a new account.
2. Open Resumes.
3. Add a resume version.
4. Open Add Application.
5. Paste a sample job post.
6. Click Prefill from paste.
7. Save the application.
8. Open Dashboard and confirm the application appears.
9. Open First Mate and confirm it summarizes missing memory/follow-ups.
10. Open Sources and confirm Coral source status loads.

Sample job post:

```text
Frontend Engineer
Acme Software
Remote
Salary 12-18 LPA
We are hiring a React developer with JavaScript, REST APIs, SQL, and 2+ years of experience.
Apply: https://linkedin.com/jobs/view/example
```

## 4. Test Coral CLI

```powershell
coral --version
coral source discover
coral source list
```

Validate Gmail source:

```powershell
coral source lint .\coral-sources\gmail.yaml
```

Expected:

```text
Manifest is valid
```

## 5. Connect Gmail for Automatic Tracking

Get a Google OAuth access token with this scope:

```text
https://www.googleapis.com/auth/gmail.readonly
```

Then:

```powershell
set GMAIL_ACCESS_TOKEN=your_google_oauth_access_token
coral source add --file coral-sources/gmail.yaml
coral source test gmail
```

Confirm:

```powershell
coral source list
```

## 6. Test Auto Track

1. Make sure Gmail has job application/status emails.
2. Open Auto Track.
3. Click Preview.
4. Confirm inferred jobs appear.
5. Confirm daily overview shows counts.
6. Click Import inferred jobs.
7. Open Dashboard.
8. Confirm imported records appear.

The system looks for email language like:

- thank you for applying
- application received
- application submitted
- your application
- not selected
- unfortunately
- interview
- assessment
- next steps

## 7. Connect More Coral Sources

GitHub:

```powershell
set GITHUB_TOKEN=your_github_token
coral source add github
```

Google Calendar:

```powershell
set GOOGLE_CALENDAR_ACCESS_TOKEN=your_google_calendar_access_token
coral source add google_calendar
```

Notion:

```powershell
set NOTION_API_KEY=your_notion_secret
coral source add notion
```

Slack:

```powershell
set SLACK_TOKEN=your_slack_token
coral source add slack
```

Open Sources in the app and click Refresh.

## 8. Test Coral SQL Page

Open Coral SQL and run queries after sources are connected.

Gmail:

```sql
SELECT id
FROM gmail.search_messages(
  q => 'newer_than:30d ("application received" OR "thank you for applying" OR interview OR unfortunately)',
  max_results => 20
);
```

Google Calendar:

```sql
SELECT *
FROM google_calendar.events
LIMIT 10;
```

Notion:

```sql
SELECT *
FROM notion.pages
LIMIT 10;
```

GitHub:

```sql
SELECT *
FROM github.issues
LIMIT 10;
```

## 9. Expected Demo Outcome

After Gmail is connected:

- Auto Track discovers job emails.
- It infers application records.
- Dashboard shows imported applications.
- First Mate shows what needs action.
- Sources proves Coral connections are live.
- Coral SQL proves tools are queryable.

## 10. Troubleshooting

Coral says no sources configured:

```powershell
coral source list
```

Add Gmail:

```powershell
set GMAIL_ACCESS_TOKEN=your_token
coral source add --file coral-sources/gmail.yaml
```

Frontend cannot reach backend:

- Confirm backend is running on `http://localhost:8080`
- Confirm frontend is running on `http://127.0.0.1:5173`

Gmail preview shows not connected:

- Confirm `GMAIL_ACCESS_TOKEN` is set
- Confirm `coral source list` shows Gmail
- Confirm token has `gmail.readonly` scope
- Confirm token is not expired

Port already in use:

- Stop old backend/frontend terminal
- Restart the command

## 11. Files To Review

- [README.md](README.md)
- [coral-sources/gmail.yaml](coral-sources/gmail.yaml)
- [backend/src/main/java/com/jobhuntbuddy/backend/controller/EmailIntelligenceController.java](backend/src/main/java/com/jobhuntbuddy/backend/controller/EmailIntelligenceController.java)
- [backend/src/main/java/com/jobhuntbuddy/backend/controller/AgentController.java](backend/src/main/java/com/jobhuntbuddy/backend/controller/AgentController.java)
- [frontend/src/pages/AutoTrackPage.jsx](frontend/src/pages/AutoTrackPage.jsx)
- [frontend/src/pages/FirstMatePage.jsx](frontend/src/pages/FirstMatePage.jsx)
- [frontend/src/pages/CoralSourcesPage.jsx](frontend/src/pages/CoralSourcesPage.jsx)
