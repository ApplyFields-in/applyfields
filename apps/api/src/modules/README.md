# src/modules — one folder per feature

Create each module with the Nest CLI, e.g. `pnpm nest g module modules/auth` (run inside `apps/api`).

| Module | What it does | Owner | When |
|---|---|---|---|
| `auth` | Register, login, OTP, JWT tokens | Karthik | Week 1 |
| `users` / `profile` | Profile: gender, DOB, category, income, education, state | Karthik | Week 1–2 |
| `opportunities` | Jobs, exams, scholarships, admissions (one module, `type` field) | Likhith | Week 2 |
| `review` | Draft → review → publish, change history | Likhith | Week 2 |
| `updates` | Results, admit cards, answer keys | Likhith | Week 3 |
| `eligibility` | Eligible / not eligible / missing info | Harsha + Likhith | Week 4 |
| `saved` | Saved items + reminders | Likhith | Week 4 |
| `notifications` | In-app + email | Likhith | Week 5 |
| `search` | Universal search | Harsha | Week 6 |
| `documents` | My Documents | Likhith | Week 6 |
| `services` | Government services content | Likhith | Week 6 |
| `careers` | Careers, courses, colleges, roadmaps | Likhith | Week 7 |
