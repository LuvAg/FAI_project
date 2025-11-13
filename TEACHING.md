# Teaching Guide for CSP Visualizer

A guide for educators using the CSP Visualizer in classroom settings.

## Learning Objectives

By the end of using this tool, students should be able to:
1. Define constraint satisfaction problems and identify their components
2. Explain how backtracking search works
3. Understand the benefits of constraint propagation (FC and AC-3)
4. Compare the performance of different heuristics
5. Apply CSP techniques to real-world problems

---

## Suggested Lesson Plan (90 minutes)

### Part 1: Introduction (15 min)

**Activity**: Open `landing.html` and discuss:
- What is a CSP? Show examples from daily life:
  - Scheduling classes (variables = time slots, constraints = no conflicts)
  - Sudoku (variables = cells, constraints = uniqueness)
  - Map coloring (variables = regions, constraints = adjacent ≠ same color)

**Demo**: Load Australia map, show the problem setup without running.

### Part 2: Basic Backtracking (20 min)

**Activity**: 
1. Select "Australia Map" + "Backtracking" + "Sequential" heuristics
2. Click "Step" repeatedly, discussing each action:
   - How does it choose a variable?
   - How does it try values?
   - When does it backtrack?
3. Count the number of assignments tried

**Discussion Questions**:
- What happens when we assign WA=red, NT=red? (Conflict!)
- Why does it explore so many dead ends?
- How could we make this smarter?

### Part 3: Forward Checking (20 min)

**Activity**:
1. Reset and select "BT + Forward Checking"
2. Run with animation, watch the domain panel
3. Pause when a domain shrinks

**Discussion Questions**:
- What changed in the domains after each assignment?
- Why do we prune values early?
- Did we need fewer assignments than basic backtracking?

**Hands-on**: Have students predict which values will be removed before stepping.

### Part 4: AC-3 Propagation (20 min)

**Activity**:
1. Reset and select "BT + AC-3"
2. Step through slowly, watching the propagation queue
3. Switch to "Trace" tab to see the full sequence

**Key Concepts**:
- Arc consistency vs. forward checking
- Why propagation is transitive
- The queue ensures all arcs are checked

**Challenge**: Load "Simple CSP" (X < Y < Z). Watch AC-3 solve it without search!

### Part 5: Heuristics (15 min)

**Activity**: Compare runs with different heuristics on "4-Queens":
1. Sequential variable + Sequential value
2. MRV + Sequential value
3. MRV + LCV

**Data Collection** (use Trace tab to count):
| Heuristics | Assignments | Time |
|------------|-------------|------|
| None       | ?           | ?    |
| MRV only   | ?           | ?    |
| MRV + LCV  | ?           | ?    |

**Discussion**: Why does MRV help so much?

---

## Recommended Problem Sequence

### Beginner (Understanding CSPs)
1. **Simple CSP**: Shows basic constraints clearly
2. **Australia Map**: Classic example, small enough to trace by hand
3. **4-Queens**: Introduces all-different and indirect constraints

### Intermediate (Algorithm Comparison)
4. **4x4 Sudoku**: Grid structure, more variables
5. Custom 3-coloring problems (have students create JSON)

### Advanced (Performance Analysis)
6. 6-Queens or 8-Queens (computational challenge)
7. Larger Sudoku (9x9 if students implement)
8. Custom problems from their domain

---

## Classroom Activities

### Activity 1: Manual Solving
**Goal**: Understand the algorithm from the inside.

1. Print out Australia map (blank)
2. Students work in pairs to solve by hand
3. Record every assignment and backtrack
4. Compare their steps to the visualizer

**Debrief**: Did you use any heuristics naturally?

---

### Activity 2: Heuristic Race
**Goal**: Empirically compare algorithm performance.

1. Divide class into 4 groups (one per heuristic combo)
2. Each group runs "4-Queens" 5 times, recording:
   - Number of assignments
   - Time to solution
   - Maximum search depth
3. Share results, create class histogram

**Question**: Why do results vary?

---

### Activity 3: Create Your Own Puzzle
**Goal**: Apply CSP modeling skills.

Students create a JSON puzzle for:
- Course scheduling (classes, time slots, room constraints)
- Seating arrangement (people, tables, preference constraints)
- Sports tournament (teams, matches, no same-day constraints)

**Template provided in README**. Share best puzzles with class!

---

### Activity 4: Algorithm Prediction
**Goal**: Develop intuition for algorithm behavior.

1. Show a puzzle setup (don't run)
2. Students predict:
   - Will AC-3 reduce domains? How much?
   - Will MRV choose variable X or Y first?
   - Will the problem backtrack? Where?
3. Run visualizer to check predictions

**Variations**: Use different problems, different states.

---

## Assessment Ideas

### Quiz Questions

**Conceptual**:
1. What is the difference between Forward Checking and AC-3?
2. Why might MRV cause more failures than sequential ordering?
3. Give an example where LCV makes no difference.

**Applied**:
1. Model a real-world problem as a CSP (state variables, domains, constraints)
2. Trace the first 5 steps of backtracking on a given problem
3. Predict the result of AC-3 on a small CSP

**Analysis**:
1. Explain why 8-Queens takes longer than 4-Queens (complexity)
2. Compare best and worst case scenarios for each algorithm
3. When would you NOT want to use AC-3?

---

### Project Ideas

**Small Projects** (1-2 weeks):
1. Add a new puzzle JSON file and visualize it
2. Modify CSS to create a custom theme
3. Add a statistics panel (nodes expanded, backtracks, etc.)

**Medium Projects** (3-4 weeks):
1. Implement MAC (Maintaining Arc Consistency)
2. Add conflict-directed backjumping
3. Create a Sudoku solver with different sizes

**Large Projects** (semester):
1. Build a CSP solver for a specific domain (course scheduling, etc.)
2. Implement additional constraint types (global constraints)
3. Add a puzzle editor (GUI for creating JSON puzzles)

---

## Common Student Questions

**Q: Why does AC-3 sometimes take longer than Forward Checking?**
A: AC-3 does more work per node (checking all arcs), so on easy problems with few constraints, the overhead isn't worth it. It shines on tightly-constrained problems.

**Q: Can MRV ever be worse than sequential?**
A: Yes! MRV causes earlier failures, which is usually good (fail fast). But if solutions are dense and MRV chooses a hard variable first, it might explore more before finding a solution.

**Q: What's the difference between domain and value?**
A: Domain is the set of possible values. Each variable has one domain containing multiple values.

**Q: Why can't we just use AC-3 to solve everything?**
A: AC-3 only enforces local consistency. Many problems need search even after AC-3 (e.g., map coloring). Some problems ARE solved by AC-3 alone (like simple inequalities).

**Q: How do I make a grid layout instead of circular?**
A: In the JSON, set position coordinates in a grid pattern. E.g., for 4x4:
```json
{"name": "A1", "position": {"x": 100, "y": 100}},
{"name": "A2", "position": {"x": 150, "y": 100}},
...
```

---

## Extension Topics

Once students master the basics, explore:

1. **Constraint Optimization Problems** (COP): Not just satisfying constraints, but maximizing/minimizing a cost function

2. **Global Constraints**: AllDifferent, Cumulative, etc.

3. **Real-World Applications**:
   - Google's OR-Tools
   - Scheduling in factories
   - Resource allocation
   - Protein folding

4. **Comparison with other AI techniques**:
   - CSP vs. SAT solvers
   - CSP vs. Integer Linear Programming
   - CSP vs. Local Search

---

## Technical Tips

### Running in Class
- **Offline mode**: No internet needed, just open `index.html`
- **Projector**: Use fullscreen mode (F11), increase speed for demos
- **Labs**: Students can work locally or access via shared server

### Debugging Student Puzzles
- Use browser console (F12) to see error messages
- Common mistake: Constraint references non-existent variable
- Validate JSON: Use `jsonlint.com` before loading

### Performance
- 4-Queens: Instant on all algorithms
- 8-Queens: Takes ~1-5 seconds with AC-3+MRV
- Larger problems: May need to increase speed or run without animation

---

## Additional Resources

### Related Tools
- [AI-Space](http://aispace.org) - Original inspiration
- [VisuAlgo](https://visualgo.net) - General algorithm visualization
- [CSP Applet](http://www.cse.unsw.edu.au/~cs9414/CSP/) - Alternative CSP visualizer

### Papers
- Russell & Norvig, Chapter 6 (textbook standard)
- Mackworth (1977) - Arc Consistency
- Prosser (1993) - Hybrid algorithms

### Videos
- MIT OpenCourseWare: Constraint Satisfaction
- Stanford CS221: CSP Lecture

---

## Feedback & Contributions

Found a bug? Have a feature request? Want to contribute a puzzle?

- GitHub Issues: [link]
- Pull Requests welcome!
- Share your custom puzzles with the community

---

**Happy Teaching!** 🎓

If you use this in your class, we'd love to hear about it. Email or open a GitHub discussion!
