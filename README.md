# Sherlog 🔍

> Elementary, my dear developer

AI-powered log debugging: batch analysis, smart prioritization, actionable fixes. Built with Astro + shadcn/ui + Vercel AI SDK.

## ✨ Features

- **Batch Analysis** - Analyze multiple errors at once, not one-by-one
- **Smart Prioritization** - Automatically sorts by frequency and severity
- **AI-Powered Solutions** - Get specific fixes with exact file:line locations
- **Minimalist UI** - Clean, professional interface with detective-themed microcopy
- **Fast** - Results in ~20 seconds vs 90 seconds per error in ChatGPT

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛠️ Tech Stack

- **Framework:** [Astro 4.x](https://astro.build) - Static site generation with React Islands
- **UI Components:** [shadcn/ui](https://ui.shadcn.com) - Accessible, customizable components
- **Styling:** [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS
- **Fonts:** Space Grotesk, Inter, JetBrains Mono
- **AI:** Vercel AI SDK + OpenAI API
- **Deployment:** Vercel

## 📁 Project Structure

```
sherlog/
├── src/
│   ├── components/
│   │   └── ui/              # shadcn components
│   │       ├── simple-file-upload.tsx
│   │       ├── card.tsx
│   │       ├── button.tsx
│   │       └── badge.tsx
│   ├── layouts/
│   │   └── main.astro       # Base layout
│   ├── pages/
│   │   ├── main.astro       # Upload interface
│   │   └── api/
│   │       └── analyze.ts   # AI analysis endpoint (TODO)
│   ├── lib/
│   │   └── utils.ts         # Tailwind cn() helper
│   └── styles/
│       └── global.css       # Global styles
├── public/                  # Static assets
└── tailwind.config.mjs      # Tailwind configuration
```

## 🎨 Design Philosophy

**Minimalism with Purpose**
- One action per screen
- Maximum 3 colors (background + accent + status)
- Simple typography (400-500 for text, 600 for titles)
- Generous spacing (breathing room over density)
- Opacity-based colors for depth

**Detective Theme (Subtle)**
- Professional first, playful second
- Copy: "Drop your evidence", "Analyzing case..."
- No caricatures, no over-the-top theming
- Intelligence and precision over humor

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```bash
OPENAI_API_KEY=sk-...
```

### Fonts

Typography system uses:
- **Space Grotesk** - Display font for headings
- **Inter** - Body text and UI elements
- **JetBrains Mono** - Code and technical hints

Fonts are loaded via Fontsource for optimal performance.

## 🎯 MVP Scope

**Included:**
- ✅ File upload (drag & drop, .log/.txt, max 10MB)
- ✅ Smart log parser (auto-detect errors, warnings, info)
- ✅ Batch AI analysis (top 5 critical errors)
- ✅ Prioritization by frequency
- ✅ Clean results UI
- ✅ Copy actions for solutions

**Excluded (v2+):**
- ❌ Stack detection onboarding
- ❌ Error correlation engine
- ❌ Historical analysis memory
- ❌ Authentication/accounts
- ❌ CLI tool
- ❌ IDE extension

## 📝 API Routes (TODO)

### `POST /api/analyze`

Analyze uploaded log file and return prioritized errors with AI solutions.

**Request:**
```typescript
FormData {
  file: File  // .log or .txt file (max 10MB)
}
```

**Response:**
```typescript
{
  summary: {
    total: number
    errors: number
    warnings: number
  },
  topErrors: Array<{
    id: string
    type: 'error' | 'warning' | 'info'
    message: string
    location: string  // file:line
    occurrences: number
    analysis: string
    solution: string
  }>
}
```

## 🤝 Contributing

Contributions are welcome! This is an open-source project.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- Design inspiration: Claude, ChatGPT, Linear
- UI Components: [shadcn/ui](https://ui.shadcn.com)
- Framework: [Astro](https://astro.build)

---

Built with ❤️ by developers, for developers
