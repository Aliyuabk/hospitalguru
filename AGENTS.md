# Repository Guidelines

## Project Structure & Module Organization

- `frontend/app/` contains the Next.js App Router pages and global styles; `frontend/components/` holds shared UI; `frontend/lib/` contains API and offline-sync helpers; `frontend/public/` contains icons and static assets.
- `backend/routes/api.php` defines API routes. Controllers and middleware live under `backend/app/Http/`; Eloquent models and database migrations/seeders are under `backend/app/` and `backend/database/`.
- `electron/` contains the desktop main process and preload bridge. `README.md` describes product scope; `SETUP.md` covers local setup and Windows packaging.

## Build, Test, and Development Commands

Run commands from the indicated directory:

- `cd frontend; npm.cmd run dev` starts the Next.js development server.
- `cd frontend; npm.cmd run build` creates and type-checks a production frontend build.
- `cd frontend; npm.cmd run dist:win` builds the frontend and creates the Windows NSIS installer in `frontend/dist/`. Set `NEXT_PUBLIC_API_URL` before building.
- `cd backend; composer run dev` starts Laravel’s development API server. Use `php artisan migrate --seed` to prepare a development database.

## Coding Style & Naming Conventions

Use TypeScript/React for frontend features and PHP/Laravel conventions for API changes. Keep App Router paths lowercase, React components and types in PascalCase, variables/functions in camelCase, and PHP classes in PascalCase with PSR-4 namespaces. Match nearby formatting; frontend files currently use both compact JSX and standard multiline formatting. Use Lucide icons and the existing hospital-green design tokens for shared UI.

## Testing Guidelines

No repository-owned frontend or backend test suite is currently present. Before submitting, run `npm.cmd run build` for frontend changes and `php -l <file>` for changed PHP files. Add focused tests when introducing a test framework or when the change includes test infrastructure.

## Commit & Pull Request Guidelines

This checkout has no Git history available to establish existing commit conventions. Use concise imperative commit subjects, preferably with a scope such as `fix(auth): restrict staff access`. Pull requests should summarize behavior changes, list validation commands and results, link related issues, and include screenshots for visible UI changes.

## Security & Configuration

Never commit `.env`, credentials, tokens, or real patient data. Keep MySQL credentials in backend environment configuration. `NEXT_PUBLIC_API_URL` is embedded at frontend build time; rebuild the installer after changing it. Preserve API role checks even when hiding frontend navigation or actions.