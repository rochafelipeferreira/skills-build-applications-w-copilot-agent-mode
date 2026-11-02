# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Keep each capability in its existing React component and use the shared API client for relative `/api` requests. Render loading, error, empty, and populated states accessibly; keep API and persistence logic out of components.
- Logic tier decision: Keep HTTP concerns in Express routes and business rules in the service layer. Validate request data and references before persistence, return deliberate 4xx responses for invalid or unknown resources, and do not add authentication.
- Data tier decision: Define required fields, defaults, and ObjectId references in the Mongoose models. Seed representative users, teams, activities, and workouts with idempotent upserts that preserve unrelated records and maintain consistent user/team membership.
- Activity tracking approach: Accept only `userId`, `teamId`, `type`, and positive `minutes`; validate both IDs and confirm the referenced records exist. Compute points on the server from minutes (one point per minute), set `occurredAt` on creation, and return the persisted activity from both create and list endpoints.
- Team management approach: Require a non-empty name, preserve the submitted name and mascot, validate member IDs against existing users, and store members as user references. Listing and creation return the same team fields and member IDs.
- Leaderboard approach: Aggregate activity points by team, include teams with no activities at zero, sort by total points descending, and assign ranks starting at 1 in the service layer.
- Workout suggestions approach: Find the user by decoded email; use the user's fitness goal as the preferred focus, falling back to their recent activity type when needed. Return matching workout records first with a short reason tied to the goal or activity, and return a deliberate 4xx for an unknown email.

Implement in dependency order: models and seed, service rules and routes, then presentation components. Run the corresponding focused test after each tier before moving to the next.

## Test plan

Run the focused checks in tier order. A failure identifies a broken contract in that tier; build failures additionally indicate a TypeScript or bundling problem.

- Data tier: `npm run test:data --prefix octofit-tracker/backend` checks model validation, references, and repeatable non-destructive seeding.
- Logic tier: `npm run test:api --prefix octofit-tracker/backend` checks HTTP status and response contracts, input/reference validation, point calculation, team membership, leaderboard aggregation/ranking, and personalized workout suggestions.
- Presentation tier: `npm test --prefix octofit-tracker/frontend` checks API integration and accessible loading, error, empty, and populated states for each capability.
- Backend build: `npm run build --prefix octofit-tracker/backend` checks TypeScript compilation.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` checks TypeScript compilation and the Vite production bundle.
- Exercise metadata and workflow validation: `node --test tests/exercise-validation.test.mjs` checks repository exercise structure and safety constraints; failures are separate from application-tier behavior.
