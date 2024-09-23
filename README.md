# walltashi

## Getting Started

### Backend

Ask someone on the team for a copy of the `.env` file for local development.

Install the <a href="https://supabase.com/docs/guides/cli/getting-started?queryGroups=platform&platform=macos#installing-the-supabase-cli" target="_blank">Supabase CLI</a> and run `supabase login`.

Move into the backend directory and start your local supabase services:

```zsh
cd backend && make db-start
```

Reset the database and apply migrations:

```zsh
make db-reset
```

Run the backend server:

```zsh
make run
```

To stop the local supabase services:

```zsh
make db-stop
```

## Frontend

Install `biomejs` globally:

```zsh
npm install -g @biomejs/biome
```

Move into the frontend directory and install packages

```zsh
cd frontend && pnpm install
```

Start the react application:

```zsh
pnpm dev
```
