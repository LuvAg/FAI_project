# CSP Visualizer - Quick Start Guide

## Instant Start (No Installation)

Simply open `index.html` in your browser:
- Double-click `index.html` in Windows Explorer
- Or right-click → "Open with" → choose your browser

The app works without a web server!

## Development Mode (Recommended)

If you want hot-reload and a dev server:

```powershell
# 1. Install dependencies (first time only)
npm install

# 2. Start dev server
npm run dev

# Opens at http://localhost:3000
```

## Project Commands

```powershell
npm run dev      # Start development server
npm run build    # Build for production (outputs to dist/)
npm run preview  # Preview production build
npm test         # Run tests (requires jsdom: npm i -D jsdom)
npm run lint     # Lint JavaScript files
```

## What to Explore

1. **Main App** (`index.html`)
   - Select problems: Australia Map, 4-Queens, Sudoku
   - Try algorithms: Backtracking, Forward Checking, AC-3
   - Use heuristics: MRV, LCV
   - Control: Play/Pause/Step/Step Back
   - Tabs: State, Inspector, Trace

2. **Landing Page** (`landing.html`)
   - Documentation and feature overview
   - Algorithm explanations
   - How to create custom puzzles

3. **Example Puzzles** (`puzzles/`)
   - `australia.json` - Map coloring
   - `4queens.json` - N-Queens problem
   - `sudoku4x4.json` - 4x4 Sudoku

## Create Custom Puzzles

Add JSON files to `puzzles/` directory:

```json
{
  "name": "My Puzzle",
  "type": "graph",
  "description": "...",
  "variables": [
    {"name": "X", "domain": [1,2,3], "position": {"x": 100, "y": 200}}
  ],
  "constraints": [
    {"xi": "X", "xj": "Y", "type": "neq", "label": "≠"}
  ]
}
```

Then update `js/ui.js` to add it to the dropdown!

## Troubleshooting

**PowerShell script errors?**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

**Tests fail?**
```powershell
npm install -D jsdom
npm test -- --run
```

**Port 3000 busy?**
Edit `vite.config.js` and change the port number.

## Deployment

### GitHub Pages
1. Push to GitHub
2. Enable GitHub Pages in repo settings
3. Use GitHub Actions workflow (`.github/workflows/deploy.yml`)

### Vercel
```powershell
npm install -g vercel
vercel --prod
```

### Netlify
```powershell
npm run build
netlify deploy --prod --dir=dist
```

Or just upload the `dist/` folder!

---

Enjoy exploring CSP algorithms! 🧩
