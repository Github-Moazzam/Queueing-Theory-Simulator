# Queue Simulation System - Complete Documentation for Python Implementation

This document contains all formulas, algorithms, and logic used in the queue simulation system.
Use this as a reference to reimplement in Python with PyQt/Tkinter and create a .exe using PyInstaller.

---

## Table of Contents
1. [Data Structures](#data-structures)
2. [Distribution Formulas](#distribution-formulas)
3. [CP Table Generation (Poisson)](#cp-table-generation-poisson)
4. [Z-Table Lookup (Normal Distribution)](#z-table-lookup-normal-distribution)
5. [Inter-Arrival Time Calculation](#inter-arrival-time-calculation)
6. [Service Time Calculation](#service-time-calculation)
7. [Simulation Engine Logic](#simulation-engine-logic)
8. [Priority Queue with Preemption](#priority-queue-with-preemption)
9. [Performance Metrics](#performance-metrics)
10. [M/M/c Theoretical Calculations](#mmc-theoretical-calculations)
11. [Python Implementation Guide](#python-implementation-guide)

---

## Data Structures

### Customer Record
```python
@dataclass
class CustomerRecord:
    id: int
    random_num: float          # Random number R generated for this customer
    cp: float                  # Cumulative Probability value
    inter_arrival: float       # Time between this and previous customer
    arrival_time: float        # Absolute arrival time
    priority: int              # Priority level (1 = highest)
    service_time: float        # Time needed for service
    service_random_num: float  # Random number used for service time
    start_time: float          # When service started
    end_time: float            # When service completed
    turn_around: float         # end_time - arrival_time
    wait_time: float           # start_time - arrival_time
    response_time: float       # Same as wait_time (first response)
    server_id: int             # Which server processed this customer
```

### Server Record
```python
@dataclass
class ServerRecord:
    id: int
    busy_time: float
    utilization: float         # Percentage of total work done
    tasks: List[Dict]          # [{customer_id, start, end, priority}]
```

### CP Table Entry
```python
@dataclass
class CPTableEntry:
    x: int           # Value (e.g., inter-arrival time)
    prob: float      # P(X=x) - Probability mass function
    cp: float        # Cumulative probability up to this x
```

---

## Distribution Formulas

### 1. Poisson Distribution (for discrete inter-arrival times)

**Probability Mass Function (PMF):**
```
P(X = k) = (e^(-λ) × λ^k) / k!
```

Where:
- λ (lambda) = average arrival rate
- k = number of arrivals (0, 1, 2, 3, ...)
- e ≈ 2.71828

**Cumulative Probability (CP):**
```
CP(k) = Σ P(X = i) for i = 0 to k
```

### 2. Exponential Distribution (for continuous inter-arrival/service times)

**Formula:**
```
T = -μ × ln(R)
```

Where:
- T = inter-arrival time or service time
- μ = mean time (1/rate)
- R = random number between 0 and 1
- ln = natural logarithm

**Alternative form with rate:**
```
T = -ln(1 - R) / λ
```

### 3. Normal Distribution (using Z-table lookup)

**Formula:**
```
T = μ + (Z × σ)
```

Where:
- T = inter-arrival time
- μ = mean
- σ = standard deviation
- Z = Z-score (looked up from Standard Normal Table using R)

**How to get Z:**
1. Generate random number R (0 to 1)
2. Look up R in the Z-table (cumulative probability → Z-score)
3. Use linear interpolation if R falls between table entries

### 4. Uniform Distribution (Continuous)

**Formula:**
```
T = a + R × (b - a)
```

Where:
- T = inter-arrival time
- a = minimum value
- b = maximum value
- R = random number between 0 and 1

---

## CP Table Generation (Poisson)

```python
def generate_poisson_cp_table(lambda_val: float) -> List[CPTableEntry]:
    """
    Generate Cumulative Probability table for Poisson distribution
    P(X=k) = (e^-λ * λ^k) / k!
    """
    import math
    
    table = []
    cumulative_prob = 0.0
    k = 0
    exp_neg_lambda = math.exp(-lambda_val)
    
    while cumulative_prob < 0.9995 and k < 150:
        # Calculate PMF for this k
        pmf = (exp_neg_lambda * (lambda_val ** k)) / math.factorial(k)
        cumulative_prob += pmf
        
        table.append(CPTableEntry(
            x=k,
            prob=round(pmf, 4),
            cp=round(cumulative_prob, 4)
        ))
        k += 1
    
    return table
```

### Lookup from CP Table

```python
def lookup_from_cp_table(table: List[CPTableEntry], random_num: float) -> tuple:
    """
    Find the value (x) whose CP range contains the random number
    Returns: (value, cp)
    """
    for entry in table:
        if random_num <= entry.cp:
            return (entry.x, entry.cp)
    
    # If beyond table, return last entry
    return (table[-1].x, 1.0)
```

---

## Z-Table Lookup (Normal Distribution)

### Standard Normal Z-Table

```python
# Maps cumulative probability (area under curve from -∞ to Z) to Z-score
Z_TABLE = [
    {"prob": 0.0001, "z": -3.72}, {"prob": 0.0005, "z": -3.29}, {"prob": 0.001, "z": -3.09},
    {"prob": 0.005, "z": -2.58}, {"prob": 0.01, "z": -2.33}, {"prob": 0.02, "z": -2.05},
    {"prob": 0.025, "z": -1.96}, {"prob": 0.03, "z": -1.88}, {"prob": 0.04, "z": -1.75},
    {"prob": 0.05, "z": -1.645}, {"prob": 0.06, "z": -1.555}, {"prob": 0.07, "z": -1.48},
    {"prob": 0.08, "z": -1.41}, {"prob": 0.09, "z": -1.34}, {"prob": 0.10, "z": -1.28},
    {"prob": 0.15, "z": -1.04}, {"prob": 0.20, "z": -0.84}, {"prob": 0.25, "z": -0.67},
    {"prob": 0.30, "z": -0.52}, {"prob": 0.35, "z": -0.39}, {"prob": 0.40, "z": -0.25},
    {"prob": 0.45, "z": -0.13}, {"prob": 0.50, "z": 0.00}, {"prob": 0.55, "z": 0.13},
    {"prob": 0.60, "z": 0.25}, {"prob": 0.65, "z": 0.39}, {"prob": 0.70, "z": 0.52},
    {"prob": 0.75, "z": 0.67}, {"prob": 0.80, "z": 0.84}, {"prob": 0.85, "z": 1.04},
    {"prob": 0.90, "z": 1.28}, {"prob": 0.91, "z": 1.34}, {"prob": 0.92, "z": 1.41},
    {"prob": 0.93, "z": 1.48}, {"prob": 0.94, "z": 1.555}, {"prob": 0.95, "z": 1.645},
    {"prob": 0.96, "z": 1.75}, {"prob": 0.97, "z": 1.88}, {"prob": 0.975, "z": 1.96},
    {"prob": 0.98, "z": 2.05}, {"prob": 0.99, "z": 2.33}, {"prob": 0.995, "z": 2.58},
    {"prob": 0.999, "z": 3.09}, {"prob": 0.9995, "z": 3.29}, {"prob": 0.9999, "z": 3.72}
]

def lookup_z_from_table(R: float) -> float:
    """
    Look up Z-score from Standard Normal Table using random number R
    Uses linear interpolation between table entries
    """
    for i in range(len(Z_TABLE) - 1):
        if R <= Z_TABLE[i]["prob"]:
            return Z_TABLE[i]["z"]
        
        if Z_TABLE[i]["prob"] < R <= Z_TABLE[i + 1]["prob"]:
            # Linear interpolation
            ratio = (R - Z_TABLE[i]["prob"]) / (Z_TABLE[i + 1]["prob"] - Z_TABLE[i]["prob"])
            return Z_TABLE[i]["z"] + ratio * (Z_TABLE[i + 1]["z"] - Z_TABLE[i]["z"])
    
    return Z_TABLE[-1]["z"]
```

---

## Inter-Arrival Time Calculation

### For Each Distribution Type

```python
import random
import math

def get_inter_arrival_time(dist_type: str, params: dict) -> tuple:
    """
    Calculate inter-arrival time based on distribution type
    Returns: (time, random_num, cp)
    """
    R = round(random.random(), 4)
    
    if dist_type == "poisson":
        # Use CP table lookup
        table = generate_poisson_cp_table(params["lambda"])
        value, cp = lookup_from_cp_table(table, R)
        return (value, R, cp)
    
    elif dist_type == "exponential":
        # T = -μ × ln(R)
        mu = params["mu"]  # mean = 1/rate
        time = -mu * math.log(R)
        return (round(time, 2), R, R)  # CP = R for continuous
    
    elif dist_type == "normal":
        # T = μ + (Z × σ)
        mu = params["mean"]
        sigma = params["std_dev"]
        Z = lookup_z_from_table(R)
        time = max(0.01, mu + Z * sigma)
        return (round(time, 2), R, R)
    
    elif dist_type == "uniform":
        # T = a + R × (b - a)
        a = params["a"]
        b = params["b"]
        time = a + R * (b - a)
        return (round(time, 2), R, R)
```

---

## Service Time Calculation

```python
def get_service_time(dist_type: str, params: dict) -> tuple:
    """
    Calculate service time based on distribution type
    For exponential: service_time = -μ × ln(R)
    Returns: (time, random_num)
    """
    R = round(random.random(), 4)
    
    if dist_type in ["poisson", "exponential"]:
        # Formula: -μ × ln(R)
        mu = params["mu"]  # mean service time
        time = -mu * math.log(R)
        return (max(1, round(time)), R)
    
    elif dist_type == "normal":
        mu = params["mean"]
        sigma = params["std_dev"]
        Z = lookup_z_from_table(R)
        time = max(0.01, mu + Z * sigma)
        return (max(1, round(time)), R)
    
    elif dist_type == "uniform":
        a = params["a"]
        b = params["b"]
        time = a + R * (b - a)
        return (max(1, round(time)), R)
```

---

## Simulation Engine Logic

### Main Simulation Loop (Event-Driven)

```python
def run_simulation(params):
    """
    Event-driven simulation with discrete event processing
    Events: ARRIVAL and DEPARTURE
    """
    
    # 1. Generate all customers with inter-arrival times
    customers = generate_customers(params)
    
    # 2. Initialize servers
    servers = [Server(id=i+1) for i in range(params.num_servers)]
    
    # 3. Initialize queue (priority queue if enabled)
    queue = []
    
    # 4. Process events
    customer_index = 0
    current_time = 0
    
    while customer_index < len(customers) or queue or any(s.busy for s in servers):
        # Find next event (earliest of: next arrival OR next departure)
        next_event_time = float('inf')
        next_event_type = None
        departing_server = None
        
        # Check next arrival
        if customer_index < len(customers):
            next_event_time = customers[customer_index].arrival_time
            next_event_type = "ARRIVAL"
        
        # Check departures (which server finishes first?)
        for server in servers:
            if server.busy and server.busy_until < next_event_time:
                next_event_time = server.busy_until
                next_event_type = "DEPARTURE"
                departing_server = server
        
        if next_event_time == float('inf'):
            break
        
        current_time = next_event_time
        
        # Process event
        if next_event_type == "ARRIVAL":
            process_arrival(customers[customer_index], servers, queue, current_time, params)
            customer_index += 1
        
        elif next_event_type == "DEPARTURE":
            process_departure(departing_server, servers, queue, current_time)
```

### Process Arrival

```python
def process_arrival(customer, servers, queue, current_time, params):
    # Find free server
    free_server = next((s for s in servers if not s.busy), None)
    
    if free_server:
        # Start service immediately
        start_service(customer, free_server, current_time)
    
    elif params.enable_priority:
        # Check for preemption (lower priority = higher number)
        preempt_candidate = None
        for server in servers:
            if server.busy and server.customer.priority > customer.priority:
                if preempt_candidate is None or server.customer.priority > preempt_candidate.customer.priority:
                    preempt_candidate = server
        
        if preempt_candidate:
            preempt_and_start(customer, preempt_candidate, queue, current_time)
        else:
            add_to_priority_queue(customer, queue)
    else:
        # FIFO queue
        queue.append(customer)
```

### Process Departure

```python
def process_departure(server, servers, queue, current_time):
    finished_customer = server.customer
    
    # Record completion metrics
    finished_customer.end_time = current_time
    finished_customer.wait_time = finished_customer.start_time - finished_customer.arrival_time
    finished_customer.turn_around = current_time - finished_customer.arrival_time
    
    # Free the server
    server.busy = False
    server.customer = None
    
    # Start next customer from queue if any
    if queue:
        next_customer = queue.pop(0)
        start_service(next_customer, server, current_time)
```

---

## Priority Queue with Preemption

### Preemption Logic

```python
def preempt_and_start(new_customer, server, queue, current_time):
    """
    Preempt current customer on server for higher priority customer
    """
    preempted = server.customer
    
    # Calculate remaining service time
    time_served = current_time - server.current_task_start
    preempted.remaining_service_time = max(1, preempted.remaining_service_time - time_served)
    
    # Add preempted customer back to queue (in priority order)
    add_to_priority_queue(preempted, queue)
    
    # Start new customer
    start_service(new_customer, server, current_time)

def add_to_priority_queue(customer, queue):
    """
    Insert customer in queue maintaining priority order (lower number = higher priority)
    """
    insert_index = len(queue)
    for i, q in enumerate(queue):
        if q.priority > customer.priority:
            insert_index = i
            break
    queue.insert(insert_index, customer)
```

---

## Performance Metrics

### Per-Customer Metrics

```python
# Turnaround Time = End Time - Arrival Time
turn_around = end_time - arrival_time

# Wait Time = Start Time - Arrival Time
wait_time = start_time - arrival_time

# Response Time = First Start Time - Arrival Time (same as wait for non-preemptive)
response_time = first_start_time - arrival_time
```

### Average Metrics

```python
def calculate_averages(customers):
    n = len(customers)
    return {
        "avg_inter_arrival": sum(c.inter_arrival for c in customers) / n,
        "avg_service_time": sum(c.service_time for c in customers) / n,
        "avg_turn_around": sum(c.turn_around for c in customers) / n,
        "avg_wait_time": sum(c.wait_time for c in customers) / n,
        "avg_response_time": sum(c.response_time for c in customers) / n
    }
```

### Server Utilization

```python
def calculate_server_utilization(servers):
    """
    Calculate utilization as share of total work done
    All server utilizations should sum to 100%
    """
    total_busy_time = sum(s.busy_time for s in servers)
    
    for server in servers:
        if total_busy_time > 0:
            server.utilization = (server.busy_time / total_busy_time) * 100
        else:
            server.utilization = 0
```

### Priority-Wise Statistics

```python
def calculate_priority_stats(customers, priority_levels):
    stats = []
    for p in range(1, priority_levels + 1):
        priority_customers = [c for c in customers if c.priority == p]
        if priority_customers:
            n = len(priority_customers)
            stats.append({
                "priority": p,
                "avg_wait": sum(c.wait_time for c in priority_customers) / n,
                "avg_response": sum(c.response_time for c in priority_customers) / n,
                "avg_inter_arrival": sum(c.inter_arrival for c in priority_customers) / n,
                "avg_turn_around": sum(c.turn_around for c in priority_customers) / n
            })
    return stats
```

---

## M/M/c Theoretical Calculations

### Queue Notation
- **M/M/c**: Markovian arrivals, Markovian service, c servers
- **λ (lambda)**: Arrival rate
- **μ (mu)**: Service rate per server
- **c**: Number of servers

### Formulas

```python
import math

def calculate_mmc_metrics(lambda_val: float, mu: float, c: int) -> dict:
    """
    Calculate theoretical M/M/c queue metrics
    """
    # Traffic intensity (utilization)
    rho = lambda_val / (c * mu)
    
    # Check stability condition
    if rho >= 1:
        return {
            "rho": rho,
            "stable": False,
            "Lq": float('inf'),
            "L": float('inf'),
            "Wq": float('inf'),
            "W": float('inf'),
            "P0": 0
        }
    
    # Calculate P0 (probability of zero customers in system)
    # P0 = 1 / [Σ(λ/μ)^n/n! for n=0 to c-1) + (λ/μ)^c / (c!(1-ρ))]
    
    sum_term = 0
    for n in range(c):
        sum_term += ((lambda_val / mu) ** n) / math.factorial(n)
    
    last_term = ((lambda_val / mu) ** c) / (math.factorial(c) * (1 - rho))
    P0 = 1 / (sum_term + last_term)
    
    # Average queue length (Lq)
    # Lq = (P0 × (λ/μ)^c × ρ) / (c! × (1-ρ)²)
    Lq = (P0 * ((lambda_val / mu) ** c) * rho) / (math.factorial(c) * ((1 - rho) ** 2))
    
    # Average number in system (L)
    # L = Lq + λ/μ
    L = Lq + lambda_val / mu
    
    # Average time in system (W) - Little's Law
    # W = L / λ
    W = L / lambda_val
    
    # Average wait time in queue (Wq)
    # Wq = Lq / λ
    Wq = Lq / lambda_val
    
    return {
        "rho": round(rho, 3),          # Server utilization
        "stable": True,
        "Lq": round(Lq, 3),            # Avg queue length
        "L": round(L, 3),              # Avg customers in system
        "Wq": round(Wq, 3),            # Avg wait time in queue
        "W": round(W, 3),              # Avg time in system
        "P0": round(P0, 3)             # Probability of empty system
    }
```

---

## Python Implementation Guide

### Recommended Libraries

```python
# GUI Options
import tkinter as tk                    # Built-in, simple
from tkinter import ttk                 # Themed widgets
# OR
from PyQt5 import QtWidgets             # More powerful, modern look
# OR
import customtkinter as ctk             # Modern looking tkinter

# For charts
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

# For tables
from tkinter import ttk  # Treeview widget

# Data handling
import pandas as pd                      # For exporting to Excel

# Creating .exe
# Use PyInstaller: pip install pyinstaller
# Command: pyinstaller --onefile --windowed main.py
```

### Basic Project Structure

```
queue_simulator/
├── main.py                 # Entry point, GUI setup
├── simulator/
│   ├── __init__.py
│   ├── distributions.py    # Poisson, Exponential, Normal, Uniform
│   ├── engine.py          # Main simulation logic
│   ├── metrics.py         # Performance calculations
│   └── mmc_theory.py      # M/M/c formulas
├── gui/
│   ├── __init__.py
│   ├── main_window.py     # Main application window
│   ├── input_form.py      # Parameter input form
│   ├── results_table.py   # Results display
│   └── charts.py          # Matplotlib charts
└── requirements.txt
```

### Creating the .exe

```bash
# Install PyInstaller
pip install pyinstaller

# Create single-file executable
pyinstaller --onefile --windowed --name "QueueSimulator" main.py

# The .exe will be in the 'dist' folder
```

---

## Quick Reference Card

| Distribution | Formula | Inputs | P(X=x)/CP Table |
|-------------|---------|--------|-----------------|
| Poisson | P(X=k) = (e^-λ × λ^k) / k! | λ (rate) | Yes - CP lookup |
| Exponential | T = -μ × ln(R) | μ (mean) | No - Direct calc |
| Normal | T = μ + (Z × σ) | μ, σ | No - Z-table lookup |
| Uniform | T = a + R × (b - a) | a, b | No - Direct calc |

### Key Metrics Formulas

| Metric | Formula |
|--------|---------|
| Turnaround Time | End Time - Arrival Time |
| Wait Time | Start Time - Arrival Time |
| Response Time | First Start Time - Arrival Time |
| Server Utilization | (Busy Time / Total Time) × 100% |
| Traffic Intensity (ρ) | λ / (c × μ) |
| Stability Condition | ρ < 1 |

---

## Notes

1. **First customer** always has inter-arrival time = 0
2. **Priority**: Lower number = Higher priority (1 is highest)
3. **Preemption**: Only active when priority is enabled
4. **Service times** are rounded to integers to avoid precision issues
5. **Random numbers** are stored for verification/debugging
6. **CP Table** only generated for Poisson distribution

---

*Generated from Queue Simulation Web Application*
*Ready for Python/PyInstaller implementation*
