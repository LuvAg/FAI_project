```
 ██████╗███████╗██████╗     ██╗   ██╗██╗███████╗██╗   ██╗ █████╗ ██╗     ██╗███████╗███████╗██████╗ 
██╔════╝██╔════╝██╔══██╗    ██║   ██║██║██╔════╝██║   ██║██╔══██╗██║     ██║╚══███╔╝██╔════╝██╔══██╗
██║     ███████╗██████╔╝    ██║   ██║██║███████╗██║   ██║███████║██║     ██║  ███╔╝ █████╗  ██████╔╝
██║     ╚════██║██╔═══╝     ╚██╗ ██╔╝██║╚════██║██║   ██║██╔══██║██║     ██║ ███╔╝  ██╔══╝  ██╔══██╗
╚██████╗███████║██║          ╚████╔╝ ██║███████║╚██████╔╝██║  ██║███████╗██║███████╗███████╗██║  ██║
 ╚═════╝╚══════╝╚═╝           ╚═══╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
```

# 🧩 Interactive CSP Solver Visualization Tool

> **VisuAlgo/AI-Space style educational platform for learning constraint satisfaction algorithms**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Complete](https://img.shields.io/badge/Status-Complete-success.svg)](CHECKLIST.md)
[![Version: 1.0.0](https://img.shields.io/badge/Version-1.0.0-blue.svg)](package.json)

---

## 🚀 Quick Links

| Document | Description |
|----------|-------------|
| **[📖 README](README.md)** | Complete documentation and API reference |
| **[⚡ QUICKSTART](QUICKSTART.md)** | Get started in 30 seconds |
| **[🧮 ALGORITHMS](ALGORITHMS.md)** | Deep dive into CSP algorithms (AC-3, FC, BT) |
| **[🎓 TEACHING](TEACHING.md)** | Lesson plans and classroom activities |
| **[✅ CHECKLIST](CHECKLIST.md)** | Feature completion verification |
| **[📊 PROJECT_SUMMARY](PROJECT_SUMMARY.md)** | Comprehensive project overview |

---

## ⚡ 30-Second Start

```powershell
# No installation needed!
start index.html
```

That's it! The app opens in your browser. No server, no build, no dependencies required.

---

## 🎯 What Does It Do?

Watch constraint satisfaction algorithms solve puzzles **step by step**:

1. **Select a problem**: Map coloring, N-Queens, Sudoku, or custom
2. **Choose an algorithm**: Backtracking, Forward Checking, or AC-3
3. **Pick heuristics**: MRV (variable ordering), LCV (value ordering)
4. **Control execution**: Play, Pause, Step Forward, Step Backward
5. **Explore tabs**: State, Inspector, Trace

### Visual Features
- 🎨 Real-time domain changes
- 🔗 Constraint propagation visualization  
- 📊 Assignment stack tracking
- 🔍 Variable inspector with constraints
- ⏱️ Event timeline with jump-to capability
- 🎬 Smooth animations

---

## 📂 Project Structure

```
e:/FAI_project/
│
├─── 📄 index.html           ← Main app (open this!)
├─── 🌐 landing.html         ← Landing page with docs
│
├─── 📁 js/
│    ├── csp.js              ← CSP engine (Variable, Constraint, CSP, solvers)
│    ├── ui.js               ← UI logic and event handlers
│    └── puzzleLoader.js     ← JSON puzzle loader
│
├─── 📁 css/
│    └── styles.css          ← All styling (dark theme, animations)
│
├─── 📁 puzzles/
│    ├── australia.json      ← Map coloring (7 vars, 3 colors)
│    ├── 4queens.json        ← 4-Queens problem
│    └── sudoku4x4.json      ← 4x4 Sudoku puzzle
│
├─── 📁 tests/
│    ├── csp.test.js         ← Core CSP tests (20+ cases)
│    ├── puzzleLoader.test.js
│    └── examples.test.js
│
├─── 📁 Documentation/
│    ├── README.md           ← Main docs
│    ├── QUICKSTART.md       ← Setup guide
│    ├── ALGORITHMS.md       ← Algorithm theory
│    ├── TEACHING.md         ← Educator guide
│    ├── PROJECT_SUMMARY.md  ← Complete overview
│    └── CHECKLIST.md        ← Feature verification
│
└─── ⚙️ Config files (package.json, vite.config.js, etc.)
```

---

## 🛠️ Development Commands

```powershell
npm install          # Install dependencies (first time)
npm run dev          # Start dev server → localhost:3000
npm run build        # Build for production → dist/
npm run preview      # Preview production build
npm test             # Run all tests (need: npm i -D jsdom)
npm run lint         # Lint JavaScript files
```

---

## 🎓 For Students & Educators

### Perfect for Teaching
- **CS/AI Courses**: Constraint satisfaction unit
- **Algorithms**: Search and heuristics
- **Visual Learning**: See algorithms in action
- **Hands-on**: Create custom puzzles

### Classroom Ready
- ✅ No installation required
- ✅ Works offline
- ✅ Comprehensive teaching guide ([TEACHING.md](TEACHING.md))
- ✅ Lesson plans included
- ✅ Assessment ideas provided

---

## 🧪 Algorithms Implemented

| Algorithm | Description | Use Case |
|-----------|-------------|----------|
| **Backtracking** | Basic depth-first search | Simple problems, educational |
| **Forward Checking (FC)** | Prune neighbors after assignment | Medium problems |
| **AC-3** | Arc consistency propagation | Tight constraints, Sudoku |

### Heuristics
- **MRV** (Minimum Remaining Values): Choose most constrained variable
- **LCV** (Least Constraining Value): Try least restrictive value first

### Performance Example (4-Queens)
- Backtracking: ~32 assignments
- BT + FC: ~16 assignments  
- BT + AC-3 + MRV: ~8 assignments ⚡

---

## 📦 Example Puzzles

### 1. Australia Map Coloring 🗺️
- **Variables**: 7 regions (WA, NT, SA, Q, NSW, V, T)
- **Domain**: 3 colors (red, green, blue)
- **Constraints**: Adjacent regions ≠ same color

### 2. 4-Queens Problem ♛
- **Variables**: 4 queens (Q0, Q1, Q2, Q3)
- **Domain**: 4 rows (0, 1, 2, 3)
- **Constraints**: No two queens attack each other

### 3. 4x4 Sudoku 🔢
- **Variables**: 16 cells (A1-D4)
- **Domain**: Numbers 1-4
- **Constraints**: Unique in row, column, 2x2 box

### Create Your Own!
```json
{
  "name": "My Puzzle",
  "variables": [{"name": "X", "domain": [1,2,3]}],
  "constraints": [{"xi": "X", "xj": "Y", "type": "neq"}]
}
```

---

## 🎨 UI Features

### Main Controls
- **Problem**: Australia, 4-Queens, Sudoku, Simple CSP
- **Algorithm**: BT, BT+FC, BT+AC-3
- **Heuristics**: MRV/Sequential, LCV/Sequential
- **Playback**: Run, Step, Step Back, Pause, Reset
- **Speed**: 10ms - 1000ms adjustable

### Three Tabs
1. **State** 📊
   - Current domains
   - Propagation queue
   - Assignment stack

2. **Inspector** 🔍
   - Select any variable
   - View domain, neighbors, constraints

3. **Trace** 📜
   - Full event history
   - Timeline visualization
   - Jump to any event

---

## 🚀 Deployment

### Option 1: GitHub Pages (Automated)
```powershell
git push  # GitHub Actions auto-deploys!
```

### Option 2: Vercel (One Command)
```powershell
vercel --prod
```

### Option 3: Static Host
```powershell
npm run build
# Upload dist/ folder to any host
```

**Deployment files included**:
- `.github/workflows/deploy.yml` (GitHub Actions)
- `vercel.json` (Vercel config)

---

## 🧪 Testing

### Run Tests
```powershell
npm install -D jsdom  # One-time setup
npm test              # Run all tests
```

### Coverage
- ✅ 20+ unit tests
- ✅ Core CSP logic
- ✅ Algorithm correctness
- ✅ Puzzle loading
- ✅ Example puzzles

**Test files**: `tests/csp.test.js`, `tests/puzzleLoader.test.js`, `tests/examples.test.js`

---

## 📚 Documentation Tour

| File | Lines | Purpose |
|------|-------|---------|
| **README.md** | 300+ | Complete documentation |
| **QUICKSTART.md** | 150+ | Setup and first steps |
| **ALGORITHMS.md** | 400+ | Algorithm theory & analysis |
| **TEACHING.md** | 500+ | Lesson plans & activities |
| **PROJECT_SUMMARY.md** | 350+ | Project overview |
| **CHECKLIST.md** | 400+ | Feature verification |

**Total documentation**: 2000+ lines!

---

## 🎯 Key Features

### Core Functionality ✓
- [x] Backtracking, Forward Checking, AC-3 algorithms
- [x] MRV and LCV heuristics
- [x] Step-by-step execution with visualization
- [x] Step forward and backward (replay)
- [x] Event timeline with jump-to-event
- [x] Variable inspector
- [x] Real-time domain updates

### UI/UX ✓
- [x] Beautiful dark theme with animations
- [x] Tabbed interface (State, Inspector, Trace)
- [x] SVG visualization with highlighting
- [x] Play/Pause/Step controls
- [x] Speed slider
- [x] Responsive design

### Developer Experience ✓
- [x] Modern build tooling (Vite)
- [x] Unit testing (Vitest)
- [x] Code linting (ESLint)
- [x] JSON puzzle format
- [x] Modular architecture
- [x] Comprehensive docs

### Deployment ✓
- [x] GitHub Pages ready
- [x] Vercel ready
- [x] Production build optimized
- [x] No server required

---

## 📊 Stats

- **Total Files**: 25+
- **Lines of Code**: 1500+
- **Test Cases**: 20+
- **Documentation**: 2000+ lines
- **Example Puzzles**: 3 (+ generator functions)
- **Algorithms**: 3
- **Heuristics**: 2
- **Dependencies**: 4 (dev only)
- **Bundle Size**: < 50KB
- **Load Time**: < 100ms

---

## 🏆 What Makes This Special?

### 1. **Educational Value** 🎓
- Step-by-step visualization
- Compare algorithm performance
- Understand heuristics
- Learn by doing

### 2. **Production Quality** 💎
- Modern tooling
- Comprehensive tests
- Clean, documented code
- Deployment ready

### 3. **Zero Dependencies** 🚀
- Vanilla JavaScript
- No frameworks
- No build required to run
- Works offline

### 4. **Extensible** 🔧
- JSON puzzle format
- Event system
- Modular design
- Easy to customize

---

## 🤝 Contributing

Want to add features? Create puzzles? Improve docs?

1. Fork the repo
2. Make your changes
3. Submit a pull request

**Ideas welcome**:
- New algorithms (MAC, backjumping, etc.)
- More puzzle examples
- UI improvements
- Additional visualizations

---

## 📜 License

**MIT License** - Free to use for education and beyond!

---

## 🙏 Acknowledgments

**Inspired by**:
- [VisuAlgo](https://visualgo.net) — Algorithm visualization platform
- [AI-Space](http://aispace.org) — AI education tools
- Russell & Norvig's "AI: A Modern Approach"

---

## 💡 Quick Tips

### For Users
- Start with "Simple CSP" to learn basics
- Use "Australia Map" for classic demo
- Try different heuristics and compare

### For Teachers
- See [TEACHING.md](TEACHING.md) for lesson plans
- Create custom puzzles for assignments
- Use step control for demonstrations

### For Developers
- Code is modular and well-documented
- Tests show usage examples
- Add new puzzles via JSON

---

## 🎉 Ready to Start?

```powershell
# Instant start (no setup)
start index.html

# Or with dev server
npm install
npm run dev
```

**Open `landing.html` for the full guide!**

---

<div align="center">

**Made with ❤️ for learning AI algorithms**

[📖 Docs](README.md) • [⚡ Quick Start](QUICKSTART.md) • [🧮 Algorithms](ALGORITHMS.md) • [🎓 Teaching](TEACHING.md)

</div>
