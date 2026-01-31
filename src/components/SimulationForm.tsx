import { useState } from 'react';
import { Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { SimulationParams, ProcessType, DistributionType } from '@/lib/queueSimulator';

interface SimulationFormProps {
  onRunSimulation: (params: SimulationParams) => void;
  isRunning: boolean;
}

export function SimulationForm({ onRunSimulation, isRunning }: SimulationFormProps) {
  // Arrival Process
  const [arrivalProcess, setArrivalProcess] = useState<ProcessType>('M');
  const [arrivalDistribution, setArrivalDistribution] = useState<DistributionType>('exponential');
  const [arrivalRate, setArrivalRate] = useState<number>(2.96);
  const [arrivalMean, setArrivalMean] = useState<number>(1);
  const [arrivalStdDev, setArrivalStdDev] = useState<number>(0.3);
  const [arrivalA, setArrivalA] = useState<number>(0.5);
  const [arrivalB, setArrivalB] = useState<number>(1.5);

  // Service Process
  const [serviceProcess, setServiceProcess] = useState<ProcessType>('M');
  const [serviceDistribution, setServiceDistribution] = useState<DistributionType>('exponential');
  const [serviceRate, setServiceRate] = useState<number>(5);
  const [serviceMean, setServiceMean] = useState<number>(0.2);
  const [serviceStdDev, setServiceStdDev] = useState<number>(0.05);
  const [serviceA, setServiceA] = useState<number>(0.1);
  const [serviceB, setServiceB] = useState<number>(0.3);

  // General
  const [numServers, setNumServers] = useState<number>(1);
  const [simulationTime, setSimulationTime] = useState<number>(100);
  const [enablePriority, setEnablePriority] = useState<boolean>(true);
  const [priorityLevels, setPriorityLevels] = useState<number>(3);

  const handleArrivalProcessChange = (value: ProcessType) => {
    setArrivalProcess(value);
    if (value === 'M') {
      setArrivalDistribution('exponential');
    } else {
      setArrivalDistribution('normal');
    }
  };

  const handleServiceProcessChange = (value: ProcessType) => {
    setServiceProcess(value);
    if (value === 'M') {
      setServiceDistribution('exponential');
    } else {
      setServiceDistribution('normal');
    }
  };

  const handleSubmit = () => {
    const arrivalParams = arrivalDistribution === 'normal' 
      ? { type: arrivalDistribution, mean: arrivalMean, stdDev: arrivalStdDev }
      : arrivalDistribution === 'uniform'
      ? { type: arrivalDistribution, a: arrivalA, b: arrivalB }
      : { type: arrivalDistribution, rate: arrivalRate };

    const serviceParams = serviceDistribution === 'normal'
      ? { type: serviceDistribution, mean: serviceMean, stdDev: serviceStdDev }
      : serviceDistribution === 'uniform'
      ? { type: serviceDistribution, a: serviceA, b: serviceB }
      : { type: serviceDistribution, rate: serviceRate };

    onRunSimulation({
      arrivalProcess,
      serviceProcess,
      arrivalParams,
      serviceParams,
      numServers,
      enablePriority,
      priorityLevels: enablePriority ? priorityLevels : 1
    });
  };

  const queueNotation = `${arrivalProcess}/${serviceProcess}/${numServers}`;

  return (
    <Card className="glass-card  animate-slide-up">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <Settings className="h-5 w-5 text-primary" />
            Simulation Configuration
          </div>
          <span className="font-mono text-primary text-sm">{queueNotation}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Two Column Layout for Arrival and Service */}
        <div className="grid grid-cols-2 gap-6">
          {/* Arrival Process */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-center border-b border-border/50 pb-2">Arrival Process</h3>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Distribution</Label>
              <Select value={arrivalProcess} onValueChange={handleArrivalProcessChange}>
                <SelectTrigger className="bg-input border-border/50 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">M (Markovian)</SelectItem>
                  <SelectItem value="G">G (General)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {arrivalProcess === 'M' ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={arrivalDistribution} onValueChange={(v) => setArrivalDistribution(v as DistributionType)}>
                    <SelectTrigger className="bg-input border-border/50 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poisson">Poisson</SelectItem>
                      <SelectItem value="exponential">Exponential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Lambda (λ)</Label>
                  <Input
                    type="number"
                    value={arrivalRate}
                    onChange={(e) => setArrivalRate(parseFloat(e.target.value) || 0)}
                    min={0.1}
                    step={0.1}
                    className="bg-input border-border/50 h-10 font-mono"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={arrivalDistribution} onValueChange={(v) => setArrivalDistribution(v as DistributionType)}>
                    <SelectTrigger className="bg-input border-border/50 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="uniform">Uniform</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {arrivalDistribution === 'normal' ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Mean</Label>
                      <Input
                        type="number"
                        value={arrivalMean}
                        onChange={(e) => setArrivalMean(parseFloat(e.target.value) || 0)}
                        min={0.1}
                        step={0.1}
                        className="bg-input border-border/50 h-10 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Std Dev (σ)</Label>
                      <Input
                        type="number"
                        value={arrivalStdDev}
                        onChange={(e) => setArrivalStdDev(parseFloat(e.target.value) || 0)}
                        min={0.01}
                        step={0.05}
                        className="bg-input border-border/50 h-10 font-mono"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">a (min)</Label>
                      <Input
                        type="number"
                        value={arrivalA}
                        onChange={(e) => setArrivalA(parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.1}
                        className="bg-input border-border/50 h-10 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">b (max)</Label>
                      <Input
                        type="number"
                        value={arrivalB}
                        onChange={(e) => setArrivalB(parseFloat(e.target.value) || 0)}
                        min={0.1}
                        step={0.1}
                        className="bg-input border-border/50 h-10 font-mono"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Service Process */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-center border-b border-border/50 pb-2">Service Process</h3>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Distribution</Label>
              <Select value={serviceProcess} onValueChange={handleServiceProcessChange}>
                <SelectTrigger className="bg-input border-border/50 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">M (Markovian)</SelectItem>
                  <SelectItem value="G">G (General)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {serviceProcess === 'M' ? (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={serviceDistribution} onValueChange={(v) => setServiceDistribution(v as DistributionType)}>
                    <SelectTrigger className="bg-input border-border/50 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="poisson">Poisson</SelectItem>
                      <SelectItem value="exponential">Exponential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Lambda (μ)</Label>
                  <Input
                    type="number"
                    value={serviceRate}
                    onChange={(e) => setServiceRate(parseFloat(e.target.value) || 0)}
                    min={0.1}
                    step={0.1}
                    className="bg-input border-border/50 h-10 font-mono"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={serviceDistribution} onValueChange={(v) => setServiceDistribution(v as DistributionType)}>
                    <SelectTrigger className="bg-input border-border/50 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="uniform">Uniform</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {serviceDistribution === 'normal' ? (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Mean</Label>
                      <Input
                        type="number"
                        value={serviceMean}
                        onChange={(e) => setServiceMean(parseFloat(e.target.value) || 0)}
                        min={0.1}
                        step={0.1}
                        className="bg-input border-border/50 h-10 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Std Dev (σ)</Label>
                      <Input
                        type="number"
                        value={serviceStdDev}
                        onChange={(e) => setServiceStdDev(parseFloat(e.target.value) || 0)}
                        min={0.01}
                        step={0.05}
                        className="bg-input border-border/50 h-10 font-mono"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">a (min)</Label>
                      <Input
                        type="number"
                        value={serviceA}
                        onChange={(e) => setServiceA(parseFloat(e.target.value) || 0)}
                        min={0}
                        step={0.1}
                        className="bg-input border-border/50 h-10 font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">b (max)</Label>
                      <Input
                        type="number"
                        value={serviceB}
                        onChange={(e) => setServiceB(parseFloat(e.target.value) || 0)}
                        min={0.1}
                        step={0.1}
                        className="bg-input border-border/50 h-10 font-mono"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Server and Priority Row */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Number of Servers</Label>
            <Input
              type="number"
              value={numServers}
              onChange={(e) => setNumServers(parseInt(e.target.value) || 1)}
              min={1}
              max={20}
              className="bg-input border-border/50 h-10 font-mono"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <Checkbox
              id="priority"
              checked={enablePriority}
              onCheckedChange={(checked) => setEnablePriority(checked as boolean)}
            />
            <Label htmlFor="priority" className="text-sm cursor-pointer">Enable Priority</Label>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Priority Levels</Label>
            <Input
              type="number"
              placeholder='0'
              value={priorityLevels}
              onChange={(e) => setPriorityLevels(Math.min(parseInt(e.target.value) || 1, 10))}
              min={1}
              max={10}
              disabled={!enablePriority}
              className="bg-input border-border/50 h-10 font-mono disabled:opacity-50"
            />
          </div>
        </div>

        {/* Run Button */}
        <Button 
          onClick={handleSubmit} 
          disabled={isRunning}
          className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Play className="mr-2 h-5 w-5" />
          {isRunning ? 'Running Simulation...' : 'Start Simulation'}
        </Button>
      </CardContent>
    </Card>
  );
}