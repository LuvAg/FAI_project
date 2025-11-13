import { describe, it, expect, beforeEach } from 'vitest';
import { Variable, BinaryConstraint, CSP } from '../js/csp.js';

describe('Variable', () => {
  it('should create a variable with name and domain', () => {
    const v = new Variable('X', [1, 2, 3]);
    expect(v.name).toBe('X');
    expect(v.domain).toEqual([1, 2, 3]);
  });

  it('should accept position parameter', () => {
    const v = new Variable('Y', [1, 2], { x: 100, y: 200 });
    expect(v.position).toEqual({ x: 100, y: 200 });
  });
});

describe('BinaryConstraint', () => {
  it('should create constraint with check function', () => {
    const c = new BinaryConstraint('X', 'Y', (a, b) => a !== b, '≠');
    expect(c.xi).toBe('X');
    expect(c.xj).toBe('Y');
    expect(c.check(1, 2)).toBe(true);
    expect(c.check(1, 1)).toBe(false);
    expect(c.label).toBe('≠');
  });
});

describe('CSP', () => {
  let csp;

  beforeEach(() => {
    const vars = [
      new Variable('X', [1, 2, 3]),
      new Variable('Y', [1, 2, 3]),
      new Variable('Z', [1, 2, 3])
    ];
    const constraints = [
      new BinaryConstraint('X', 'Y', (a, b) => a !== b),
      new BinaryConstraint('Y', 'Z', (a, b) => a !== b)
    ];
    csp = new CSP(vars, constraints, { name: 'Test CSP' });
  });

  it('should create CSP with variables and constraints', () => {
    expect(csp.variables.length).toBe(3);
    expect(csp.constraints.length).toBe(2);
    expect(csp.metadata.name).toBe('Test CSP');
  });

  it('should build neighbor map', () => {
    expect(csp.neighbors.get('X').has('Y')).toBe(true);
    expect(csp.neighbors.get('Y').has('X')).toBe(true);
    expect(csp.neighbors.get('Y').has('Z')).toBe(true);
    expect(csp.neighbors.get('X').has('Z')).toBe(false);
  });

  it('should copy domains correctly', () => {
    const domains = csp.copyDomains();
    expect(domains.get('X')).toEqual([1, 2, 3]);
    domains.get('X').push(4); // mutate copy
    expect(csp.variables[0].domain).toEqual([1, 2, 3]); // original unchanged
  });

  it('should find constraints between variables', () => {
    const constraints = csp.constraintsBetween('X', 'Y');
    expect(constraints.length).toBe(1);
    expect(constraints[0].xi).toBe('X');
  });

  it('should revise domains', () => {
    const domains = new Map([
      ['X', [1]],
      ['Y', [1, 2]],
      ['Z', [1, 2, 3]]
    ]);
    const revised = csp.revise(domains, 'Y', 'X');
    expect(revised).toBe(true);
    expect(domains.get('Y')).toEqual([2]); // 1 removed
  });

  it('should handle AC-3 propagation', async () => {
    const domains = csp.copyDomains();
    domains.set('X', [1]);
    const ok = await csp.AC3(domains, [['Y', 'X']], 0);
    expect(ok).toBe(true);
    expect(domains.get('Y')).not.toContain(1);
  });

  it('should detect failure in AC-3', async () => {
    const domains = new Map([
      ['X', [1]],
      ['Y', [1]],
      ['Z', [1, 2]]
    ]);
    const ok = await csp.AC3(domains, [['Y', 'X']], 0);
    expect(ok).toBe(false); // Y domain becomes empty
  });
});

describe('CSP Backtracking', () => {
  it('should solve simple CSP', async () => {
    const vars = [
      new Variable('X', [1, 2]),
      new Variable('Y', [1, 2])
    ];
    const constraints = [new BinaryConstraint('X', 'Y', (a, b) => a !== b)];
    const csp = new CSP(vars, constraints);

    const result = await csp.backtrackingSearch({ sleep: 0, heuristics: { variable: 'none', value: 'none' } });
    expect(result.result).toBe(true);
    expect(result.assignment.get('X')).not.toBe(result.assignment.get('Y'));
  });

  it('should detect unsolvable CSP', async () => {
    const vars = [
      new Variable('X', [1]),
      new Variable('Y', [1])
    ];
    const constraints = [new BinaryConstraint('X', 'Y', (a, b) => a !== b)];
    const csp = new CSP(vars, constraints);

    const result = await csp.backtrackingSearch({ sleep: 0, heuristics: { variable: 'none', value: 'none' } });
    expect(result.result).toBe(false);
  });

  it('should use MRV heuristic', async () => {
    const vars = [
      new Variable('X', [1, 2, 3]),
      new Variable('Y', [1]), // smallest domain
      new Variable('Z', [1, 2])
    ];
    const constraints = [
      new BinaryConstraint('X', 'Y', (a, b) => a !== b),
      new BinaryConstraint('Y', 'Z', (a, b) => a !== b)
    ];
    const csp = new CSP(vars, constraints);

    let firstAssigned = null;
    csp.on('assign', (info) => {
      if (!firstAssigned) firstAssigned = info.var;
    });

    await csp.backtrackingSearch({ sleep: 0, heuristics: { variable: 'MRV', value: 'none' } });
    expect(firstAssigned).toBe('Y'); // Y has smallest domain
  });
});
