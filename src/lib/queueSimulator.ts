// Queue Simulation Engine with Cumulative Probability Approach

export type DistributionType = 'poisson' | 'exponential' | 'normal' | 'uniform';
export type ProcessType = 'M' | 'G';

export interface DistributionParams {
  type: DistributionType;
  rate?: number;      // For Poisson/Exponential (lambda/mu)
  mean?: number;      // For Normal
  stdDev?: number;    // For Normal
  a?: number;         // For Uniform (min)
  b?: number;         // For Uniform (max)
}

export interface SimulationParams {
  arrivalProcess: ProcessType;
  serviceProcess: ProcessType;
  arrivalParams: DistributionParams;
  serviceParams: DistributionParams;
  numServers: number;
  enablePriority: boolean;
  priorityLevels: number;
}

export interface CustomerRecord {
  id: number;
  randomNum: number;     // Random number generated for this customer
  cp: number;            // Cumulative Probability range the random fell into
  interArrival: number;
  arrivalTime: number;
  priority: number;
  serviceTime: number;
  serviceRandomNum: number; // Random number used for service time
  startTime: number;
  endTime: number;
  turnAround: number;
  waitTime: number;
  responseTime: number;
  serverId: number;
}

export interface ServerRecord {
  id: number;
  busyTime: number;
  utilization: number;
  tasks: { customerId: number; start: number; end: number; priority: number }[];
}

export interface PriorityStats {
  priority: number;
  avgWait: number;
  avgResponse: number;
  avgInterArrival: number;
  avgTurnAround: number;
}

export interface CPTableEntry {
  x: number;
  prob: number;
  cp: number;
}

export interface SimulationResult {
  customers: CustomerRecord[];
  servers: ServerRecord[];
  priorityStats: PriorityStats[];
  queueLengthOverTime: { time: number; queueLength: number }[];
  serverUtilizationOverTime: { time: number; utilization: number }[];
  averages: {
    interArrival: number;
    serviceTime: number;
    turnAround: number;
    waitTime: number;
    responseTime: number;
  };
  totalArrivals: number;
  totalServed: number;
  cpTable: CPTableEntry[]; // The CP lookup table used for arrival
}

// Factorial function
function factorial(n: number): number {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

// Generate Poisson probability distribution table with CP values
// P(X=x) = (e^-λ * λ^x) / x! 
// Returns array of {x, probability, cumulativeProbability}

function generatePoissonCPTable(lambda: number): CPTableEntry[] {
  const table: CPTableEntry[] = [];
  let cumulativeProb = 0;
  let k = 0;
  
  // Poisson PMF: P(X=k) = (e^-λ * λ^k) / k!
  // CDF/CP: Sum of PMF from 0 to k
  const expNegLambda = Math.exp(-lambda);
  
  while (cumulativeProb <= 1 && k < 50) {
    // Calculate PMF for this k
    const pmf = (expNegLambda * Math.pow(lambda, k)) / factorial(k);
    cumulativeProb += pmf;
    
    table.push({ 
      x: k, 
      prob: Math.round(pmf * 10000) / 10000, 
      cp: Math.round(cumulativeProb * 10000) / 10000 
    });
    k++;

   const CP = Math.round(cumulativeProb *10000 ) /10000
   if (CP === 1) {
    break
   }

  }
 
  // Debug log to verify values
  console.log(`CP Table for λ=${lambda}:`, table.map(e => `k=${e.x}: PMF=${e.prob}, CP=${e.cp}`));
  
  return table;
}

// Lookup inter-arrival time from CP table using random number
function lookupFromCPTable(table: CPTableEntry[], randomNum: number): { value: number; cp: number } {
  for (let i = 0; i < table.length; i++) {
    if (randomNum <= table[i].cp) {
      return { value: table[i].x, cp: table[i].cp };
    }
  }
  return { value: table[table.length - 1].x, cp: 1 };
}

// Random number from Poisson distribution (for actual customer generation)
function poissonRandom(lambda: number): number {
  let L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  
  return k - 1;
}

// Standard Normal Z-Table (area/probability -> Z value)
// This table maps cumulative probability (R) to Z-score
const Z_TABLE: { prob: number; z: number }[] = [
  { prob: 0.0001, z: -3.72 }, { prob: 0.0005, z: -3.29 }, { prob: 0.001, z: -3.09 },
  { prob: 0.005, z: -2.58 }, { prob: 0.01, z: -2.33 }, { prob: 0.02, z: -2.05 },
  { prob: 0.025, z: -1.96 }, { prob: 0.03, z: -1.88 }, { prob: 0.04, z: -1.75 },
  { prob: 0.05, z: -1.645 }, { prob: 0.06, z: -1.555 }, { prob: 0.07, z: -1.48 },
  { prob: 0.08, z: -1.41 }, { prob: 0.09, z: -1.34 }, { prob: 0.10, z: -1.28 },
  { prob: 0.15, z: -1.04 }, { prob: 0.20, z: -0.84 }, { prob: 0.25, z: -0.67 },
  { prob: 0.30, z: -0.52 }, { prob: 0.35, z: -0.39 }, { prob: 0.40, z: -0.25 },
  { prob: 0.45, z: -0.13 }, { prob: 0.50, z: 0.00 }, { prob: 0.55, z: 0.13 },
  { prob: 0.60, z: 0.25 }, { prob: 0.65, z: 0.39 }, { prob: 0.70, z: 0.52 },
  { prob: 0.75, z: 0.67 }, { prob: 0.80, z: 0.84 }, { prob: 0.85, z: 1.04 },
  { prob: 0.90, z: 1.28 }, { prob: 0.91, z: 1.34 }, { prob: 0.92, z: 1.41 },
  { prob: 0.93, z: 1.48 }, { prob: 0.94, z: 1.555 }, { prob: 0.95, z: 1.645 },
  { prob: 0.96, z: 1.75 }, { prob: 0.97, z: 1.88 }, { prob: 0.975, z: 1.96 },
  { prob: 0.98, z: 2.05 }, { prob: 0.99, z: 2.33 }, { prob: 0.995, z: 2.58 },
  { prob: 0.999, z: 3.09 }, { prob: 0.9995, z: 3.29 }, { prob: 0.9999, z: 3.72 }
];

// Lookup Z value from Standard Normal Table using random number R
function lookupZFromTable(R: number): number {
  // Find the two entries R falls between and interpolate
  for (let i = 0; i < Z_TABLE.length - 1; i++) {
    if (R <= Z_TABLE[i].prob) {
      return Z_TABLE[i].z;
    }
    if (R > Z_TABLE[i].prob && R <= Z_TABLE[i + 1].prob) {
      // Linear interpolation between the two Z values
      const ratio = (R - Z_TABLE[i].prob) / (Z_TABLE[i + 1].prob - Z_TABLE[i].prob);
      return Z_TABLE[i].z + ratio * (Z_TABLE[i + 1].z - Z_TABLE[i].z);
    }
  }
  return Z_TABLE[Z_TABLE.length - 1].z;
}

// Random number generators for different distributions
function exponentialRandom(rate: number): number {
  return -Math.log(1 - Math.random()) / rate;
}

// Normal distribution using Z-table lookup
// Formula: Interarrival Time = μ + (Z × σ)
// Z is looked up from Standard Normal Table based on random number R
function normalRandom(mean: number, stdDev: number): number {
  const R = Math.random();
  const Z = lookupZFromTable(R);
  return Math.max(0.01, mean + Z * stdDev);
}

function uniformRandom(a: number, b: number): number {
  return a + Math.random() * (b - a);
}

function getRandomValue(params: DistributionParams): number {
  switch (params.type) {
    case 'poisson':
      return poissonRandom(params.rate || 1);
    case 'exponential':
      return exponentialRandom(params.rate || 1);
    case 'normal':
      return normalRandom(params.mean || 1, params.stdDev || 0.2);
    case 'uniform':
      return uniformRandom(params.a || 0.5, params.b || 1.5);
    default:
      return exponentialRandom(params.rate || 1);
  }
}

// Get service time based on distribution - rounded to nearest integer
// For exponential: service time = -μ * ln(R) where μ is the mean service time (user input)
function getServiceTime(params: DistributionParams): { time: number; randomNum: number } {
  let time: number;
  const R = Math.random();
  
  switch (params.type) {
    case 'poisson':
    case 'exponential':
      // Formula: -μ * ln(R) where μ is mean service time (rate param is actually μ)
      const mu = params.rate || 1;
      time = -mu * Math.log(R);
      break;
    case 'normal':
      time = normalRandom(params.mean || 1, params.stdDev || 0.2);
      break;
    case 'uniform':
      time = uniformRandom(params.a || 0.5, params.b || 1.5);
      break;
    default:
      const defaultMu = params.rate || 1;
      time = -defaultMu * Math.log(R);
  }
  // Round to nearest integer to avoid huge decimals in Gantt chart
  return { time: Math.max(1, Math.round(time)), randomNum: Math.round(R * 10000) / 10000 };
}

interface QueuedCustomer {
  id: number;
  arrivalTime: number;
  serviceTime: number;
  remainingServiceTime: number; // For preemption
  serviceRandomNum: number;
  priority: number;
  interArrival: number;
  randomNum: number;
  cp: number;
  firstStartTime?: number; // Track when service first started
}

interface ServerState {
  id: number;
  busy: boolean;
  busyUntil: number;
  customer: QueuedCustomer | null;
  totalBusyTime: number;
  tasks: { customerId: number; start: number; end: number; priority: number }[];
}

export function runSimulation(params: SimulationParams): SimulationResult {
  const {
    arrivalParams,
    serviceParams,
    numServers,
    enablePriority,
    priorityLevels
  } = params;

  // Generate CP table for arrival distribution
  const arrivalCPTable = (arrivalParams.type === 'poisson' || arrivalParams.type === 'exponential')
    ? generatePoissonCPTable(arrivalParams.rate || 1)
    : [];
  
  // Number of customers = number of rows in CP table (until CP hits ~1)
  const numCustomers = arrivalCPTable.length > 0 
    ? arrivalCPTable.length 
    : (arrivalParams.type === 'uniform' 
        ? Math.ceil(((arrivalParams.b || 5) - (arrivalParams.a || 1)) + 1) 
        : Math.ceil(arrivalParams.mean || 10));

  const queue: QueuedCustomer[] = [];
  const servers: ServerState[] = Array.from({ length: numServers }, (_, i) => ({
    id: i + 1,
    busy: false,
    busyUntil: 0,
    customer: null,
    totalBusyTime: 0,
    tasks: []
  }));

  const customers: CustomerRecord[] = [];
  const queueLengthOverTime: { time: number; queueLength: number }[] = [];
  const serverUtilizationOverTime: { time: number; utilization: number }[] = [];

  // Generate all customers with their inter-arrival times based on CP lookup
  const allCustomers: QueuedCustomer[] = [];
  let currentArrivalTime = 0;
  
  for (let i = 0; i < numCustomers; i++) {
    let interArrival: number;
    let cp: number;
    let randomNum: number;
    
    if (i === 0) {
      interArrival = 0;
      cp = arrivalCPTable.length > 0 ? arrivalCPTable[0].cp : 0;
      randomNum = 0;
    } else {
      randomNum = Math.round(Math.random() * 10000) / 10000;
      
      if (arrivalCPTable.length > 0) {
        const lookup = lookupFromCPTable(arrivalCPTable, randomNum);
        interArrival = lookup.value;
        cp = lookup.cp;
      } else {
        interArrival = Math.round(getRandomValue(arrivalParams));
        cp = randomNum;
      }
    }
    
    currentArrivalTime += interArrival;
    const priority = enablePriority ? Math.floor(Math.random() * priorityLevels) + 1 : 1;
    const serviceResult = getServiceTime(serviceParams);
    
    allCustomers.push({
      id: i + 1,
      arrivalTime: currentArrivalTime,
      serviceTime: serviceResult.time,
      remainingServiceTime: serviceResult.time,
      serviceRandomNum: serviceResult.randomNum,
      priority,
      interArrival,
      randomNum,
      cp
    });
  }

  // Track completed customers for final record creation
  const completedCustomers: Map<number, { customer: QueuedCustomer; waitTime: number; responseTime: number; endTime: number; serverId: number }> = new Map();

  // Process customers through the simulation
  let customerIndex = 0;
  let currentTime = 0;

  while (customerIndex < allCustomers.length || queue.length > 0 || servers.some(s => s.busy)) {
    // Find next event
    let nextEventTime = Infinity;
    let nextEventType: 'arrival' | 'departure' = 'arrival';
    let departingServerIndex = -1;

    if (customerIndex < allCustomers.length) {
      nextEventTime = allCustomers[customerIndex].arrivalTime;
    }

    for (let i = 0; i < servers.length; i++) {
      if (servers[i].busy && servers[i].busyUntil < nextEventTime) {
        nextEventTime = servers[i].busyUntil;
        nextEventType = 'departure';
        departingServerIndex = i;
      }
    }

    if (nextEventTime === Infinity) break;

    currentTime = nextEventTime;

    queueLengthOverTime.push({
      time: Math.round(currentTime * 100) / 100,
      queueLength: queue.length
    });

    const busyServers = servers.filter(s => s.busy).length;
    serverUtilizationOverTime.push({
      time: Math.round(currentTime * 100) / 100,
      utilization: Math.round((busyServers / numServers) * 100)
    });

    if (nextEventType === 'arrival' && customerIndex < allCustomers.length) {
      const customer = allCustomers[customerIndex];
      customerIndex++;

      const freeServerIndex = servers.findIndex(s => !s.busy);
      
      if (freeServerIndex !== -1) {
        // Start service immediately
        const server = servers[freeServerIndex];
        const startTime = currentTime;
        const endTime = currentTime + customer.remainingServiceTime;
        
        customer.firstStartTime = startTime;
        server.busy = true;
        server.busyUntil = endTime;
        server.customer = customer;
        server.totalBusyTime += customer.remainingServiceTime;
        server.tasks.push({
          customerId: customer.id,
          start: Math.round(startTime * 100) / 100,
          end: Math.round(endTime * 100) / 100,
          priority: customer.priority
        });
      } else if (enablePriority) {
        // Preemptive priority: Check if we can preempt a lower priority customer
        let lowestPriorityServerIndex = -1;
        let lowestPriority = customer.priority;
        
        for (let i = 0; i < servers.length; i++) {
          if (servers[i].busy && servers[i].customer && servers[i].customer!.priority > lowestPriority) {
            lowestPriority = servers[i].customer!.priority;
            lowestPriorityServerIndex = i;
          }
        }
        
        if (lowestPriorityServerIndex !== -1) {
          // Preempt the lower priority customer
          const server = servers[lowestPriorityServerIndex];
          const preemptedCustomer = server.customer!;
          
          // Calculate remaining service time for preempted customer
          const timeServed = currentTime - (server.tasks[server.tasks.length - 1]?.start || currentTime);
          preemptedCustomer.remainingServiceTime = Math.max(1, Math.round((preemptedCustomer.remainingServiceTime - timeServed) * 100) / 100);
          
          // Update the last task's end time to current time (partial service)
          if (server.tasks.length > 0) {
            server.tasks[server.tasks.length - 1].end = Math.round(currentTime * 100) / 100;
          }
          
          // Add preempted customer back to queue (with priority ordering)
          const insertIndex = queue.findIndex(q => q.priority > preemptedCustomer.priority);
          if (insertIndex === -1) {
            queue.push(preemptedCustomer);
          } else {
            queue.splice(insertIndex, 0, preemptedCustomer);
          }
          
          // Start new higher priority customer
          const startTime = currentTime;
          const endTime = currentTime + customer.remainingServiceTime;
          
          customer.firstStartTime = startTime;
          server.busy = true;
          server.busyUntil = endTime;
          server.customer = customer;
          server.totalBusyTime += customer.remainingServiceTime;
          server.tasks.push({
            customerId: customer.id,
            start: Math.round(startTime * 100) / 100,
            end: Math.round(endTime * 100) / 100,
            priority: customer.priority
          });
        } else {
          // No preemption possible, add to queue
          const insertIndex = queue.findIndex(q => q.priority > customer.priority);
          if (insertIndex === -1) {
            queue.push(customer);
          } else {
            queue.splice(insertIndex, 0, customer);
          }
        }
      } else {
        queue.push(customer);
      }
    } else if (nextEventType === 'departure' && departingServerIndex !== -1) {
      const server = servers[departingServerIndex];
      const finishedCustomer = server.customer!;
      
      // Record completed customer
      const waitTime = Math.round(((finishedCustomer.firstStartTime || currentTime) - finishedCustomer.arrivalTime) * 100) / 100;
      const endTime = currentTime;
      
      completedCustomers.set(finishedCustomer.id, {
        customer: finishedCustomer,
        waitTime: waitTime,
        responseTime: waitTime,
        endTime: endTime,
        serverId: server.id
      });
      
      server.busy = false;
      server.customer = null;

      if (queue.length > 0) {
        const nextCustomer = queue.shift()!;
        const startTime = currentTime;
        const endTime = currentTime + nextCustomer.remainingServiceTime;
        
        if (!nextCustomer.firstStartTime) {
          nextCustomer.firstStartTime = startTime;
        }
        
        server.busy = true;
        server.busyUntil = endTime;
        server.customer = nextCustomer;
        server.totalBusyTime += nextCustomer.remainingServiceTime;
        server.tasks.push({
          customerId: nextCustomer.id,
          start: Math.round(startTime * 100) / 100,
          end: Math.round(endTime * 100) / 100,
          priority: nextCustomer.priority
        });
      }
    }
  }

  // Build final customer records from completed customers
  for (const [id, data] of completedCustomers) {
    const c = data.customer;
    customers.push({
      id: c.id,
      randomNum: c.randomNum,
      cp: c.cp,
      interArrival: c.interArrival,
      arrivalTime: c.arrivalTime,
      priority: c.priority,
      serviceTime: c.serviceTime,
      serviceRandomNum: c.serviceRandomNum,
      startTime: c.firstStartTime || c.arrivalTime,
      endTime: data.endTime,
      turnAround: Math.round((data.endTime - c.arrivalTime) * 100) / 100,
      waitTime: data.waitTime,
      responseTime: data.responseTime,
      serverId: data.serverId
    });
  }

  // Sort customers by ID
  customers.sort((a, b) => a.id - b.id);

  // Find max time
  const maxTime = customers.length > 0 
    ? Math.max(...customers.map(c => c.endTime)) 
    : 1;

  // Calculate actual busy time for each server first
  const serverBusyTimes = servers.map(s => 
    s.tasks.reduce((sum, task) => sum + (task.end - task.start), 0)
  );
  const totalBusyTime = serverBusyTimes.reduce((sum, time) => sum + time, 0);

  // Calculate server records - utilization as share of total work (sums to 100%)
  const serverRecords: ServerRecord[] = servers.map((s, idx) => {
    const actualBusyTime = serverBusyTimes[idx];
    return {
      id: s.id,
      busyTime: Math.round(actualBusyTime * 100) / 100,
      utilization: totalBusyTime > 0 
        ? Math.round((actualBusyTime / totalBusyTime) * 10000) / 100 
        : 0,
      tasks: s.tasks
    };
  });

  // Calculate priority stats
  const priorityStats: PriorityStats[] = [];
  for (let p = 1; p <= (enablePriority ? priorityLevels : 1); p++) {
    const priorityCustomers = customers.filter(c => c.priority === p);
    if (priorityCustomers.length > 0) {
      priorityStats.push({
        priority: p,
        avgWait: Math.round(priorityCustomers.reduce((sum, c) => sum + c.waitTime, 0) / priorityCustomers.length * 100) / 100,
        avgResponse: Math.round(priorityCustomers.reduce((sum, c) => sum + c.responseTime, 0) / priorityCustomers.length * 100) / 100,
        avgInterArrival: Math.round(priorityCustomers.reduce((sum, c) => sum + c.interArrival, 0) / priorityCustomers.length * 100) / 100,
        avgTurnAround: Math.round(priorityCustomers.reduce((sum, c) => sum + c.turnAround, 0) / priorityCustomers.length * 100) / 100
      });
    }
  }

  // Calculate averages
  const totalCustomers = customers.length;
  const averages = totalCustomers > 0 ? {
    interArrival: Math.round(customers.reduce((sum, c) => sum + c.interArrival, 0) / totalCustomers * 100) / 100,
    serviceTime: Math.round(customers.reduce((sum, c) => sum + c.serviceTime, 0) / totalCustomers * 100) / 100,
    turnAround: Math.round(customers.reduce((sum, c) => sum + c.turnAround, 0) / totalCustomers * 100) / 100,
    waitTime: Math.round(customers.reduce((sum, c) => sum + c.waitTime, 0) / totalCustomers * 100) / 100,
    responseTime: Math.round(customers.reduce((sum, c) => sum + c.responseTime, 0) / totalCustomers * 100) / 100
  } : {
    interArrival: 0,
    serviceTime: 0,
    turnAround: 0,
    waitTime: 0,
    responseTime: 0
  };

  return {
    customers,
    servers: serverRecords,
    priorityStats,
    queueLengthOverTime,
    serverUtilizationOverTime,
    averages,
    totalArrivals: numCustomers,
    totalServed: customers.length,
    cpTable: arrivalCPTable
  };
}

// Theoretical calculations for M/M/c queue
export function calculateMMcMetrics(lambda: number, mu: number, c: number) {
  const rho = lambda / (c * mu);
  
  if (rho >= 1) {
    return { rho, stable: false, Lq: Infinity, L: Infinity, Wq: Infinity, W: Infinity, P0: 0 };
  }

  let sum = 0;
  for (let n = 0; n < c; n++) {
    sum += Math.pow(lambda / mu, n) / factorial(n);
  }
  const lastTerm = Math.pow(lambda / mu, c) / (factorial(c) * (1 - rho));
  const P0 = 1 / (sum + lastTerm);
  const Lq = (P0 * Math.pow(lambda / mu, c) * rho) / (factorial(c) * Math.pow(1 - rho, 2));
  const L = Lq + lambda / mu;
  const W = L / lambda;
  const Wq = Lq / lambda;

  return {
    rho: Number(rho.toFixed(4)),      // Result: 0.3125
    stable: true,
    Lq: Number(Lq.toFixed(4)),        // Result: 0.0676
    L: Number(L.toFixed(4)),          // Result: 0.6926
    Wq: Number(Wq.toFixed(4)),        // Result: 0.0135
    W: Number(W.toFixed(4)),          // Result: 0.1385
    P0: Number(P0.toFixed(4))
  };
}