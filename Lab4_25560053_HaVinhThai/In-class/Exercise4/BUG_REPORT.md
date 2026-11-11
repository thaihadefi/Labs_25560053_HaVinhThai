# Exercise 4 – Bug Report (Task Manager API)

All fixes are in `be/server.js`; the frontend (`fe/`) is unchanged.
The UI is opened from `http://127.0.0.1:5500` and the API runs on `http://localhost:5002`.

| # | Symptom in the UI | Evidence in DevTools / terminal | Root cause | Fix |
|---|---|---|---|---|
| 1 | Page shows "Cannot reach the API. Open DevTools…" and the stats stay at "–". | Console: `Access to fetch at 'http://localhost:5002/api/tasks' from origin 'http://127.0.0.1:5500' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value 'http://localhost:3000' that is not equal to the supplied origin`. Network: `GET /api/tasks` and `/stats` are red with `net::ERR_FAILED`; the response headers show `Access-Control-Allow-Origin: http://localhost:3000`. (The UI sends `Content-Type: application/json` on every request, so even the GETs are preflighted.) | `cors({ origin: 'http://localhost:3000' })` only allows a React dev server origin, not the Live Server origin the UI really uses. | Allow the UI's origin: `origin: ['http://127.0.0.1:5500', 'http://localhost:5500']`. |
| 2 | After fixing #1, ticking a checkbox, Edit and Delete all fail with "Cannot reach the API". | Network: the `OPTIONS` preflight for `PUT`/`DELETE` returns `Access-Control-Allow-Methods: GET,POST`; Console: `Method PUT is not allowed by Access-Control-Allow-Methods in preflight response`. | `methods: ['GET', 'POST']` leaves out `PUT` and `DELETE`, so the browser never sends the real request. | `methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']` (and `allowedHeaders: ['Content-Type']` for the JSON body). |
| 3 | Adding a task shows "Request failed with status 500". | Network: `POST /api/tasks` → `500`, Response is an HTML error page. Terminal: `TypeError: Cannot destructure property 'title' of 'req.body' as it is undefined.` | `app.use(express.json())` is missing, so the JSON body is never parsed and `req.body` is `undefined` (Express 5). | Register `app.use(express.json())` before the routes. |
| 4 | The list loads but every task title is blank. | Network → `GET /api/tasks` → Preview: each task has `name: "…"` instead of `title`. | `toDto` maps the title to a field called `name`; the contract (and the UI) use `title`. | Return `title: task.title` in `toDto`. |
| 5 | Clicking the **Done** filter shows "Loading..." forever. | Network: `GET /api/tasks?status=done` stays `(pending)` and never gets a status. Terminal prints `Found 1 completed task(s)` so the handler did run. | The `status === 'done'` branch computes the list but never sends a response, and it is not `all`, so no `res.json` is called at all. | `return res.json({ success: true, data: doneTasks.map(toDto) })`; unknown status values now fall through to "all tasks" so no request can hang. |
| 6 | Stats cards show Active = 1 and Done = 3, while the list shows 3 active tasks and 1 done task. | Network → `GET /api/tasks/stats` → Preview: `{ total: 4, active: 1, done: 3 }`. | The two filters are swapped: `done` counts `!t.done` and `active` counts `t.done`. | `done = tasks.filter(t => t.done)`, `active = tasks.filter(t => !t.done)`. |
| 7 | Adding a blank task (e.g. only spaces) shows "Title is required", yet a task with an empty title appears in the list and the counters go up. | Network: `POST /api/tasks` → `400`, but the next `GET /api/tasks` contains a new task with `title: ""`. Terminal: `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client` (blank title) or `TypeError: Cannot read properties of undefined (reading 'trim')` (missing title). | The 400 branch calls `res.status(400).json(...)` without `return`, so the handler keeps running after the response: it creates the task and tries to send a second (201) response. | `return res.status(400).json(...)`, and check that `title` is a non-blank string before calling `.trim()`. |
| 8 | Editing a task or ticking its checkbox always shows "Task not found". | Network: `PUT /api/tasks/2` → `404 { message: "Task not found" }` although task #2 is in the list. | `req.params.id` is a string (`"2"`) and is compared with `===` to a number id, so `find` never matches. | Convert first: `const id = Number(req.params.id)`. |
| 9 | A completed task cannot be unticked: after unchecking, it comes back checked. Clearing the title in Edit silently keeps the old one. | Network: `PUT` payload `{ "done": false }`, Response still has `done: true`. | `task.done = req.body.done \|\| task.done` – `false \|\| true` is `true`, so `false` can never be saved (same `\|\|` problem for an empty title). | Update only the fields that were sent: `if (done !== undefined) task.done = Boolean(done)`; a blank `title` returns `400`. |
| 10 | Deleting a task removes a **different** task (e.g. deleting #2 removes #3; deleting the last task removes nothing). | Network: `DELETE /api/tasks/2` → `200 "Task deleted"`, but the next `GET` still contains task #2 and #3 is gone. | `tasks.splice(id, 1)` uses the task **id** as an array **index** (ids start at 1, indexes at 0, and they drift after deletions). | Find the index first: `const index = tasks.findIndex(t => t.id === id); tasks.splice(index, 1)`. |

## Verification after the fixes

Checked with requests sent from origin `http://127.0.0.1:5500`:

- The `OPTIONS` preflight for `PUT`/`DELETE` returns `Access-Control-Allow-Origin: http://127.0.0.1:5500` and `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`.
- `GET /api/tasks` returns `title`; `?status=done` answers immediately; `/stats` returns `{ total: 4, active: 3, done: 1 }`.
- A blank or missing title returns `400` and the stats total stays at 4 (nothing is created).
- `PUT /api/tasks/2` edits the task, and `{ "done": false }` unticks task #1.
- `DELETE /api/tasks/2` removes exactly task #2; an unknown id returns `404`.

## Screenshots after all fixes

UI served from `http://127.0.0.1:5500`, API on `http://localhost:5002`, captured in Chrome.
No CORS errors appear in the Console; the only failed request is the intentional `400` for a blank title.

| # | Scenario | Result | Fixes it shows |
|---|---|---|---|
| 1 | [Initial load](screenshots/01-initial-load.png) | 4 tasks with titles; stats 4 / 3 active / 1 done | 1, 4, 6 |
| 2 | [Add a task](screenshots/02-add-task.png) | "Task added.", total 5 | 3 |
| 3 | [Add a blank title](screenshots/03-blank-title-rejected.png) | "Title is required", total stays 5 | 7 |
| 4 | [Tick "Install Postman"](screenshots/04-tick-task-done.png) | Task done, stats 3 active / 2 done | 2, 8 |
| 5 | [Untick "Read the Express routing docs"](screenshots/05-untick-task.png) | Task active again, stats 4 / 1 | 9 |
| 6 | [Edit a title](screenshots/06-edit-task.png) | "Task updated.", title becomes "Finish Lab 4 exercise 4" | 8, 9 |
| 7 | [Filter: Done](screenshots/07-filter-done.png) | Only the done task, loads immediately | 5 |
| 8 | [Filter: Active](screenshots/08-filter-active.png) | Only the 4 active tasks | – |
| 9 | [Delete task #4](screenshots/09-delete-task.png) | "Task #4 deleted.", exactly #4 removed | 2, 10 |
