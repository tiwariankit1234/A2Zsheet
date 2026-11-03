# A2Z Tracker — full-stack A2Z DSA Sheet

A personal tracker for every problem on Striver's A2Z DSA sheet: step-by-step accordions, LeetCode and GeeksforGeeks links, solved checkboxes, bookmarks, notes, search and filters. Progress is stored in MongoDB.

- **Frontend:** React 18 + Vite, Tailwind CSS v4, React Router, Axios, Lucide icons (`client/`)
- **Backend:** Node.js + Express REST API, MongoDB with Mongoose, JWT auth, bcrypt hashing (`server/`)
- **Data:** 452 problems across 20 steps, in the reference sheet's order (`server/src/data/a2zSheet.json`)

> This is an independent study tool. It isn't affiliated with takeUforward, LeetCode or GeeksforGeeks. It stores problem titles, ordering and links only, with no editorial or article content.

---

## 1. Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18.18 or newer (20 LTS or 22 LTS recommended) |
| npm | comes with Node |
| MongoDB | 6.0+ running locally, **or** a free MongoDB Atlas cluster |

### MongoDB setup (pick one)

**A. Local MongoDB on Windows**
1. Install *MongoDB Community Server* from <https://www.mongodb.com/try/download/community> and keep "Install MongoDB as a Service" ticked.
2. It then runs automatically at `mongodb://127.0.0.1:27017`. Nothing else is needed. The database `a2z_sheet` is created on first start.

**B. MongoDB Atlas (cloud, free tier)**
1. Create a free cluster at <https://www.mongodb.com/atlas>, add a database user, and allow your IP under *Network Access*.
2. Copy the connection string (`mongodb+srv://…`) into `MONGODB_URI` in `server/.env`, ending the path with `/a2z_sheet`.

**C. Docker**
```bash
docker run -d --name a2z-mongo -p 27017:27017 mongo:7
```

---

## 2. Install

From the project folder (`Striver_Sheet`):

```bash
npm run install:all
```

(Same as `npm install` inside `server/` and inside `client/`.)

## 3. Configure

```powershell
# Windows PowerShell
Copy-Item server\.env.example server\.env
```
```bash
# macOS / Linux / Git Bash
cp server/.env.example server/.env
```

Open `server/.env` and set:

- `MONGODB_URI`: leave the default for a local MongoDB, or paste your Atlas string.
- `JWT_SECRET`: any long random string. Generate one with
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

The client needs no `.env` for local development (see `client/.env.example` for deployment options).

## 4. Seed the problem data

The server seeds automatically on first start when the collection is empty (`AUTO_SEED=true`). To seed or refresh by hand:

```bash
npm run seed            # validates the dataset, then upserts topics + problems (user progress is never touched)
npm run validate:data   # data checks only: duplicates, missing fields, malformed/unverified URLs, counts
```

## 5. Run

Use two terminals:

```bash
npm run dev:server   # API on http://localhost:5000/api
npm run dev:client   # app on http://localhost:5173  (Vite proxies /api to the server)
```

Open **http://localhost:5173**.

Production build of the client: `npm run build` (output in `client/dist/`).

## 6. Tests

```bash
npm test
```

This runs 19 API integration tests (`server/tests/api.test.js`) against `TEST_MONGODB_URI`, which defaults to `mongodb://127.0.0.1:27017/a2z_sheet_test`. **That test database is dropped at the start and end of the run**, so never point it at your real database.

`tools/e2e-smoke.mjs` is an optional browser smoke test (Playwright) for the running app. Setup instructions are at the top of the file.

---

## Features

- **Dashboard:** total / solved / remaining / completion %, an overall progress bar, and solved counts per level.
- **Sheet:** 20 steps as collapsible accordions, each with subtopic groups and per-step and per-subtopic progress. Expand all / collapse all. Open sections are remembered.
- **Problem rows:** number, name, level (Basic / Core / Pro, from the reference sheet), LeetCode link (with LeetCode's Easy/Medium/Hard and a lock for Premium), GFG link, solved checkbox, bookmark star, and a notes editor (up to 2000 characters). If a platform has no verified match, the row shows **Not available**.
- **Search and filters:** search by name, plus filters for topic, level, status (solved / unsolved / bookmarked) and platform (has LeetCode / GFG / both / any / none). Sort by sheet order, level or name. Filters are kept in the URL, so a filtered view survives refresh and can be shared.
- **Accounts:** every visitor gets a guest session automatically, and its progress is saved in MongoDB straight away. *Create account* upgrades that guest in place, keeping all progress. *Sign in* on a new browser merges that browser's guest progress into the account.
- **Persistence:** solved state, bookmarks and notes live in MongoDB and survive refreshes and other devices. Updates are optimistic and roll back with an error message if the API call fails.
- **UX:** light/dark theme toggle (follows the system by default), responsive layout from 375 px phones up, loading spinners, empty states, an API-down screen with retry, and toast messages.
- **About page** (`/about`): developer profile, projects, skills and education.
- **Data notes page** (`/data-notes`, linked from the About page): where the data comes from, coverage counts, and the list of links that could not be verified.

## REST API

All responses are JSON. Errors look like `{ "error": { "message": "...", "details"?: [...] } }`. A protected route takes the header `Authorization: Bearer <token>`.

| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/health` | – | Server + DB status, problem count |
| `GET /api/meta` | – | Dataset info, unverified links, excluded lessons |
| `GET /api/topics` | – | 20 steps with subtopics and problem counts |
| `GET /api/problems` | optional | List problems. Query: `q, step, topic, difficulty (Basic\|Core\|Pro\|Unrated), platform (leetcode\|gfg\|both\|any\|none), status (all\|solved\|unsolved\|bookmarked — needs auth), sort (order\|title\|difficulty), order (asc\|desc), page, limit (1–500, default 50)` |
| `GET /api/problems/search?q=` | optional | Name search (same filters and pagination) |
| `GET /api/problems/:id` | optional | One problem (`id` like `a2z-37`), plus your state when signed in |
| `GET /api/progress` | required | Summary (totals, per topic, per level) + your per-problem state |
| `PUT /api/progress/:problemId` | required | Body `{ "solved"?: boolean, "notes"?: string }` |
| `GET /api/bookmarks` | required | Your bookmarked problems, newest first |
| `PUT /api/bookmarks/:problemId` | required | Body `{ "bookmarked": boolean }` |
| `POST /api/auth/guest` | – | Start a guest session → `{ token, user }` |
| `POST /api/auth/register` | optional | `{ email, password (8–128), name? }`. Upgrades the calling guest |
| `POST /api/auth/login` | optional | `{ email, password }`. Merges the calling guest's progress |
| `GET /api/auth/me` | required | Current user |

Status codes used: 200, 201, 400 (validation / malformed JSON), 401, 404, 409 (email taken), 503 (DB down), 500.

## Project structure

```
Striver_Sheet/
├── client/                    React app
│   └── src/
│       ├── components/        Navbar, StatsDashboard, FilterBar, TopicAccordion, ProblemRow, NotesDialog, ui
│       ├── context/           AuthContext (sessions), SheetContext (data + optimistic progress), ToastContext
│       ├── hooks/             useProblemQuery (server-side filtering), useTheme, useDebounce
│       ├── pages/             SheetPage, BookmarksPage, AccountPage, AboutPage
│       ├── services/api.js    Axios client + error normalisation
│       ├── styles/index.css   Tailwind v4 theme + component utilities
│       └── utils/
├── server/
│   ├── src/
│   │   ├── config/            env loading, MongoDB connection
│   │   ├── controllers/       sheet, progress, auth
│   │   ├── middleware/        auth (JWT), central error handler
│   │   ├── models/            Problem, Topic, User, UserProblem (solved/bookmark/notes per user+problem)
│   │   ├── routes/            /api router
│   │   ├── services/          data (seed), problems (query/filter/sort), progress, auth (guest upgrade/merge)
│   │   ├── scripts/           seed.js, validateData.js
│   │   ├── data/              a2zSheet.json, verificationReport.json
│   │   └── utils/             ApiError, validators, asyncHandler
│   └── tests/api.test.js
├── tools/                     dataset build script + reference snapshot, browser smoke test
└── docs/LINK_COVERAGE.md      every problem without links, unverified links, Premium links
```

## About the data

- **Source:** the reference sheet at `takeuforward.org/prep-hub/strivers-a2z-dsa-sheet`, read on 2026-10-20. It currently lists 495 entries in 20 modules. 43 of those are lessons or articles (theory videos, "Learn C++", and so on). They aren't problems, so they're excluded, leaving **452 problems**.
- **Levels:** the reference sheet labels problems *Basic / Core / Pro* (not Easy/Medium/Hard), and that's what the app shows. Four problems have no level there and show as *Unrated*. For LeetCode links, LeetCode's own difficulty is shown as well.
- **LeetCode (288 problems):** the link listed by the reference sheet, with its slug confirmed in LeetCode's catalog.
- **GFG (143 problems):** the reference sheet has no GFG links. Matches came from GFG's practice catalog, by exact title or by a close match checked by hand. Every URL was confirmed to resolve.
- **No external link (116 problems):** mostly problems that exist only on the reference site's own judge (patterns, linked-list basics and similar). They show *Not available*. No URLs were generated from titles.
- See **`docs/LINK_COVERAGE.md`** for the full lists, and `tools/build_dataset.py` for how the JSON is produced.

## Troubleshooting

- **"Cannot connect to the API"** in the app: the server isn't running, or it can't reach MongoDB. Check the `npm run dev:server` terminal.
- **`Could not reach MongoDB at …`** on server start: start the MongoDB service (`services.msc` → *MongoDB Server*) or fix `MONGODB_URI`.
- **Port in use:** change `PORT` in `server/.env`. If you do, also start the client with `VITE_PROXY_TARGET=http://localhost:<port>`.
- **Why bcryptjs?** It's the pure-JavaScript build of bcrypt: same algorithm and hash format, but no native compiler needed on Windows.
