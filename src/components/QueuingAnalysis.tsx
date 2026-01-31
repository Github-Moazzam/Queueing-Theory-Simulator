import { useState } from 'react';
import { Calculator, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { calculateMMcMetrics } from '@/lib/queueSimulator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type ProcessType = 'M' | 'G';

interface QueuingFormState {
  arrivalType: ProcessType;
  serviceType: ProcessType;
  arrivalRate: number;
  serviceRate: number;
  numServers: number;
}

interface QueuingResult {
  rho: number;
  stable: boolean;
  Lq: number;
  L: number;
  Wq: number;
  W: number;
  P0: number;
  isApprox?: boolean;
}

export function QueuingAnalysis() {
  const [form, setForm] = useState<QueuingFormState>({
    arrivalType: 'M',
    serviceType: 'M',
    arrivalRate: 5,
    serviceRate: 8,
    numServers: 2
  });

  const [result, setResult] = useState<QueuingResult | null>(null);

  const handleCalculate = () => {
    const { arrivalRate, serviceRate, numServers, arrivalType, serviceType } = form;
    
    // For M/M/c we have exact formulas
    if (arrivalType === 'M' && serviceType === 'M') {
      const metrics = calculateMMcMetrics(arrivalRate, serviceRate, numServers);
      setResult({ ...metrics, isApprox: false });
    } else {
      // For M/G/c and G/G/c, use approximations
      const rho = arrivalRate / (numServers * serviceRate);
      
      if (rho >= 1) {
        setResult({
          rho,
          stable: false,
          Lq: Infinity,
          L: Infinity,
          Wq: Infinity,
          W: Infinity,
          P0: 0,
          isApprox: true
        });
      } else {
        // Simplified approximation for non-M/M queues
        const Lq = (rho * rho) / (1 - rho) * (arrivalType === 'G' ? 1.2 : 1.1);
        const L = Lq + arrivalRate / serviceRate;
        const W = L / arrivalRate;
        const Wq = Lq / arrivalRate;

        setResult({
          rho: Math.round(rho * 1000) / 1000,
          stable: true,
          Lq: Math.round(Lq * 1000) / 1000,
          L: Math.round(L * 1000) / 1000,
          Wq: Math.round(Wq * 1000) / 1000,
          W: Math.round(W * 1000) / 1000,
          P0: 0,
          isApprox: true
        });
      }
    }
  };

  const queueNotation = `${form.arrivalType}/${form.serviceType}/${form.numServers}`;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Input Form */}
      <Card className="glass-card  animate-slide-up">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Calculator className="h-5 w-5 text-primary" />
            Queue Configuration
          </CardTitle>
          <CardDescription>
            Configure your queue parameters to calculate theoretical performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Arrival Process */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Arrival Process</Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    <strong>M (Markovian):</strong> Exponential inter-arrival times (memoryless)<br />
                    <strong>G (General):</strong> Any other distribution
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <RadioGroup
              value={form.arrivalType}
              onValueChange={(v) => setForm({ ...form, arrivalType: v as ProcessType })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="M" id="arrival-m" />
                <Label htmlFor="arrival-m" className="cursor-pointer font-mono text-sm">
                  M (Markovian)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="G" id="arrival-g" />
                <Label htmlFor="arrival-g" className="cursor-pointer font-mono text-sm">
                  G (General)
                </Label>
              </div>
            </RadioGroup>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Arrival Rate (λ)</Label>
              <Input
                type="number"
                value={form.arrivalRate}
                onChange={(e) => setForm({ ...form, arrivalRate: parseFloat(e.target.value) || 0 })}
                min={0.1}
                step={0.5}
                className="bg-input border-border/50 h-11 font-mono"
              />
            </div>
          </div>

          {/* Service Process */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Service Process</Label>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    <strong>M (Markovian):</strong> Exponential service times (memoryless)<br />
                    <strong>G (General):</strong> Any other distribution
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <RadioGroup
              value={form.serviceType}
              onValueChange={(v) => setForm({ ...form, serviceType: v as ProcessType })}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="M" id="service-m" />
                <Label htmlFor="service-m" className="cursor-pointer font-mono text-sm">
                  M (Markovian)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="G" id="service-g" />
                <Label htmlFor="service-g" className="cursor-pointer font-mono text-sm">
                  G (General)
                </Label>
              </div>
            </RadioGroup>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Service Rate (μ)</Label>
              <Input
                type="number"
                value={form.serviceRate}
                onChange={(e) => setForm({ ...form, serviceRate: parseFloat(e.target.value) || 0 })}
                min={0.1}
                step={0.5}
                className="bg-input border-border/50 h-11 font-mono"
              />
            </div>
          </div>

          {/* Number of Servers */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Number of Servers (c)</Label>
            <Input
              type="number"
              value={form.numServers}
              onChange={(e) => setForm({ ...form, numServers: parseInt(e.target.value) || 1 })}
              min={1}
              max={20}
              className="bg-input border-border/50 h-11 font-mono"
            />
          </div>

          {/* Calculate Button */}
          <Button 
            onClick={handleCalculate}
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Calculator className="mr-2 h-5 w-5" />
            Calculate Metrics
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            <span className="font-mono text-primary">{queueNotation}</span> Queue Results
          </CardTitle>
          {result?.isApprox && (
            <CardDescription className="text-chart-orange">
              ⚠️ Using approximations for non-M/M queues
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {!result ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Configure parameters and calculate
            </div>
          ) : !result.stable ? (
            <div className="flex flex-col items-center justify-center h-64 text-destructive space-y-2">
              <span className="text-4xl">⚠️</span>
              <span className="text-lg font-semibold">Unstable System</span>
              <span className="text-sm text-muted-foreground">
                Traffic intensity ρ = {result.rho} ≥ 1
              </span>
              <span className="text-xs text-muted-foreground text-center max-w-xs">
                The arrival rate exceeds the combined service capacity. Queue will grow indefinitely.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <MetricCard 
                label="Traffic Intensity" 
                symbol="ρ" 
                value={result.rho} 
                description="System load factor"
              />
              <MetricCard 
                label="Avg Queue Length" 
                symbol="Lq" 
                value={result.Lq} 
                description="Customers waiting"
              />
              <MetricCard 
                label="Avg System Size" 
                symbol="L" 
                value={result.L} 
                description="Total in system"
              />
              <MetricCard 
                label="Avg Wait Time" 
                symbol="Wq" 
                value={result.Wq} 
                description="Time in queue"
              />
              <MetricCard 
                label="Avg System Time" 
                symbol="W" 
                value={result.W} 
                description="Total time in system"
              />
              {result.P0 > 0 && (
                <MetricCard 
                  label="Empty Probability" 
                  symbol="P₀" 
                  value={result.P0} 
                  description="System idle probability"
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ label, symbol, value, description }: { 
  label: string; 
  symbol: string; 
  value: number; 
  description: string 
}) {
  return (
    <div className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        <span className="font-mono text-sm text-primary">{symbol}</span>
      </div>
      <p className="data-value">{value}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}