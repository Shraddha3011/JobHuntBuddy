# JobHuntBuddy First Mate

Track 2: Build a Personal Agent

JobHuntBuddy First Mate is a personal job-search agent for people applying to many roles across LinkedIn, company career pages, referrals, and communities. It automatically builds a memory of applications from everyday tools, especially Gmail acknowledgement/status emails, then tells the user what happened, what is pending, and what to do next.

## Problem

Job seekers often apply to 50, 100, or 200 roles across LinkedIn and company portals. Later, when a recruiter replies, they forget:

- which role they applied to
- which company or platform it came from
- which resume version they used
- what the job description required
- when they applied
- whether the company rejected, shortlisted, or never replied

Manual trackers break down because the user has to copy everything by hand. JobHuntBuddy solves this by using Coral to query everyday tools as SQL tables and an agent layer to infer the job-search timeline.

## Solution

JobHuntBuddy First Mate connects workflow data through Coral and turns it into a job-search command center.

Core idea:

1. The user applies on LinkedIn or a company career page.
2. They receive acknowledgement/status emails in Gmail.
3. Coral exposes Gmail as queryable tables through a custom Gmail source spec.
4. JobHuntBuddy scans emails for application, interview, rejection, offer, and assessment signals.
5. The app automatically imports inferred applications into the tracker.
6. First Mate summarizes pending work, missing information, follow-ups, duplicates, and resume usage.

## Hackathon Fit

Coral is used as the query layer for tools and sources:

- Gmail custom source: application acknowledgements, interview invites, offers, rejections
- Google Calendar bundled source: interviews, deadlines, recruiter calls
- Notion bundled source: prep notes, company research, resume tailoring notes
- GitHub bundled source: portfolio proof, issues, pull requests, open-source work
- Slack bundled source: referrals, community job posts, recruiter/community messages
- Local JobHuntBuddy database: applications, statuses, resumes, job descriptions, requirements

The project demonstrates how Coral can make personal workflow data queryable through SQL and usable by an agent.

## Key Features

- Automatic Gmail-based job tracking via Coral
- Custom Coral Gmail source spec
- Daily overview of applied/interview/offer/rejected counts
- One-click import of inferred jobs from Gmail
- First Mate agent briefing
- Follow-up queue
- Missing memory detection for resume/JD/requirements
- Duplicate application detection
- Resume version tracking
- Quick paste job-post parser
- Coral source status screen
- Coral SQL workspace for cross-source queries
- Local-first setup with H2 database

## Tech Stack

Frontend:

- React
- Vite
- Tailwind CSS
- React Router
- Axios
- Lucide icons

Backend:

- Java 17
- Spring Boot 4
- Spring Security
- JWT authentication
- Spring Data JPA
- H2 local database by default
- PostgreSQL supported through environment variables

Agent and data layer:

- Coral CLI
- Custom Coral Gmail source spec
- Coral bundled sources: GitHub, Google Calendar, Notion, Slack
- SQL-based source querying

## Project Structure

```text
backend/
  src/main/java/com/jobhuntbuddy/backend/
    controller/
      AgentController.java
      CoralController.java
      CoralSourceController.java
      EmailIntelligenceController.java
    entity/
    repository/
    security/

frontend/
  src/
    pages/
      DashboardPage.jsx
      FirstMatePage.jsx
      AutoTrackPage.jsx
      AddApplicationPage.jsx
      ResumesPage.jsx
      CoralSourcesPage.jsx
      InsightsPage.jsx

coral-sources/
  gmail.yaml

TESTING_GUIDE.md
```

## Prerequisites

- Java 17
- Node.js and npm
- Coral CLI installed and available on PATH

Check Coral:

```powershell
coral --version
coral source discover
coral source list
```

## Run the Project

Start backend:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

Start frontend in another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173/
```

The backend runs at:

```text
http://localhost:8080
```

## Database Setup

No database setup is required for local judging. The app uses H2 by default:

```properties
jdbc:h2:file:./data/jobhuntbuddy
```

Optional PostgreSQL:

```powershell
set DB_URL=jdbc:postgresql://localhost:5432/jobhuntbuddy
set DB_USERNAME=postgres
set DB_PASSWORD=postgres
set DB_DRIVER=org.postgresql.Driver
set HIBERNATE_DIALECT=org.hibernate.dialect.PostgreSQLDialect
```

## Coral Source Setup

### Gmail Custom Source

The project includes a custom Gmail source spec:

```text
coral-sources/gmail.yaml
```

Validate it:

```powershell
coral source lint .\coral-sources\gmail.yaml
```

Expected:

```text
Manifest is valid
```

Connect Gmail:

```powershell
set GMAIL_ACCESS_TOKEN=your_google_oauth_access_token
coral source add --file coral-sources/gmail.yaml
coral source test gmail
```

The token needs Gmail readonly scope:

```text
https://www.googleapis.com/auth/gmail.readonly
```

### Other Recommended Sources

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

Check configured sources:

```powershell
coral source list
```

## How Automatic Tracking Works

The Auto Track page calls:

```text
GET /api/agent/email/preview
POST /api/agent/email/sync
```

The backend runs Coral SQL against Gmail:

```sql
SELECT id
FROM gmail.search_messages(
  q => 'newer_than:120d ("thank you for applying" OR "application received" OR "not selected" OR unfortunately OR interview OR assessment)',
  max_results => 50
);
```

Then it fetches each message:

```sql
SELECT id, snippet, internalDate, payload
FROM gmail.message(id => 'message_id');
```

The agent infers:

- company name
- job title
- date
- source platform
- status

Status inference:

- `APPLIED`: acknowledgement/application received emails
- `INTERVIEW`: interview, next steps, online assessment, coding challenge
- `OFFER`: offer/congratulations signals
- `REJECTED`: unfortunately, not selected, regret, unable to proceed

## App Pages

Dashboard:

- Search and filter all applications
- See status, platform, resume, JD, and requirements

First Mate:

- Personal agent briefing
- Follow-ups
- Missing resume/JD/requirements
- Duplicate applications
- Resume usage
- Coral SQL story

Auto Track:

- Preview Gmail-inferred applications
- See daily applied/interview/offer/rejected counts
- Import inferred jobs automatically

Add Application:

- Manual fallback
- Paste a job post and prefill company, title, location, salary, JD, requirements

Resumes:

- Add resume versions
- Store links and descriptions

Sources:

- Shows live Coral source status
- Shows setup commands for Gmail, GitHub, Google Calendar, Notion, Slack

Coral SQL:

- Runs SQL through Coral CLI
- Demonstrates cross-source query layer

## Demo Script for Judges

1. Start backend and frontend.
2. Register a new account.
3. Open Sources and show Coral source status.
4. Connect Gmail with the custom source spec.
5. Open Auto Track.
6. Click Preview.
7. Show inferred jobs from Gmail acknowledgement/status emails.
8. Click Import inferred jobs.
9. Open Dashboard to show imported application records.
10. Open First Mate to show the agent briefing.
11. Open Coral SQL and run a source query.

## Cross-Source Query Examples

Gmail job emails:

```sql
SELECT id
FROM gmail.search_messages(
  q => 'newer_than:30d ("application received" OR "thank you for applying" OR interview OR unfortunately)',
  max_results => 20
);
```

Applications + Calendar:

```sql
SELECT j.company_name, j.job_title, e.summary, e.start_date_time
FROM job_applications j
LEFT JOIN google_calendar.events e
  ON LOWER(e.summary) LIKE '%' || LOWER(j.company_name) || '%';
```

Applications + Notion:

```sql
SELECT j.company_name, j.job_title, n.title
FROM job_applications j
LEFT JOIN notion.pages n
  ON LOWER(n.title) LIKE '%' || LOWER(j.company_name) || '%';
```

Applications + GitHub proof:

```sql
SELECT j.company_name, j.job_title, g.title, g.state
FROM job_applications j
JOIN github.issues g
  ON LOWER(g.title) LIKE '%' || LOWER(j.job_title) || '%';
```

## Verification Commands

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Backend:

```powershell
cd backend
.\mvnw.cmd test
```

Coral:

```powershell
coral --version
coral source discover
coral source list
coral source lint .\coral-sources\gmail.yaml
```

## Current Limitations

- Gmail requires a real Google OAuth access token. The app cannot read Gmail until that token is configured.
- LinkedIn direct personal application history is not connected because LinkedIn does not expose a simple Coral source or public personal application API here.
- LinkedIn applications are tracked through Gmail acknowledgement/status emails, which is the reliable real-world signal.
- Google Calendar, Notion, GitHub, and Slack need user tokens before they can return real data.

## Why This Can Win

The project is not just a CRUD tracker. It demonstrates the hackathon theme:

- Coral turns personal workflow tools into SQL tables.
- A custom source spec extends Coral to Gmail.
- The agent uses cross-source data to produce useful actions.
- The workflow removes manual job tracking.
- The UX is built around the actual pain of high-volume job applications.

The result is a practical personal agent: every applicant gets a first mate that remembers the job hunt for them.
