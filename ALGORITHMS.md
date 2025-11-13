# CSP Algorithms Documentation

## Overview

This document explains the Constraint Satisfaction Problem (CSP) solving algorithms implemented in the visualizer.

## Core Concepts

### Constraint Satisfaction Problem (CSP)

A CSP consists of:
- **Variables**: A set of variables X₁, X₂, ..., Xₙ
- **Domains**: Each variable Xᵢ has a domain Dᵢ of possible values
- **Constraints**: Restrictions on combinations of values

**Goal**: Find an assignment of values to variables that satisfies all constraints.

**Example**: Map Coloring
- Variables: Regions on a map (WA, NT, SA, ...)
- Domains: Colors (red, green, blue)
- Constraints: Adjacent regions must have different colors

## Algorithms

### 1. Backtracking Search

**Basic Idea**: Try values one at a time, backtrack when stuck.

**Pseudocode**:
```
function BACKTRACK(assignment, csp):
    if assignment is complete:
        return assignment
    
    var = SELECT-UNASSIGNED-VARIABLE(csp)
    for value in ORDER-DOMAIN-VALUES(var, csp):
        if value is consistent with assignment:
            add {var = value} to assignment
            result = BACKTRACK(assignment, csp)
            if result ≠ failure:
                return result
            remove {var = value} from assignment
    
    return failure
```

**Complexity**: O(d^n) where d = domain size, n = number of variables

**When to use**: Simple problems, or when you want to see the basic algorithm in action.

---

### 2. Forward Checking (FC)

**Enhancement**: After assigning a variable, prune inconsistent values from unassigned neighbors.

**Key Idea**: 
- When X is assigned value v, check each unassigned neighbor Y
- Remove from Y's domain any value that conflicts with X=v
- If Y's domain becomes empty, backtrack immediately

**Advantage**: Detects dead-ends earlier than basic backtracking.

**Example**:
```
X = {1,2,3}    Y = {1,2,3}
Constraint: X ≠ Y

Assign X = 1
Forward Check: Remove 1 from Y's domain
Result: Y = {2,3}
```

**Complexity**: Better than basic backtracking in practice, but still exponential worst-case.

---

### 3. AC-3 (Arc Consistency Algorithm 3)

**Goal**: Enforce arc consistency on all variable pairs.

**Arc Consistency**: An arc (Xi, Xj) is consistent if for every value in Xi's domain, there exists a value in Xj's domain that satisfies the constraint.

**Algorithm**:
```
function AC3(csp):
    queue = all arcs in csp
    while queue is not empty:
        (Xi, Xj) = queue.pop()
        if REVISE(csp, Xi, Xj):
            if Xi.domain is empty:
                return failure
            for each Xk in Xi.neighbors - {Xj}:
                queue.add((Xk, Xi))
    return success

function REVISE(csp, Xi, Xj):
    revised = false
    for each x in Xi.domain:
        if no value y in Xj.domain satisfies constraint(Xi, Xj):
            delete x from Xi.domain
            revised = true
    return revised
```

**Complexity**: O(cd³) where c = number of constraints, d = domain size

**When to use**: Problems with tight constraints where propagation helps a lot.

**Example**:
```
Initial:
X = {1,2,3}    Y = {1,2,3}    Z = {1,2,3}
Constraints: X < Y, Y < Z, X ≠ Z

After AC-3:
X = {1}        Y = {2}        Z = {3}
(Solved without search!)
```

---

## Heuristics

### Variable Ordering

#### Minimum Remaining Values (MRV)
**Also known as**: "Most Constrained Variable", "Fail First"

**Strategy**: Choose the variable with the smallest domain.

**Rationale**: 
- If a variable is going to fail, better to find out early
- Reduces branching factor

**Example**:
```
X = {1,2,3}    Y = {1}    Z = {1,2}

MRV chooses Y first (domain size = 1)
```

**Performance**: Usually 10-100x speedup on hard problems.

#### Sequential (No Heuristic)
Choose variables in order they appear.

---

### Value Ordering

#### Least Constraining Value (LCV)
**Strategy**: Try the value that rules out the fewest choices for neighboring variables.

**Rationale**: 
- Maximize flexibility for future assignments
- Increases likelihood of finding a solution

**Example**:
```
X = {1,2,3}    Y = {1,2,3}    Z = {1,2,3}
Constraint: X ≠ Y, X ≠ Z

For X, try values in order of how many neighbor values remain:
- X=1: Y has {2,3}, Z has {2,3} → 4 total choices
- X=2: Y has {1,3}, Z has {1,3} → 4 total choices
- X=3: Y has {1,2}, Z has {1,2} → 4 total choices

(In this case, all equal. LCV matters more in complex problems.)
```

**Performance**: Can significantly reduce backtracking on dense constraint graphs.

#### Sequential (No Heuristic)
Try values in domain order.

---

## Algorithm Comparison

| Algorithm | Pruning | Propagation | Typical Speedup |
|-----------|---------|-------------|-----------------|
| Backtracking | None | None | 1x (baseline) |
| BT + FC | Neighbors only | After assignment | 10-50x |
| BT + AC-3 | All variables | Transitively | 100-1000x |

**Trade-off**: AC-3 does more work per node, but visits far fewer nodes.

---

## When to Use Each Algorithm

### Basic Backtracking
- ✅ Small problems (< 10 variables)
- ✅ Educational purposes
- ✅ Loose constraints
- ❌ Large, tightly-constrained problems

### Forward Checking
- ✅ Medium problems (10-50 variables)
- ✅ Moderate constraint density
- ✅ When AC-3 overhead is too high
- ❌ Very tight constraints (AC-3 better)

### AC-3
- ✅ Large problems (50+ variables)
- ✅ Tight constraints
- ✅ Grid puzzles (Sudoku, etc.)
- ❌ Very sparse constraints (overhead not worth it)

---

## Implementation Notes

### Event Hooks
The CSP class emits events for visualization:
- `propagateStart` - AC-3 begins
- `propagateStep` - Processing an arc
- `domainRevised` - Domain reduced
- `propagateFail` - Domain became empty
- `propagateEnd` - AC-3 completed
- `assign` - Variable assigned
- `unassign` - Backtracking

### Snapshots
For step-backward functionality, the solver saves snapshots of:
- Current domains
- Current assignment
- Timestamp

### Complexity in Practice

**4-Queens** (4 variables, domains of size 4):
- Backtracking: ~32 assignments
- BT + FC: ~16 assignments
- BT + AC-3 + MRV: ~8 assignments

**Australia Map** (7 variables, domains of size 3):
- Backtracking: ~50-150 assignments (varies by order)
- BT + FC + MRV: ~15-30 assignments
- BT + AC-3 + MRV: ~10-20 assignments

---

## Further Reading

1. **Russell & Norvig** - "Artificial Intelligence: A Modern Approach", Chapter 6
2. **Mackworth (1977)** - "Consistency in Networks of Relations" (original AC-3)
3. **Haralick & Elliott (1980)** - "Increasing Tree Search Efficiency for CSPs"
4. **Dechter (2003)** - "Constraint Processing" (comprehensive textbook)

---

## Extensions Not Implemented (Future Work)

- **MAC (Maintaining Arc Consistency)**: Run AC-3 after every assignment
- **Conflict-Directed Backjumping**: Jump back to source of failure
- **Min-Conflicts**: Local search for large problems
- **Dynamic Variable Ordering**: Recompute MRV at each step
- **Degree Heuristic**: Tie-breaker for MRV
- **Constraint Learning**: Record and reuse conflict reasons

---

**Questions?** Check the [README](README.md) or explore the code in `js/csp.js`!
