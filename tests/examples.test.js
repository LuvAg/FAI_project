import { describe, it, expect } from 'vitest';
import { australiaMap, simpleCSP, nQueens } from '../js/csp.js';

describe('Example Puzzles', () => {
  it('should create Australia map puzzle', () => {
    const csp = australiaMap();
    expect(csp.variables.length).toBe(7);
    expect(csp.constraints.length).toBeGreaterThan(0);
    expect(csp.metadata.name).toBe('Australia Map Coloring');
  });

  it('should create simple CSP', () => {
    const csp = simpleCSP();
    expect(csp.variables.length).toBe(3);
    expect(csp.constraints.length).toBe(3);
  });

  it('should create n-queens puzzle', () => {
    const csp = nQueens(4);
    expect(csp.variables.length).toBe(4);
    expect(csp.constraints.length).toBe(6); // 4 choose 2
    expect(csp.metadata.name).toBe('4-Queens');
  });

  it('should solve 4-queens', async () => {
    const csp = nQueens(4);
    const result = await csp.backtrackingSearch({ 
      sleep: 0, 
      inference: 'FC',
      heuristics: { variable: 'MRV', value: 'LCV' } 
    });
    expect(result.result).toBe(true);
    expect(result.assignment.size).toBe(4);
  }, 10000);
});
