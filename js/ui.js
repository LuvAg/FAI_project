import { australiaMap, simpleCSP, nQueens } from './csp.js';
import { loadPuzzleFromFile } from './puzzleLoader.js';

// UI glue: render SVG nodes/edges, wiring CSP events to visual components, timeline, inspector

const canvas = document.getElementById('canvas');
const domainsPanel = document.getElementById('domains');
const currentDomainsPanel = document.getElementById('currentDomains');
const queuePanel = document.getElementById('queue');
const stackPanel = document.getElementById('stack');
const logPanel = document.getElementById('log');
const timelinePanel = document.getElementById('timeline');
const inspectorVar = document.getElementById('inspectorVar');
const inspectorContent = document.getElementById('inspectorContent');
const puzzleInfo = document.getElementById('puzzleInfo');
const statusInfo = document.getElementById('statusInfo');
const speedVal = document.getElementById('speedVal');
const stateDisplay = document.getElementById('stateDisplay');
const stepDescText = document.getElementById('stepDescText');

let csp = null;
let running = false;
let paused = false;
let speed = 200;
let eventHistory = [];
let currentStateIndex = -1;
let solver = null;
let searchState = null;
let editMode = false;
let originalDomains = new Map(); // Store original domains for reset

document.getElementById('speed').addEventListener('input', (e)=> {
  speed = parseInt(e.target.value);
  speedVal.textContent = speed + 'ms';
});
document.getElementById('resetBtn').addEventListener('click', init);
document.getElementById('stepBtn').addEventListener('click', stepForward);
document.getElementById('stepBackBtn').addEventListener('click', stepBackward);
document.getElementById('runBtn').addEventListener('click', runAll);
document.getElementById('pauseBtn').addEventListener('click', ()=> paused = true);
document.getElementById('problemSelect').addEventListener('change', init);
document.getElementById('algoSelect').addEventListener('change', init);
document.getElementById('varHeuristic').addEventListener('change', init);
document.getElementById('valHeuristic').addEventListener('change', init);

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.querySelector(`.tab-content[data-tab="${btn.dataset.tab}"]`).classList.add('active');
  });
});

inspectorVar.addEventListener('change', updateInspector);

function log(...args){ 
  const s = args.join(' '); 
  const el = document.createElement('div'); 
  el.textContent = `[${eventHistory.length}] ${s}`; 
  logPanel.prepend(el); 
}

function clearLog(){ logPanel.innerHTML=''; }

async function init(){
  paused = false; running = false; clearLog(); queuePanel.innerHTML=''; stackPanel.innerHTML=''; 
  timelinePanel.innerHTML=''; eventHistory = []; currentStateIndex = -1; searchState = null;
  updateStepDescription('Ready to begin');
  
  const p = document.getElementById('problemSelect').value;
  if(p==='map') csp = australiaMap(); 
  else if(p==='4queens') csp = nQueens(4);
  else if(p==='sudoku') csp = await loadPuzzleFromFile('puzzles/sudoku4x4.json');
  else csp = simpleCSP();
  
  // Store original domains for reset during backtracking
  originalDomains.clear();
  for(const v of csp.variables){
    originalDomains.set(v.name, [...v.domain]);
  }
  
  bindCSPEvents(csp);
  renderLayout(csp);
  renderDomains(csp, false); // Render original domains
  renderCurrentDomains(csp); // Render current domains
  updatePuzzleInfo();
  populateInspectorVars();
  updateStatus('Ready');
  updateStateDisplay();
}


function bindCSPEvents(csp){
  csp.on('propagateStart', q=>{ 
    queuePanel.innerHTML=''; 
    addQueue(q); 
    addEvent('propagateStart', {queue:q}); 
    log('AC-3 propagation started'); 
  });
  csp.on('propagateStep', info=>{ 
    addQueue(info.queue); 
    addEvent('propagateStep', info);
    log(`Propagate: ${info.xi} → ${info.xj}`); 
    highlightEdge(info.xi, info.xj, 'queued'); 
  });
  csp.on('domainRevised', info=>{ 
    renderCurrentDomains(csp); 
    addEvent('domainRevised', info);
    highlightNode(info.var,'revised'); 
    log(`Domain revised ${info.var}: [${info.domain.join(', ')}]`); 
  });
  csp.on('propagateFail', v=>{ 
    addEvent('propagateFail', {var:v});
    log(`⚠ Propagation failed at ${v}`); 
  });
  csp.on('propagateEnd', ()=>{ 
    addEvent('propagateEnd', {});
    log('Propagation completed'); 
    setTimeout(()=>renderCurrentDomains(csp),100); 
  });
  csp.on('assign', info=>{ 
    renderCurrentDomains(csp); 
    pushStack(`${info.var} = ${info.value}`); 
    // Only add event if not already added (check if snapshot exists means it came from performSingleStep)
    if(info.snapshot) {
      addEvent('assign', {var: info.var, value: info.value, snapshot: info.snapshot, description: info.description});
    } else {
      addEvent('assign', info);
    }
    highlightNode(info.var,'assigned'); 
    log(`✓ Assign ${info.var} = ${info.value}`);
    if(info.description) {
      updateStepDescription(info.description);
    }
    updateStateDisplay(info.assignment);
  });
  csp.on('unassign', info=>{ 
    renderCurrentDomains(csp); 
    popStack(); 
    addEvent('unassign', info);
    log(`✗ Backtrack ${info.var}`); 
    removeHighlight(info.var);
    updateStateDisplay(info.assignment);
  });
}

function addEvent(type, data){
  const event = {
    type, 
    data, 
    index: eventHistory.length, 
    timestamp: Date.now(),
    snapshot: data.snapshot || null
  };
  eventHistory.push(event);
  currentStateIndex = eventHistory.length - 1;
  renderTimeline();
}

function renderTimeline(){
  timelinePanel.innerHTML = '';
  eventHistory.forEach((ev, i) => {
    const el = document.createElement('div');
    el.className = 'timeline-event' + (i === currentStateIndex ? ' current' : '');
    
    let label = `[${i}] `;
    if(ev.type === 'assign' && ev.data.var){
      label += `✓ ${ev.data.var} = ${ev.data.value}`;
    } else if(ev.type === 'backtrack' && ev.data.var){
      label += `✗ Backtrack ${ev.data.var}`;
    } else if(ev.type === 'domainRevised'){
      label += `🔄 Domain ${ev.data.var}`;
    } else {
      label += ev.type;
    }
    
    el.textContent = label;
    el.addEventListener('click', () => jumpToEvent(i));
    timelinePanel.appendChild(el);
  });
  timelinePanel.scrollTop = timelinePanel.scrollHeight;
}

function jumpToEvent(index){
  if(index < 0 || index >= eventHistory.length) return;
  currentStateIndex = index;
  const event = eventHistory[index];
  
  // Restore state from snapshot if available
  if(event.snapshot){
    searchState.domains = cloneMapDeep(event.snapshot.domains);
    searchState.assignment = cloneMap(event.snapshot.assignment);
    csp.setDomainsFromMap(searchState.domains);
    renderCurrentDomains(csp);
    updateStateDisplay(searchState.assignment);
    
    // Update node highlights based on current assignments
    // First clear all highlights
    for(const v of csp.variables){
      removeHighlight(v.name);
    }
    // Then highlight assigned variables
    for(const [varName, value] of searchState.assignment){
      highlightNode(varName, 'assigned');
    }
  }
  
  // Update step description
  if(event.data.description){
    updateStepDescription(event.data.description);
  } else {
    updateStepDescription(`Event ${index}: ${event.type}`);
  }
  
  log(`⏩ Jumped to event ${index}`);
  renderTimeline();
}

function stepBackward(){
  if(!searchState || !eventHistory.length){
    log('⏪ No history to step back');
    updateStepDescription('No history to step back');
    return;
  }
  
  if(currentStateIndex > 0){
    currentStateIndex--;
    const event = eventHistory[currentStateIndex];
    log(`⏪ Stepped back to event ${currentStateIndex}`);
    
    // Update step description from event
    if(event.data && event.data.description){
      updateStepDescription(event.data.description);
    } else {
      updateStepDescription(`Event ${currentStateIndex}: ${event.type}`);
    }
    
    // Restore state from snapshot if available
    if(event.snapshot){
      searchState.domains = cloneMapDeep(event.snapshot.domains);
      searchState.assignment = cloneMap(event.snapshot.assignment);
      csp.setDomainsFromMap(searchState.domains);
      
      updateStateDisplay(searchState.assignment);
      renderCurrentDomains(csp);
      
      // Update node highlights based on current assignments
      // First clear all highlights
      for(const v of csp.variables){
        removeHighlight(v.name);
      }
      // Then highlight assigned variables
      for(const [varName, value] of searchState.assignment){
        highlightNode(varName, 'assigned');
      }
    }
    
    renderTimeline();
  } else {
    log('⏪ At beginning of history');
    updateStepDescription('At beginning of history');
  }
}

// Helper function to perform one step of backtracking
async function performSingleStep(){
  const algo = document.getElementById('algoSelect').value;
  const inference = algo==='bt-ac3' ? 'AC3' : (algo==='bt-fc' ? 'FC' : null);
  const varH = document.getElementById('varHeuristic').value;
  
  // Get unassigned variables
  let unassigned = csp.variables.filter(v => !searchState.assignment.has(v.name));
  
  if(unassigned.length === 0){
    return {solved: true};
  }
  
  // If we have a current variable that still has untried values, stick with it
  let varName, varr;
  if(searchState.currentVariable && !searchState.assignment.has(searchState.currentVariable)){
    // Continue with current variable
    varName = searchState.currentVariable;
    varr = csp.variables.find(v => v.name === varName);
  } else if(searchState.lastBacktracked && !searchState.assignment.has(searchState.lastBacktracked)){
    // Use the backtracked variable
    varName = searchState.lastBacktracked;
    varr = csp.variables.find(v => v.name === varName);
    searchState.currentVariable = varName; // Set as current
  } else {
    // Select new variable using heuristic
    if(varH === 'MRV'){
      unassigned.sort((a,b) => searchState.domains.get(a.name).length - searchState.domains.get(b.name).length);
    }
    
    varr = unassigned[0];
    varName = varr.name;
    searchState.currentVariable = varName; // Set as current
  }
  
  const domain = searchState.domains.get(varName);
  
  // Filter out already tried values for this variable
  const triedSet = searchState.triedValues.get(varName);
  const availableValues = domain.filter(v => !triedSet.has(v));
  
  // If current variable has no untried values left, need to backtrack to previous variable
  if(availableValues.length === 0){
    // Clear tried values for current variable since we're abandoning it
    searchState.triedValues.set(varName, new Set());
    
    // Clear current variable and lastBacktracked since we're exhausting this variable
    searchState.currentVariable = null;
    searchState.lastBacktracked = null;
    
    // Find last assigned variable to backtrack to
    const assignedVars = Array.from(searchState.assignment.keys());
    if(assignedVars.length === 0){
      return {failed: true}; // No solution exists
    }
    
    const backtrackVar = assignedVars[assignedVars.length - 1];
    const backtrackValue = searchState.assignment.get(backtrackVar);
    
    // Unassign the variable
    searchState.assignment.delete(backtrackVar);
    
    // Mark this value as tried for the backtrack variable
    searchState.triedValues.get(backtrackVar).add(backtrackValue);
    
    // Clear tried values for all OTHER unassigned variables EXCEPT the one we just abandoned
    // (they will be re-explored with the new assignment)
    for(const v of csp.variables){
      if(v.name !== backtrackVar && v.name !== varName && !searchState.assignment.has(v.name)){
        searchState.triedValues.set(v.name, new Set());
      }
    }
    
    // Reset domains for ALL unassigned variables to their original domains
    for(const variable of csp.variables){
      if(!searchState.assignment.has(variable.name)){
        const originalDomain = [...originalDomains.get(variable.name)];
        searchState.domains.set(variable.name, originalDomain);
        // Also update the CSP variable domain for display
        variable.domain = originalDomain;
      }
    }
    
    // Reapply domain pruning for all REMAINING assigned variables
    // Only do this for FC and AC3, NOT for plain backtracking
    if(inference === 'FC' || inference === 'AC3'){
      for(const [assignedVar, assignedVal] of searchState.assignment){
        const neighbors = csp.neighbors.get(assignedVar);
        for(const nb of neighbors){
          if(!searchState.assignment.has(nb)){
            const nbDomain = searchState.domains.get(nb);
            const filtered = nbDomain.filter(nbVal => {
              const cs = csp.constraintsBetween(assignedVar, nb);
              for(let c of cs){
                const va = (c.xi === assignedVar) ? assignedVal : nbVal;
                const vb = (c.xi === assignedVar) ? nbVal : assignedVal;
                if(!c.check(va, vb)) return false;
              }
              return true;
            });
            searchState.domains.set(nb, filtered);
            // Update CSP variable domain for display
            const variable = csp.variables.find(v => v.name === nb);
            if(variable){
              variable.domain = filtered;
            }
          }
        }
      }
    }
    
    // Filter backtrack variable's domain to exclude already tried values
    const backtrackDomain = searchState.domains.get(backtrackVar);
    const backtrackTried = searchState.triedValues.get(backtrackVar);
    const filteredBacktrack = backtrackDomain.filter(v => !backtrackTried.has(v));
    searchState.domains.set(backtrackVar, filteredBacktrack);
    
    // Update CSP variable domain for backtrack variable
    const backtrackVariable = csp.variables.find(v => v.name === backtrackVar);
    if(backtrackVariable){
      backtrackVariable.domain = filteredBacktrack;
    }
    
    // Update current domains display after backtracking and domain refresh
    renderCurrentDomains(csp);
    
    // Check if backtrack variable now has no untried values left
    if(filteredBacktrack.length === 0){
      log(`✗ ${backtrackVar} has no more untried values, need to backtrack further`);
      
      const backtrackSnapshot = {
        domains: cloneMapDeep(searchState.domains),
        assignment: cloneMap(searchState.assignment)
      };
      
      const backtrackDesc = `Exhausted ${backtrackVar} (all values tried), backtracking further`;
      updateStepDescription(backtrackDesc);
      addEvent('backtrack', {var: backtrackVar, value: backtrackValue, snapshot: backtrackSnapshot, description: backtrackDesc});
      csp.emit('unassign', {var: backtrackVar, assignment: searchState.assignment});
      
      updateStateDisplay(searchState.assignment);
      return {solved: false, failed: false};
    }
    
    const backtrackSnapshot = {
      domains: cloneMapDeep(searchState.domains),
      assignment: cloneMap(searchState.assignment)
    };
    
    const backtrackDesc = `Backtracked from ${backtrackVar} = ${backtrackValue} (${varName} has no valid values), trying next value`;
    updateStepDescription(backtrackDesc);
    addEvent('backtrack', {var: backtrackVar, value: backtrackValue, snapshot: backtrackSnapshot, description: backtrackDesc});
    csp.emit('unassign', {var: backtrackVar, assignment: searchState.assignment});
    
    // Mark that we should try the backtracked variable next
    searchState.lastBacktracked = backtrackVar;
    
    updateStateDisplay(searchState.assignment);
    return {solved: false, failed: false};
  }
  
  // Try next untried value
  const value = availableValues[0];
  
  // Mark this value as tried
  searchState.triedValues.get(varName).add(value);
  
  // Save snapshot before assignment
  const snapshot = {
    domains: cloneMapDeep(searchState.domains),
    assignment: cloneMap(searchState.assignment)
  };
  
  // Make assignment
  searchState.assignment.set(varName, value);
  searchState.domains.set(varName, [value]);
  
  const desc = `Assigned ${varName} = ${value} (selected from domain [${domain.join(', ')}])`;
  updateStepDescription(desc);
  csp.emit('assign', {var: varName, value, assignment: searchState.assignment, snapshot, description: desc});
  
  // Check consistency
  let consistent = true;
  let violatedNeighbor = null;
  for(let nb of csp.neighbors.get(varName)){
    if(searchState.assignment.has(nb)){
      const nbval = searchState.assignment.get(nb);
      const cs = csp.constraintsBetween(varName, nb);
      for(let c of cs){
        const va = (c.xi===varName) ? value : nbval;
        const vb = (c.xi===varName) ? nbval : value;
        if(!c.check(va, vb)){
          consistent = false;
          violatedNeighbor = nb;
          break;
        }
      }
    }
    if(!consistent) break;
  }
  
  if(!consistent){
    // Backtrack immediately - unassign and remove this value from assignment
    searchState.assignment.delete(varName);
    // Note: value is already marked as tried, so it won't be retried

    // Restore domains to state before the attempted assignment so remaining
    // domain values for this variable are still available to try.
    // We saved the pre-assignment domains in `snapshot` above.
    if(snapshot && snapshot.domains){
      searchState.domains = cloneMapDeep(snapshot.domains);
      // Update visible CSP variable domains for display
      for(const v of csp.variables){
        if(searchState.domains.has(v.name)) v.domain = Array.from(searchState.domains.get(v.name));
      }
    }

    // Create snapshot after backtrack
    const backtrackSnapshot = {
      domains: cloneMapDeep(searchState.domains),
      assignment: cloneMap(searchState.assignment)
    };

    const backtrackDesc = `Rejected ${varName} = ${value} (conflicts with ${violatedNeighbor}), trying next value`;
    updateStepDescription(backtrackDesc);
    addEvent('backtrack', {var: varName, value, snapshot: backtrackSnapshot, description: backtrackDesc});

    // Emit unassign to pop from stack display
    csp.emit('unassign', {var: varName, assignment: searchState.assignment});

    // Keep currentVariable set so we continue trying this variable on the next step
    return {solved: false, failed: false};
  }
  
  // Assignment is consistent
  let descMsg = `Assigned ${varName} = ${value} (selected from domain [${availableValues.join(', ')}])`;
  
  // Apply inference based on algorithm selection
  if(inference === 'FC' || inference === 'AC3'){
    // Forward checking: prune neighbor domains to avoid trying obviously invalid values
    const prunedDomains = [];
    
    for(let nb of csp.neighbors.get(varName)){
      if(searchState.assignment.has(nb)) continue;
      
      const nbDomain = searchState.domains.get(nb);
      const filtered = nbDomain.filter(nbVal => {
        const cs = csp.constraintsBetween(varName, nb);
        for(let c of cs){
          const va = (c.xi===varName) ? value : nbVal;
          const vb = (c.xi===varName) ? nbVal : value;
          if(!c.check(va, vb)) return false;
        }
        return true;
      });
      searchState.domains.set(nb, filtered);
      if(filtered.length < nbDomain.length){
        prunedDomains.push(`${nb}: [${filtered.join(', ')}]`);
        log(`Domain pruned: ${nb} = [${filtered.join(', ')}]`);
        // Update the CSP domain to reflect the pruning
        const variable = csp.variables.find(v => v.name === nb);
        if(variable){
          variable.domain = filtered;
        }
      }
    }
    
    // Update current domains display after pruning
    renderCurrentDomains(csp);
    
    // Update description to include pruned domains
    if(prunedDomains.length > 0){
      descMsg = `${descMsg} | Pruned: ${prunedDomains.join(', ')}`;
      updateStepDescription(descMsg);
      // Update the assignment event description as well
      if(eventHistory.length > 0){
        eventHistory[eventHistory.length - 1].data.description = descMsg;
      }
    }
  } else {
    // Plain backtracking - no domain pruning, just update step description
    updateStepDescription(descMsg);
  }
  
  // Apply additional inference if enabled (AC-3)
  if(inference === 'AC3'){
    // Initialize AC-3 queue with arcs from assigned variable
    const ac3Queue = [];
    for(let nb of csp.neighbors.get(varName)){
      if(!searchState.assignment.has(nb)){
        ac3Queue.push([nb, varName]);
      }
    }
    
    // Show queue in UI
    queuePanel.innerHTML = '';
    const queueHeader = document.createElement('div');
    queueHeader.textContent = 'AC-3 Propagation Queue';
    queueHeader.style.fontSize = '11px';
    queueHeader.style.color = 'var(--accent)';
    queueHeader.style.marginBottom = '4px';
    queuePanel.appendChild(queueHeader);
    
    for(let arc of ac3Queue){
      const queueItem = document.createElement('div');
      queueItem.className = 'queue-item';
      queueItem.textContent = `${arc[0]} ← ${arc[1]}`;
      queuePanel.appendChild(queueItem);
    }
    
    // Run AC-3 propagation
    while(ac3Queue.length > 0){
      const [xi, xj] = ac3Queue.shift();
      
      // Revise xi with respect to xj
      const xiDomain = searchState.domains.get(xi);
      const xjDomain = searchState.domains.get(xj);
      const toRemove = [];
      
      for(let a of xiDomain){
        let hasSupport = false;
        for(let b of xjDomain){
          const cs = csp.constraintsBetween(xi, xj);
          let allOk = true;
          for(let c of cs){
            const va = (c.xi === xi) ? a : b;
            const vb = (c.xi === xi) ? b : a;
            if(!c.check(va, vb)){
              allOk = false;
              break;
            }
          }
          if(allOk){
            hasSupport = true;
            break;
          }
        }
        if(!hasSupport) toRemove.push(a);
      }
      
      if(toRemove.length > 0){
        const newDomain = xiDomain.filter(v => !toRemove.includes(v));
        searchState.domains.set(xi, newDomain);
        
        // Update CSP variable domain
        const variable = csp.variables.find(v => v.name === xi);
        if(variable){
          variable.domain = newDomain;
        }
        
        log(`AC-3 revised ${xi}: [${newDomain.join(', ')}]`);
        
        // If domain becomes empty, this branch fails
        if(newDomain.length === 0){
          log(`AC-3 detected empty domain for ${xi}`);
          break;
        }
        
        // Add neighbors of xi to queue (except xj)
        for(let xk of csp.neighbors.get(xi)){
          if(xk !== xj && !searchState.assignment.has(xk)){
            ac3Queue.push([xk, xi]);
          }
        }
        
        // Update queue display
        queuePanel.innerHTML = '';
        queuePanel.appendChild(queueHeader);
        for(let arc of ac3Queue){
          const queueItem = document.createElement('div');
          queueItem.className = 'queue-item';
          queueItem.textContent = `${arc[0]} ← ${arc[1]}`;
          queuePanel.appendChild(queueItem);
        }
      }
    }
    
    renderCurrentDomains(csp);
  }
  
  updateStateDisplay(searchState.assignment);
  return {solved: false, failed: false};
}

function cloneMap(m){ 
  const mm = new Map(); 
  for(const [k,v] of m) mm.set(k,v); 
  return mm; 
}

function cloneMapDeep(m){ 
  const mm = new Map(); 
  for(const [k,v] of m) mm.set(k, Array.isArray(v) ? Array.from(v) : v); 
  return mm; 
}

function updateStateDisplay(assignment = null){
  if(!stateDisplay) return;
  
  const currentAssignment = assignment || (searchState ? searchState.assignment : new Map());
  
  if(currentAssignment.size === 0){
    stateDisplay.textContent = 'No assignments yet';
    stateDisplay.style.color = '#9aa6b2';
  } else {
    const pairs = Array.from(currentAssignment).map(([k,v]) => `${k}=${v}`).join(', ');
    stateDisplay.textContent = pairs;
    stateDisplay.style.color = 'var(--accent)';
  }
}

function updateStepDescription(description){
  if(!stepDescText) return;
  stepDescText.textContent = description;
}

async function stepForward(){
  if(running) return;
  running = true;
  updateStatus('Stepping...');
  
  if(!searchState || searchState.finished){
    // Initialize or reset search state
    searchState = {
      domains: csp.copyDomains(),
      assignment: new Map(),
      triedValues: new Map(), // Track which values have been tried for each variable at each level
      varIndex: 0,
      valueIndex: 0,
      finished: false,
      lastBacktracked: null,  // Track last backtracked variable
      currentVariable: null   // Track which variable we're currently trying to assign
    };
    // Initialize triedValues for all variables
    for(const v of csp.variables){
      searchState.triedValues.set(v.name, new Set());
    }
    updateStepDescription('Starting new search');
  }
  
  // Perform one step
  const result = await performSingleStep();
  
  if(result.solved){
    updateStatus('Solved ✓');
    searchState.finished = true;
    log('✓ Solution found: ' + Array.from(searchState.assignment).map(([k,v])=>k+'='+v).join(', '));
    updateStepDescription('✓ Solution found!');
  } else if(result.failed){
    updateStatus('No solution');
    searchState.finished = true;
    log('✗ No solution exists');
    updateStepDescription('✗ No solution exists');
  } else {
    updateStatus('Stepped');
  }
  
  renderCurrentDomains(csp);
  running = false;
}

async function runAll(){ 
  if(running) return;
  running = true; 
  paused = false; 
  updateStatus('Running...');
  
  // Initialize search state if needed
  if(!searchState || searchState.finished){
    searchState = {
      domains: csp.copyDomains(),
      assignment: new Map(),
      triedValues: new Map(), // Track which values have been tried for each variable
      varIndex: 0,
      valueIndex: 0,
      finished: false,
      lastBacktracked: null  // Track last backtracked variable
    };
    // Initialize triedValues for all variables
    for(const v of csp.variables){
      searchState.triedValues.set(v.name, new Set());
    }
  }
  
  // Run steps until solved or failed
  let result;
  while(!paused && !searchState.finished){
    result = await performSingleStep();
    
    if(result.solved){
      updateStatus('Solved ✓');
      searchState.finished = true;
      log('✓ Solution found: ' + Array.from(searchState.assignment).map(([k,v])=>k+'='+v).join(', '));
      updateStepDescription('✓ Solution found!');
      break;
    } else if(result.failed){
      updateStatus('No solution');
      searchState.finished = true;
      log('✗ No solution exists');
      updateStepDescription('✗ No solution exists');
      break;
    }
    
    renderCurrentDomains(csp);
    await new Promise(resolve => setTimeout(resolve, speed));
  }
  
  if(paused){
    updateStatus('Paused');
  }
  
  running = false;
}

function updatePuzzleInfo(){
  if(csp && csp.metadata){
    puzzleInfo.innerHTML = `<strong>${csp.metadata.name}</strong> — ${csp.metadata.description}`;
  }
}

function updateStatus(msg){
  statusInfo.textContent = msg;
}

function populateInspectorVars(){
  inspectorVar.innerHTML = '<option value="">Select variable...</option>';
  if(csp){
    csp.variables.forEach(v => {
      const opt = document.createElement('option');
      opt.value = v.name;
      opt.textContent = v.name;
      inspectorVar.appendChild(opt);
    });
  }
}

function updateInspector(){
  const varName = inspectorVar.value;
  if(!varName || !csp) { inspectorContent.innerHTML = ''; return; }
  
  const v = csp.variables.find(x => x.name === varName);
  if(!v) return;
  
  const neighbors = Array.from(csp.neighbors.get(varName));
  const constraints = csp.constraints.filter(c => c.xi === varName || c.xj === varName);
  
  inspectorContent.innerHTML = `
    <div class="inspector-row"><strong>Domain:</strong> [${v.domain.join(', ')}]</div>
    <div class="inspector-row"><strong>Neighbors:</strong> ${neighbors.join(', ')}</div>
    <div class="inspector-row"><strong>Constraints:</strong></div>
    ${constraints.map(c => `<div class="constraint-detail">${c.xi} ${c.label} ${c.xj}</div>`).join('')}
  `;
}


function renderLayout(csp){
  canvas.innerHTML='';
  // use positions from variables if available, else circle layout
  const n = csp.variables.length; const cx=400, cy=300, r=200;
  const positions = new Map();
  
  csp.variables.forEach((v,i)=>{
    if(v.position){
      positions.set(v.name, v.position);
    } else {
      const a = (i/n)*Math.PI*2 - Math.PI/2;
      const x = cx + Math.cos(a)*r; const y = cy + Math.sin(a)*r;
      positions.set(v.name, {x,y});
    }
  });
  
  // draw edges
  for(const con of csp.constraints){
    const p1 = positions.get(con.xi); const p2 = positions.get(con.xj);
    const line = svg('line', {x1:p1.x, y1:p1.y, x2:p2.x, y2:p2.y, class:'edge', 'data-a':con.xi, 'data-b':con.xj});
    canvas.appendChild(line);
  }
  
  // draw nodes
  for(const v of csp.variables){
    const p = positions.get(v.name);
    const g = svg('g', {transform:`translate(${p.x},${p.y})`, id:`node-${v.name}`});
    const circle = svg('circle', {r:28, cx:0, cy:0, class:'node fill'});
    const label = svg('text', {x:0, y:0, class:'label'}); label.textContent = v.name;
    g.appendChild(circle); g.appendChild(label);
    canvas.appendChild(g);
  }
}

function renderDomains(csp){
  domainsPanel.innerHTML='';
  
  // Add edit toggle button
  const toolbar = document.createElement('div');
  toolbar.style.marginBottom = '8px';
  toolbar.style.display = 'flex';
  toolbar.style.justifyContent = 'space-between';
  toolbar.style.alignItems = 'center';
  
  const editBtn = document.createElement('button');
  editBtn.textContent = editMode ? '✓ Done' : '✏️ Edit Domains';
  editBtn.style.fontSize = '11px';
  editBtn.style.padding = '4px 8px';
  editBtn.addEventListener('click', () => {
    editMode = !editMode;
    renderDomains(csp);
  });
  toolbar.appendChild(editBtn);
  domainsPanel.appendChild(toolbar);
  
  for(const v of csp.variables){
    const el = document.createElement('div'); el.className='var';
    const title = document.createElement('div'); 
    title.textContent = v.name; 
    title.style.width='50px'; 
    title.style.fontWeight='bold';
    el.appendChild(title);
    
    if(editMode){
      // Edit mode: show input for domain
      const input = document.createElement('input');
      input.type = 'text';
      input.value = v.domain.join(', ');
      input.style.flex = '1';
      input.style.padding = '4px';
      input.style.fontSize = '12px';
      input.addEventListener('change', (e) => {
        const newDomain = e.target.value.split(',').map(s => s.trim()).filter(s => s);
        // Try to parse as numbers if possible
        const parsedDomain = newDomain.map(val => {
          const num = Number(val);
          return isNaN(num) ? val : num;
        });
        v.domain = parsedDomain;
        // Update originalDomains map so the change persists
        originalDomains.set(v.name, [...parsedDomain]);
        log(`Domain updated: ${v.name} = [${parsedDomain.join(', ')}]`);
        // Re-render both panels to show the change
        renderDomains(csp);
        renderCurrentDomains(csp);
      });
      el.appendChild(input);
    } else {
      // Display mode: show chips
      const chips = document.createElement('div'); 
      chips.style.display='flex'; 
      chips.style.gap='4px'; 
      chips.style.flexWrap='wrap';
      for(const d of v.domain){
        const c = document.createElement('span'); 
        c.className='chip domain-chip'; 
        c.textContent = d; 
        chips.appendChild(c);
      }
      el.appendChild(chips);
    }
    domainsPanel.appendChild(el);
  }
}

function renderCurrentDomains(csp){
  currentDomainsPanel.innerHTML='';
  
  for(const v of csp.variables){
    const el = document.createElement('div'); 
    el.className='var';
    
    const title = document.createElement('div'); 
    title.textContent = v.name; 
    title.style.width='50px'; 
    title.style.fontWeight='bold';
    
    // Check if variable is assigned
    const isAssigned = searchState && searchState.assignment && searchState.assignment.has(v.name);
    
    if(isAssigned){
      title.style.color = 'var(--success)';
      const assignedValue = searchState.assignment.get(v.name);
      title.textContent += ` ✓`;
      
      el.appendChild(title);
      
      const valueDisplay = document.createElement('div');
      valueDisplay.style.color = 'var(--success)';
      valueDisplay.style.fontWeight = 'bold';
      valueDisplay.textContent = `= ${assignedValue}`;
      el.appendChild(valueDisplay);
    } else {
      el.appendChild(title);
      
      const chips = document.createElement('div'); 
      chips.style.display='flex'; 
      chips.style.gap='4px'; 
      chips.style.flexWrap='wrap';
      
      for(const d of v.domain){
        const c = document.createElement('span'); 
        c.className='chip domain-chip'; 
        c.textContent = d; 
        chips.appendChild(c);
      }
      el.appendChild(chips);
    }
    
    currentDomainsPanel.appendChild(el);
  }
}

function addQueue(q){ 
  queuePanel.innerHTML=''; 
  for(const arc of q){ 
    const d = document.createElement('div'); 
    d.textContent = `${arc[0]} → ${arc[1]}`; 
    d.className = 'queue-item';
    queuePanel.appendChild(d); 
  } 
}

function pushStack(s){ 
  const d = document.createElement('div'); 
  d.textContent = s; 
  d.className = 'stack-item';
  stackPanel.prepend(d); 
}

function popStack(){ 
  if(stackPanel.firstChild) stackPanel.removeChild(stackPanel.firstChild); 
}

function highlightEdge(a,b,cls){ 
  const edges = canvas.querySelectorAll('.edge'); 
  edges.forEach(e=>{
    e.classList.remove('queued');
    if((e.dataset.a===a && e.dataset.b===b)||(e.dataset.a===b && e.dataset.b===a)) {
      e.classList.add('queued'); 
      setTimeout(()=>e.classList.remove('queued'), speed);
    }
  }); 
}

function highlightNode(name, cls){ 
  const node = document.getElementById('node-'+name); 
  if(node) {
    const circle = node.querySelector('circle');
    circle.classList.add(cls); 
    if(cls !== 'assigned') setTimeout(()=>circle.classList.remove(cls), speed);
  }
}

function removeHighlight(name){ 
  const node = document.getElementById('node-'+name); 
  if(node) {
    node.querySelector('circle').classList.remove('assigned','revised');
  }
}

function svg(tag, attrs={}){ 
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag); 
  for(const k in attrs) el.setAttribute(k, attrs[k]); 
  return el; 
}

// initialize on load
init();
