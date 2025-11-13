// Puzzle loader: loads CSP from JSON format

import { Variable, BinaryConstraint, CSP } from './csp.js';

/**
 * JSON schema:
 * {
 *   "name": "Puzzle Name",
 *   "type": "graph" | "grid",
 *   "description": "...",
 *   "variables": [
 *     {"name": "X", "domain": [1,2,3], "position": {"x": 100, "y": 200}}
 *   ],
 *   "constraints": [
 *     {"xi": "X", "xj": "Y", "type": "neq" | "lt" | "custom", "label": "≠"}
 *   ]
 * }
 */

const CONSTRAINT_TYPES = {
  'neq': (a,b) => a !== b,
  'lt': (a,b) => a < b,
  'gt': (a,b) => a > b,
  'lte': (a,b) => a <= b,
  'gte': (a,b) => a >= b,
  'eq': (a,b) => a === b,
  'nqueens': (a,b,i,j) => a!==b && Math.abs(a-b)!==Math.abs(i-j), // special for queens
};

export function loadPuzzleFromJSON(json){
  const data = typeof json === 'string' ? JSON.parse(json) : json;
  
  const variables = data.variables.map(v => 
    new Variable(v.name, v.domain, v.position || null)
  );
  
  const constraints = data.constraints.map(c => {
    let checkFn;
    if(c.type && CONSTRAINT_TYPES[c.type]){
      checkFn = CONSTRAINT_TYPES[c.type];
    } else if(c.check){
      // custom function as string (eval - be careful!)
      checkFn = new Function('a', 'b', `return ${c.check}`);
    } else {
      checkFn = CONSTRAINT_TYPES.neq; // default
    }
    return new BinaryConstraint(c.xi, c.xj, checkFn, c.label || '');
  });
  
  const metadata = {
    name: data.name || 'Unnamed',
    type: data.type || 'graph',
    description: data.description || ''
  };
  
  return new CSP(variables, constraints, metadata);
}

export async function loadPuzzleFromFile(path){
  const res = await fetch(path);
  const json = await res.json();
  return loadPuzzleFromJSON(json);
}
