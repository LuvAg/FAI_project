import { describe, it, expect } from 'vitest';
import { loadPuzzleFromJSON } from '../js/puzzleLoader.js';

describe('Puzzle Loader', () => {
  it('should load puzzle from JSON', () => {
    const json = {
      name: 'Test Puzzle',
      type: 'graph',
      description: 'A test',
      variables: [
        { name: 'A', domain: [1, 2], position: { x: 100, y: 100 } },
        { name: 'B', domain: [1, 2], position: { x: 200, y: 100 } }
      ],
      constraints: [
        { xi: 'A', xj: 'B', type: 'neq', label: '≠' }
      ]
    };

    const csp = loadPuzzleFromJSON(json);
    expect(csp.variables.length).toBe(2);
    expect(csp.constraints.length).toBe(1);
    expect(csp.metadata.name).toBe('Test Puzzle');
    expect(csp.variables[0].position).toEqual({ x: 100, y: 100 });
  });

  it('should parse constraint types', () => {
    const json = {
      name: 'Test',
      variables: [
        { name: 'X', domain: [1, 2, 3] },
        { name: 'Y', domain: [1, 2, 3] }
      ],
      constraints: [
        { xi: 'X', xj: 'Y', type: 'lt', label: '<' }
      ]
    };

    const csp = loadPuzzleFromJSON(json);
    const constraint = csp.constraints[0];
    expect(constraint.check(1, 2)).toBe(true);
    expect(constraint.check(2, 1)).toBe(false);
  });

  it('should default to neq if no type specified', () => {
    const json = {
      name: 'Test',
      variables: [
        { name: 'X', domain: [1, 2] },
        { name: 'Y', domain: [1, 2] }
      ],
      constraints: [
        { xi: 'X', xj: 'Y' }
      ]
    };

    const csp = loadPuzzleFromJSON(json);
    const constraint = csp.constraints[0];
    expect(constraint.check(1, 2)).toBe(true);
    expect(constraint.check(1, 1)).toBe(false);
  });
});
