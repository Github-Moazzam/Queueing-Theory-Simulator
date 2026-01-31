import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SimulationResult } from '@/lib/queueSimulator';
import { Server, BarChart3 } from 'lucide-react';

interface SimulationResultsTableProps {
  results: SimulationResult | null;
}

export function SimulationResultsTable({ results }: SimulationResultsTableProps) {
  if (!results) {
    return (
      <Card className="glass-card animate-slide-up">
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <span>Run simulation to see results</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Results Table */}
      <Card className="glass-card   animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold text-center">Simulation Results</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[450px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-border/50">
                  <TableHead className="text-center font-semibold text-primary">S.No</TableHead>
                  <TableHead className="text-center font-semibold text-primary">P(X=x)</TableHead>
                  <TableHead className="text-center font-semibold text-primary">CP</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Range</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Inter Arrival</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Arrival</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Priority</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Service</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Start</TableHead>
                  <TableHead className="text-center font-semibold text-primary">End</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Turn Around</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Wait</TableHead>
                  <TableHead className="text-center font-semibold text-primary">Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.customers.map((customer, idx) => {
                  // Get CP table entry by index (sequential order)
                  const cpEntry = results.cpTable?.[idx];
                  const prevCp = idx > 0 ? results.cpTable?.[idx - 1]?.cp ?? 0 : 0;
                  const range = cpEntry ? (idx === 0 ? `0 - ${cpEntry.cp}` : `${prevCp} - ${cpEntry.cp}`) : '-';
                  
                  return (
                    <TableRow key={customer.id} className="border-border/30 hover:bg-muted/30">
                      <TableCell className="text-center font-mono ">{customer.id}</TableCell>
                      <TableCell className="text-center font-mono ">{cpEntry?.prob ?? '-'}</TableCell>
                      <TableCell className="text-center font-mono">{cpEntry?.cp ?? '-'}</TableCell>
                      <TableCell className="text-center font-mono ">{range}</TableCell>
                      <TableCell className="text-center font-mono">{customer.interArrival}</TableCell>
                      <TableCell className="text-center font-mono ">{customer.arrivalTime}</TableCell>
                      <TableCell className="text-center font-mono ">{customer.priority}</TableCell>
                      <TableCell className="text-center font-mono">{customer.serviceTime}</TableCell>
                      <TableCell className="text-center font-mono">{customer.startTime}</TableCell>
                      <TableCell className="text-center font-mono ">{customer.endTime}</TableCell>
                      <TableCell className="text-center font-mono ">{customer.turnAround}</TableCell>
                      <TableCell className="text-center font-mono ">{customer.waitTime}</TableCell>
                      <TableCell className="text-center font-mono ">{customer.responseTime}</TableCell>
                    </TableRow>
                  );
                })}
                {/* Averages Row */}
                <TableRow className="border-t-2 border-primary/50 bg-muted/20 font-semibold">
                  <TableCell className="text-center text-chart-green">Avg</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center font-mono text-chart-green">{results.averages.interArrival}</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center font-mono text-chart-green">{results.averages.serviceTime}</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center">-</TableCell>
                  <TableCell className="text-center font-mono text-chart-green">{results.averages.turnAround}</TableCell>
                  <TableCell className="text-center font-mono text-chart-green">{results.averages.waitTime}</TableCell>
                  <TableCell className="text-center font-mono text-chart-green">{results.averages.responseTime}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Server Utilization and Priority Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Server Utilization */}
        <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Server className="h-5 w-5 text-chart-cyan" />
              Server Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-center font-semibold">Server</TableHead>
                  <TableHead className="text-center font-semibold">Utilization (%)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.servers.map((server) => (
                  <TableRow key={server.id} className="border-border/30">
                    <TableCell className="text-center font-mono">Server {server.id}</TableCell>
                    <TableCell className="text-center font-mono">
                      <span className={server.utilization > 80 ? 'text-destructive' : server.utilization > 50 ? 'text-chart-orange' : 'text-chart-green'}>
                        {server.utilization}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Priority-Wise Averages */}
        <Card className="glass-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-5 w-5 text-chart-purple" />
              Priority-Wise Averages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50">
                  <TableHead className="text-center font-semibold">Priority</TableHead>
                  <TableHead className="text-center font-semibold">Avg Wait</TableHead>
                  <TableHead className="text-center font-semibold">Avg Response</TableHead>
                  <TableHead className="text-center font-semibold">Avg Inter Arrival</TableHead>
                  <TableHead className="text-center font-semibold">Avg Turn Around</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.priorityStats.map((stat) => (
                  <TableRow key={stat.priority} className="border-border/30">
                    <TableCell className="text-center font-mono ">{stat.priority}</TableCell>
                    <TableCell className="text-center font-mono ">{stat.avgWait}</TableCell>
                    <TableCell className="text-center font-mono ">{stat.avgResponse}</TableCell>
                    <TableCell className="text-center font-mono ">{stat.avgInterArrival}</TableCell>
                    <TableCell className="text-center font-mono ">{stat.avgTurnAround}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}