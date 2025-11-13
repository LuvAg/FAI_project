# CSP Visualizer

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An interactive, educational visualization tool for Constraint Satisfaction Problem (CSP) solving algorithms, inspired by **VisuAlgo** and **AI-Space**.

## 🎯 Features

- ✅ **Multiple Algorithms**: Backtracking, Forward Checking, AC-3
- ✅ **Smart Heuristics**: MRV (Minimum Remaining Values), LCV (Least Constraining Value)
- ✅ **Step-by-Step Control**: Play, Pause, Step Forward/Backward
- ✅ **Event Timeline**: Jump to any point in the execution history
- ✅ **Variable Inspector**: Examine domains, neighbors, and constraints
- ✅ **Example Puzzles**: Australia Map, 4-Queens, 4x4 Sudoku
- ✅ **JSON Puzzle Format**: Create and load custom problems
- ✅ **Real-time Visualization**: See constraint propagation and domain changes
- ✅ **Comprehensive Tests**: Unit and integration tests with Vitest

## 🚀 Quick Start

### Option 1: Open Directly (No Build Required)
```bash
# Just open index.html in your browser
open index.html  # macOS
start index.html # Windows
```

### Option 2: Development Server
```bash
npm install
npm run dev
```

The visualizer will open at `http://localhost:3000`

## 📚 Usage

1. **Select a Problem**: Choose from Map Coloring, 4-Queens, Sudoku, or Simple CSP
2. **Choose Algorithm**: Backtracking, BT + Forward Checking, or BT + AC-3
3. **Select Heuristics**: MRV for variable ordering, LCV for value ordering
4. **Control Execution**:
   - **Run** — Execute the algorithm with animation
   - **Step** — Advance one step at a time
   - **Step Back** — Go to previous state
   - **Pause** — Stop during execution
   - **Speed Slider** — Adjust animation speed

### Tabs

- **State**: Current domains, propagation queue, assignment stack
- **Inspector**: Detailed variable information (domains, neighbors, constraints)
- **Trace**: Event timeline with jump-to-event capability

## 🧩 Creating Custom Puzzles

Create a JSON file in the `puzzles/` directory:

```json
{
  "name": "My Puzzle",
  "type": "graph",
  "description": "A custom CSP problem",
  "variables": [
    {"name": "X", "domain": [1, 2, 3], "position": {"x": 100, "y": 200}},
    {"name": "Y", "domain": [1, 2, 3], "position": {"x": 300, "y": 200}}
  ],
  "constraints": [
    {"xi": "X", "xj": "Y", "type": "neq", "label": "≠"}
  ]
}
```

### Constraint Types

- `neq` — not equal (≠)
- `lt` — less than (<)
- `gt` — greater than (>)
- `lte` — less than or equal (≤)
- `gte` — greater than or equal (≥)
- `eq` — equal (=)
- `check` — custom JavaScript expression

## 🏗️ Project Structure

```
e:/FAI_project/
├── index.html              # Main visualizer UI
├── landing.html            # Landing page with documentation
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── css/
│   └── styles.css          # All styles
├── js/
│   ├── csp.js              # CSP engine (Variable, Constraint, CSP, solvers)
│   ├── ui.js               # UI logic and event handlers
│   └── puzzleLoader.js     # JSON puzzle loader
├── puzzles/
│   ├── australia.json      # Australia map coloring
│   ├── 4queens.json        # 4-Queens problem
│   └── sudoku4x4.json      # 4x4 Sudoku
└── tests/
    ├── csp.test.js         # Core CSP tests
    ├── puzzleLoader.test.js # Loader tests
    └── examples.test.js    # Example puzzle tests
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in watch mode
npm test -- --watch
```

## 🛠️ Development

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run tests
npm run lint     # Lint code
```

### Technologies

- **Vanilla JavaScript** (ES6 modules)
- **Vite** (build tool and dev server)
- **Vitest** (unit testing)
- **SVG** (visualization)
- **CSS3** (styling and animations)

## 📖 Algorithms

### Backtracking Search
Tries to assign values to variables one at a time, checking constraints after each assignment. Backtracks when a constraint is violated.

### Forward Checking (FC)
After each assignment, removes inconsistent values from unassigned neighbors' domains. Detects failures earlier than basic backtracking.

### AC-3 (Arc Consistency)
Enforces arc consistency by iteratively removing values that have no supporting values in neighboring domains. More powerful than Forward Checking.

### Heuristics

- **MRV (Minimum Remaining Values)**: Choose variable with fewest legal values
- **LCV (Least Constraining Value)**: Try value that rules out fewest choices for neighbors

## 🚀 Deployment

### GitHub Pages

```bash
npm run build
# Upload dist/ to GitHub Pages
```

### Vercel

```bash
vercel --prod
```

### Netlify

```bash
npm run build
netlify deploy --prod --dir=dist
```

## 📄 License

MIT License - feel free to use for learning and teaching!

## 🙏 Acknowledgments

Inspired by:
- [VisuAlgo](https://visualgo.net) — Algorithm visualization platform
- [AI-Space](http://aispace.org) — Interactive tools for learning AI
- Russell & Norvig's "Artificial Intelligence: A Modern Approach"

## 🤝 Contributing

Contributions welcome! Feel free to:
- Add new puzzle examples
- Implement additional algorithms (e.g., MAC, Conflict-Directed Backjumping)
- Improve visualizations
- Add more tests
- Fix bugs

---

Made with ❤️ for learning AI algorithms
