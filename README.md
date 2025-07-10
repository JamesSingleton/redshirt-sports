# Redshirt Sports

## 🏈 About

Redshirt Sports is a modern college sports news website built with Next.js and powered by Sanity CMS. We provide comprehensive coverage, analysis, and breaking news from the world of college athletics. From football and basketball to emerging sports, we cover the stories that matter to college sports fans across the nation.

## 🛠️ Tech Stack

- **Monorepo**: [Turborepo](https://turborepo.com)
- **Framework**: [Next.js](https://nextjs.org)
- **Frontend**: [React](https://react.dev)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com)
- **CMS**: [Sanity](https://www.sanity.io)
- **Package Manager**: [pnpm](https://pnpm.io)
- **Deployment**: [Vercel](https://vercel.com/)

## 🚀 Getting Started

### Prerequisites

- Node.js (version 20 or higher)
- pnpm (version 10 or higher)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/jamessingleton/redshirt-sports.git
cd redshirt-sports
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

```bash
# Copy environment files for each workspace
cp apps/web/.env.example apps/web/.env.local

# Add your Sanity project configuration
# NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
# NEXT_PUBLIC_SANITY_DATASET=production
# SANITY_API_TOKEN=your_api_token
```

4. Run the development server:

```bash
pnpm dev
```

This will start all applications and packages in the monorepo.

## 🔧 Available Scripts

- `pnpm dev` - Runs all apps and packages in development mode
- `pnpm build` - Builds all apps and packages for production
- `pnpm lint` - Runs ESLint across all workspaces
- `pnpm check:types` - Runs type checks across all workspaces
- `pnpm check:format` - Runs prettier --check on all the files

## 📁 Project Structure

```
redshirt-sports/
├── apps/                   # Applications
│   ├── web/                # Main website (Next.js)
│   ├── studio/             # Sanity Studio
├── packages/               # Shared packages
│   ├── ui/                 # Shared UI components (ShadCN)
│   ├── eslint-config/      # Shared eslint configuration
│   └── typescript-config/  # TypeScript configurations
├── .env.example            # Environment variables example
├── .gitignore              # Git ignore file
├── package.json            # Root package.json
├── turbo.json              # Turborepo configuration
└── README.md               # This file
```

## 🤝 Contributing

We welcome contributions from the college sports community! Whether you're interested in:

- Adding new features for better sports coverage
- Improving the user interface and experience
- Fixing bugs or improving performance
- Contributing content or editorial improvements
- Enhancing SEO and accessibility

Please feel free to submit issues and pull requests.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes (ensure they work across the monorepo)
4. Run type checks and linting: `pnpm check:types && pnpm lint`
5. Commit your changes (`git commit -m 'featu: add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📄 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

### What this means

The AGPL-3.0 license ensures that:

- You can use, modify, and distribute this software
- Any modifications must be made available under the same license
- If you run a modified version on a server, you must make the source code available to users
- This includes web applications and services built with this code

For more information, see the [GNU AGPL-3.0 license](https://www.gnu.org/licenses/agpl-3.0.en.html).
