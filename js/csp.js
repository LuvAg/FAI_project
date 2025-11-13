// CSP core engine: Variables, Constraints, AC-3, Forward Checking, Backtracking + hooks for visualization

export class Variable{
  constructor(name, domain, position=null){
    this.name = name;
    this.domain = Array.from(domain);
    this.position = position; // {x, y} for layout
  }
}

export class BinaryConstraint{
  // constraint between xi and xj: check(a,b) -> bool
  constructor(xi, xj, check, label='≠'){
    this.xi = xi; 
    this.xj = xj; 
    this.check = check;
    this.label = label; // for display
  }
}

export class CSP{
  constructor(variables=[], constraints=[], metadata={}){
    this.variables = variables; // array of Variable
    this.constraints = constraints; // array of BinaryConstraint
    this.metadata = metadata; // {name, type, description}
    this.neighbors = new Map();
    for(let v of variables) this.neighbors.set(v.name, new Set());
    for(let c of constraints){
      this.neighbors.get(c.xi).add(c.xj);
      this.neighbors.get(c.xj).add(c.xi);
    }
    this._hooks = {};
    this._snapshots = []; // for replay
  }

  on(event, fn){ this._hooks[event] = fn; }
  emit(event, ...args){ 
    if(this._hooks[event]) this._hooks[event](...args); 
  }
  
  saveSnapshot(domains, assignment){
    this._snapshots.push({
      domains: cloneMapDeep(domains),
      assignment: cloneMap(assignment),
      timestamp: Date.now()
    });
  }
  
  getSnapshot(index){
    return this._snapshots[index];
  }
  
  clearSnapshots(){
    this._snapshots = [];
  }

  copyDomains(){
    const d = new Map();
    for(let v of this.variables) d.set(v.name, Array.from(v.domain));
    return d;
  }

  setDomainsFromMap(map){
    for(let v of this.variables){
      if(map.has(v.name)) v.domain = Array.from(map.get(v.name));
    }
  }

  // get binary constraints between xi and xj
  constraintsBetween(xi, xj){
    return this.constraints.filter(c => (c.xi===xi && c.xj===xj) || (c.xi===xj && c.xj===xi));
  }

  // AC-3 returns whether domains reduced to non-empty; emits events for visualization
  async AC3(domains, queue=null, sleep=0){
    if(!queue) queue = [];
    // initialize queue with all arcs if empty
    if(queue.length===0){
      for(let c of this.constraints) queue.push([c.xi,c.xj]);
      this.emit('propagateStart', queue.slice());
    } else {
      this.emit('propagateStart', queue.slice());
    }

    while(queue.length){
      const [xi,xj] = queue.shift();
      this.emit('propagateStep', {xi,xj,queue:queue.slice()});
      await wait(sleep);
      if(this.revise(domains, xi, xj)){
        this.emit('domainRevised', {var:xi, domain:Array.from(domains.get(xi))});
        if(domains.get(xi).length===0){
          this.emit('propagateFail', xi);
          this.emit('propagateEnd');
          return false;
        }
        for(let xk of this.neighbors.get(xi)){
          if(xk===xj) continue;
          queue.push([xk, xi]);
        }
      }
    }
    this.emit('propagateEnd');
    return true;
  }

  // revise xi w.r.t xj, return true if domain changed
  revise(domains, xi, xj){
    let revised = false;
    const xiDom = domains.get(xi);
    const xjDom = domains.get(xj);
    const toRemove = [];
    for(let a of xiDom){
      let ok = false;
      for(let b of xjDom){
        // check constraints between xi,xj
        const cs = this.constraintsBetween(xi, xj);
        let allOk = true;
        for(let c of cs){
          const va = (c.xi===xi)?a:b;
          const vb = (c.xi===xi)?b:a;
          if(!c.check(va,vb)) { allOk = false; break; }
        }
        if(allOk){ ok = true; break; }
      }
      if(!ok) toRemove.push(a);
    }
    if(toRemove.length){
      domains.set(xi, xiDom.filter(x=>!toRemove.includes(x)));
      revised = true;
    }
    return revised;
  }

  // Backtracking search with optional inference callback: 'AC3' uses AC3, 'FC' uses Forward Checking
  async backtrackingSearch(options={inference:null,sleep:200,stepCallback:null,auto:false,heuristics:{variable:'MRV',value:'LCV'},singleStep:false}){
    const domains = this.copyDomains();
    const assignment = new Map();
    const stack = [];
    this.clearSnapshots();
    
    // Single-step mode state
    if(!this._searchState){
      this._searchState = {
        domains: domains,
        assignment: assignment,
        stack: stack,
        phase: 'init'
      };
    } else if(options.singleStep){
      // Resume from saved state
      Object.assign(domains, this._searchState.domains);
      Object.assign(assignment, this._searchState.assignment);
      Object.assign(stack, this._searchState.stack);
    }

    const varOrder = () => {
      // variable ordering heuristic
      const unassigned = this.variables.filter(v=>!assignment.has(v.name));
      if(options.heuristics.variable === 'MRV'){
        // Minimum Remaining Values
        unassigned.sort((a,b)=>domains.get(a.name).length - domains.get(b.name).length);
      }
      return unassigned;
    };

    const valueOrder = (varName) => {
      // value ordering heuristic
      const vals = Array.from(domains.get(varName));
      if(options.heuristics.value === 'LCV'){
        // Least Constraining Value: count how many neighbor values remain
        const counts = vals.map(v=>{
          let count = 0;
          for(let nb of this.neighbors.get(varName)){
            if(assignment.has(nb)) continue;
            for(let nbVal of domains.get(nb)){
              const cs = this.constraintsBetween(varName, nb);
              let ok = true;
              for(let c of cs){
                const va = (c.xi===varName)?v:nbVal;
                const vb = (c.xi===varName)?nbVal:v;
                if(!c.check(va,vb)) { ok = false; break; }
              }
              if(ok) count++;
            }
          }
          return {value:v, count};
        });
        counts.sort((a,b)=>b.count - a.count); // descending
        return counts.map(x=>x.value);
      }
      return vals;
    };

    const recursive = async () => {
      if(assignment.size===this.variables.length) return true;
      
      this.saveSnapshot(domains, assignment);
      
      const candidates = varOrder();
      const varr = candidates[0];
      const name = varr.name;
      const orderedValues = valueOrder(name);
      
      for(let value of orderedValues){
        // try assign
        assignment.set(name, value);
        stack.push({type:'assign',var:name,value});
        this.emit('assign', {var:name,value,assignment:cloneMap(assignment)});
        await wait(options.sleep);
        
        // check consistency with neighbors
        let consistent = true;
        for(let nb of this.neighbors.get(name)){
          if(assignment.has(nb)){
            const nbval = assignment.get(nb);
            const cs = this.constraintsBetween(name, nb);
            for(let c of cs){
              const va = (c.xi===name)?value:nbval;
              const vb = (c.xi===name)?nbval:value;
              if(!c.check(va,vb)) { consistent=false; break; }
            }
          }
          if(!consistent) break;
        }
        if(!consistent){
          assignment.delete(name);
          stack.push({type:'unassign',var:name});
          this.emit('unassign', {var:name,assignment:cloneMap(assignment)});
          continue;
        }

        // inference
        const savedDomains = new Map();
        for(let k of domains.keys()) savedDomains.set(k, Array.from(domains.get(k)));
        domains.set(name, [value]);

        if(options.inference==='AC3'){
          const arcs = [...this.neighbors.get(name)].map(n=>[n,name]);
          const ok = await this.AC3(domains, arcs, options.sleep);
          if(!ok){
            // restore
            for(let k of savedDomains.keys()) domains.set(k, savedDomains.get(k));
            assignment.delete(name);
            stack.push({type:'unassign',var:name});
            this.emit('unassign', {var:name,assignment:cloneMap(assignment)});
            continue;
          }
        } else if(options.inference==='FC'){
          // Forward Checking: prune neighbors
          let ok = true;
          for(let nb of this.neighbors.get(name)){
            if(assignment.has(nb)) continue;
            const toRemove = [];
            for(let nbVal of domains.get(nb)){
              const cs = this.constraintsBetween(name, nb);
              let consistent = true;
              for(let c of cs){
                const va = (c.xi===name)?value:nbVal;
                const vb = (c.xi===name)?nbVal:value;
                if(!c.check(va,vb)) { consistent=false; break; }
              }
              if(!consistent) toRemove.push(nbVal);
            }
            domains.set(nb, domains.get(nb).filter(x=>!toRemove.includes(x)));
            this.emit('domainRevised', {var:nb, domain:Array.from(domains.get(nb))});
            if(domains.get(nb).length===0) {
              ok = false;
              this.emit('propagateFail', nb);
              break;
            }
          }
          if(!ok){
            for(let k of savedDomains.keys()) domains.set(k, savedDomains.get(k));
            assignment.delete(name);
            stack.push({type:'unassign',var:name});
            this.emit('unassign', {var:name,assignment:cloneMap(assignment)});
            continue;
          }
        }

        // recurse
        if(await recursive()) return true;

        // backtrack
        for(let k of savedDomains.keys()) domains.set(k, savedDomains.get(k));
        assignment.delete(name);
        stack.push({type:'unassign',var:name});
        this.emit('unassign', {var:name,assignment:cloneMap(assignment)});
        await wait(options.sleep);
      }
      return false;
    };

    const res = await recursive();
    return {result:res,assignment:assignment,domains:domains};
  }
}

function wait(ms){ return new Promise(r=>setTimeout(r, ms)); }
function cloneMap(m){ const mm = new Map(); for(const [k,v] of m) mm.set(k,v); return mm; }
function cloneMapDeep(m){ 
  const mm = new Map(); 
  for(const [k,v] of m) mm.set(k, Array.isArray(v) ? Array.from(v) : v); 
  return mm; 
}

// helper: create map-colored Australia problem
export function australiaMap(){
  const colors = ['red','green','blue'];
  const positions = {
    WA: {x:150, y:250}, NT: {x:300, y:150}, SA: {x:300, y:300}, 
    Q: {x:450, y:200}, NSW: {x:450, y:350}, V: {x:400, y:450}, T: {x:500, y:520}
  };
  const vars = ['WA','NT','SA','Q','NSW','V','T'].map(n=>new Variable(n, colors, positions[n]));
  const constraints = [];
  const neq = (a,b)=>a!==b;
  function add(a,b){ constraints.push(new BinaryConstraint(a,b,neq,'≠')); }
  add('WA','NT'); add('WA','SA'); add('NT','SA'); add('NT','Q'); add('SA','Q'); add('SA','NSW'); add('SA','V'); add('Q','NSW'); add('NSW','V');
  return new CSP(vars,constraints,{name:'Australia Map Coloring', type:'graph', description:'Color the map with 3 colors so no adjacent regions share a color'});
}

export function simpleCSP(){
  const vars = [new Variable('X', [1,2,3], {x:200,y:300}), new Variable('Y',[1,2,3],{x:400,y:300}), new Variable('Z',[1,2,3],{x:600,y:300})];
  const constraints = [];
  constraints.push(new BinaryConstraint('X','Y',(a,b)=>a<b,'<'));
  constraints.push(new BinaryConstraint('Y','Z',(a,b)=>a<b,'<'));
  constraints.push(new BinaryConstraint('X','Z',(a,b)=>a!==b,'≠'));
  return new CSP(vars,constraints,{name:'Simple CSP', type:'graph', description:'X < Y < Z and X ≠ Z'});
}

export function nQueens(n=4){
  const vars = [];
  for(let i=0; i<n; i++){
    vars.push(new Variable(`Q${i}`, Array.from({length:n}, (_,j)=>j), {x:100+i*100, y:300}));
  }
  const constraints = [];
  for(let i=0; i<n; i++){
    for(let j=i+1; j<n; j++){
      constraints.push(new BinaryConstraint(`Q${i}`, `Q${j}`, (a,b)=>a!==b && Math.abs(a-b)!==Math.abs(i-j), 'no attack'));
    }
  }
  return new CSP(vars,constraints,{name:`${n}-Queens`, type:'graph', description:`Place ${n} queens on a ${n}x${n} board`});
}
