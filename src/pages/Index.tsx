import { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { SimulationForm } from '@/components/SimulationForm';
import { SimulationResultsTable } from '@/components/SimulationResultsTable';
import { SimulationCharts } from '@/components/SimulationCharts';
import { QueuingAnalysis } from '@/components/QueuingAnalysis';
import { runSimulation, SimulationParams, SimulationResult } from '@/lib/queueSimulator';
import { Activity, Calculator, Table, BarChart3 } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('simulation');
  const [isRunning, setIsRunning] = useState(false);
  const [simulationResults, setSimulationResults] = useState<SimulationResult | null>(null);
  const [showCharts, setShowCharts] = useState(false);

  const handleRunSimulation = useCallback((params: SimulationParams) => {
    setIsRunning(true);
    setShowCharts(false);
    
    setTimeout(() => {
      const results = runSimulation(params);
      setSimulationResults(results);
      setIsRunning(false);
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* <div className="p-2 rounded-lg bg-primary/10 animate-pulse-glow">
                <Activity className="h-6 w-6 text-primary" />
              </div> */}
              <div>
                <h1 className="text-xl font-bold tracking-tight">QueueSim</h1>
                <p className="text-xs text-muted-foreground">Queuing Theory Simulator</p>
              </div>
            </div>
            <div className="text-[16px] text-muted-foreground font-mono">
              Submitted To: Dr. Shaista Rais
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger 
              value="simulation" 
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Simulation
            </TabsTrigger>
            <TabsTrigger 
              value="queuing"
              className="flex items-center gap-2"
            >
              <Calculator className="h-4 w-4" />
              Queuing Analysis
            </TabsTrigger>
          </TabsList>

          {/* Simulation Tab */}
          <TabsContent value="simulation" className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold">Queue Simulation</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Run discrete-event simulations with priority scheduling. 
                Supports M/M/x, M/G/x, and G/G/x queuing systems.
              </p>
            </div>

            <div className="grid lg:grid-cols-[420px_1fr] gap-6">
              {/* Left Column - Form */}
              <div>
                <SimulationForm onRunSimulation={handleRunSimulation} isRunning={isRunning} />
              </div>

              {/* Right Column - Results Toggle */}
              <div className="space-y-4">
                {simulationResults && (
                  <div className="flex gap-2 justify-center">
                    <Button
                      variant={!showCharts ? 'default' : 'outline'}
                      onClick={() => setShowCharts(false)}
                      className="flex items-center gap-2"
                    >
                      <Table className="h-4 w-4" />
                      Results Table
                    </Button>
                    <Button
                      variant={showCharts ? 'default' : 'outline'}
                      onClick={() => setShowCharts(true)}
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      View Graphs
                    </Button>
                  </div>
                )}

                {!showCharts ? (
                  <SimulationResultsTable results={simulationResults} />
                ) : (
                  <SimulationCharts results={simulationResults} />
                )}
              </div>
            </div>
          </TabsContent>

          {/* Queuing Analysis Tab */}
          <TabsContent value="queuing" className="space-y-6 animate-fade-in">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold">Queuing Theory Analysis</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Calculate theoretical performance metrics for your queue. 
                Choose M (Markovian) or G (General) for arrival and service processes.
              </p>
            </div>

            <QueuingAnalysis />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-auto py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              {/* <Activity className="h-4 w-4 text-primary" /> */}
              <span>QueueSim - Queuing Theory Simulator</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="font-mono text-xs">
                <div className='text-center text-2xl'>
                  Group Members
                </div >
                <div className='text-center'>

                <div>Muhammad Moazzam Khan</div>
                <div>Waseem bin Ashfaq</div>
                <div>Syed Muhammad Taqi Raza Kazmi</div>
                </div>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;