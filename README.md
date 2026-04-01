# Blue Ribbon Academy

A tutoring academy website built with React, TypeScript, Vite, and Tailwind CSS, powered by Lovable Cloud (Supabase) for backend services.

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A Supabase project (or Lovable Cloud)

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
```

> **Note:** Never commit `.env` files or API keys to the repository.

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>
cd blueribbonacademy

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Deployment

#### GitHub Pages
The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) for deploying to GitHub Pages. Add these secrets to your GitHub repository settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

#### Lovable
Open [Lovable](https://lovable.dev) and click Share → Publish.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS
- **UI Components:** shadcn/ui
- **Backend:** Supabase (Auth, Database, Edge Functions, Storage)
- **State Management:** TanStack React Query

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── admin/      # Admin dashboard components
│   ├── layout/     # Header, Footer, Layout
│   └── ui/         # shadcn/ui components
├── contexts/       # React context providers (Auth)
├── hooks/          # Custom React hooks
├── integrations/   # Supabase client & types (auto-generated)
├── pages/          # Route pages
└── lib/            # Utility functions
supabase/
├── functions/      # Edge Functions
└── config.toml     # Supabase configuration
```
