# Data Ghost Web

A Next.js application with Tailwind CSS, ShadCN UI, and React Query.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS framework
- **ShadCN UI** - Re-usable components built with Radix UI and Tailwind CSS
- **React Query (TanStack Query)** - Powerful data synchronization for React

## Adding ShadCN Components

To add components from ShadCN UI:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

## Project Structure

```
├── app/                  # Next.js app directory
│   ├── layout.tsx       # Root layout with providers
│   ├── page.tsx         # Home page
│   ├── globals.css      # Global styles with Tailwind
│   └── providers.tsx    # React Query provider
├── components/          # React components
│   └── ui/             # ShadCN UI components
├── lib/                # Utility functions
│   └── utils.ts        # cn() helper for class merging
└── public/             # Static files
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
