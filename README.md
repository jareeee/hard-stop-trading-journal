# Hard Stop Trading Journal

A modern trading journal built with Ruby on Rails and React.

## Stack
- **Backend**: Rails 8 (API mode)
- **Frontend**: React (Vite + TypeScript)
- **Database**: PostgreSQL
- **Background Jobs**: Sidekiq
- **Caching**: Redis
- **Auth**: Devise + JWT

## Getting Started

### Prerequisites
Make sure you have the following installed:
- Ruby 3.2.x+
- Node.js & npm
- PostgreSQL
- Redis

### Initial Setup
1. Install dependencies:
   ```bash
   bundle install
   cd client && npm install && cd ..
   ```
2. Setup the database:
   ```bash
   rails db:create db:migrate
   ```

## Running the Application

I have prepared a single command to start the Rails API, the React frontend, and the Sidekiq worker simultaneously:

```bash
./bin/dev
```

- **Rails API**: http://localhost:3000
- **React Frontend**: http://localhost:5173
- **Sidekiq Dashboard**: http://localhost:3000/sidekiq (Pending route configuration)
