import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SimulationResult } from '@/lib/queueSimulator';
import { TrendingUp, Server, GanttChart } from 'lucide-react';

interface SimulationChartsProps {
  results: SimulationResult | null;
}

// Priority colors
const PRIORITY_COLORS = [
  'hsl(175, 80%, 50%)',  // cyan
  'hsl(270, 60%, 60%)',  // purple
  'hsl(145, 60%, 50%)',  // green
  'hsl(30, 80%, 55%)',   // orange
  'hsl(330, 70%, 60%)',  // pink
  'hsl(200, 70%, 55%)',  // blue
  'hsl(45, 90%, 55%)',   // yellow
  'hsl(0, 70%, 55%)',    // red
  'hsl(260, 50%, 50%)',  // indigo
  'hsl(180, 60%, 45%)',  // teal
];

export function SimulationCharts({ results }: SimulationChartsProps) {
  if (!results) {
    return (
      <div className="space-y-4">
        <Card className="glass-card animate-slide-up">
          <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
            <span>Run simulation to generate charts</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare Gantt chart data
  const ganttData = results.servers.flatMap(server => 
    server.tasks.map(task => ({
      server: `Server ${server.id}`,
      serverId: server.id,
      customerId: task.customerId,
      start: task.start,
      end: task.end,
      duration: task.end - task.start,
      priority: task.priority
    }))
  );

  // Find time range for Gantt
  const maxTime = Math.max(...ganttData.map(d => d.end), 0);

  return (
    <div className="space-y-4">
      {/* Queue Length Bar Chart */}
      <Card className="glass-card  animate-slide-up">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="h-5 w-5 text-chart-cyan" />
            Queue Length Over Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results.queueLengthOverTime} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(215, 15%, 55%)"
                  tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }}
                  tickFormatter={(v) => Math.round(v).toString()}
                />
                <YAxis 
                  stroke="hsl(215, 15%, 55%)"
                  tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 20%, 12%)',
                    border: '1px solid hsl(220, 15%, 20%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 20%, 95%)'
                  }}
                  labelFormatter={(v) => `Time: ${Math.round(v as number)}`}
                />
                <Bar 
                  dataKey="queueLength" 
                  fill="hsl(175, 80%, 50%)" 
                  name="Queue Length"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Server Utilization Chart */}
      <Card className="glass-card  animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Server className="h-5 w-5 text-chart-purple" />
            Server Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={results.servers} 
                layout="vertical"
                margin={{ top: 10, right: 30, left: 60, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                <XAxis 
                  type="number"
                  domain={[0, 100]}
                  stroke="hsl(215, 15%, 55%)"
                  tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }}
                  tickFormatter={(v) => `${v}%`}
                />
                <YAxis 
                  type="category"
                  dataKey="id"
                  stroke="hsl(215, 15%, 55%)"
                  tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }}
                  tickFormatter={(v) => `Server ${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(220, 20%, 12%)',
                    border: '1px solid hsl(220, 15%, 20%)',
                    borderRadius: '8px',
                    color: 'hsl(210, 20%, 95%)'
                  }}
                  formatter={(v: number) => [`${v}%`, 'Utilization']}
                />
                <Bar 
                  dataKey="utilization" 
                  fill="hsl(270, 60%, 60%)" 
                  name="Utilization"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart - Simple Timeline */}
      <Card className="glass-card  animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <GanttChart className="h-5 w-5 text-chart-green" />
            Gantt Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {results.servers.map((server) => {
              const serverTasks = server.tasks;
              const chartMaxTime = maxTime > 0 ? maxTime : 1;


              const labelSet = new Set<number>();
              labelSet.add(0);

              serverTasks.forEach((task, index) => {
                const prevEnd = index === 0 ? 0 : serverTasks[index - 1].end;
                if (task.start > prevEnd) {
                  labelSet.add(task.start);
                }
                labelSet.add(task.end);
              });

              const sortedLabels = Array.from(labelSet).sort((a, b) => a - b);

              return (
                <div key={server.id} className="mb-6 px-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">Server {server.id}</div>
                  <div className="relative">
                    {/* Timeline bar */}
                    <div className="relative h-10 border-2 border-foreground/80 rounded-sm overflow-hidden bg-background">
                      {serverTasks.map((task, index) => {
                        const leftPercent = (task.start / chartMaxTime) * 100;
                        const widthPercent = ((task.end - task.start) / chartMaxTime) * 100;

                        return (
                          <div
                            key={index}
                            className="absolute top-0 h-full flex items-center justify-center border-r border-foreground/40 font-mono text-xs font-bold overflow-hidden"
                            style={{
                              left: `${leftPercent}%`,
                              width: `${Math.max(widthPercent, 1)}%`,
                              minWidth: '20px',
                              backgroundColor: PRIORITY_COLORS[(task.priority - 1) % PRIORITY_COLORS.length],
                              color: 'hsl(0, 0%, 10%)'
                            }}
                            title={`C${task.customerId} | Priority ${task.priority} | ${task.start} - ${task.end}`}
                          >
                            C{task.customerId}
                          </div>
                        );
                      })}
                    </div>

                    {/* Time labels below — now includes start labels on idle gaps */}
                    <div className="relative font-mono text-xs text-muted-foreground mt-1 h-4">
                      {sortedLabels.map((time) => {
                        const position = (time / chartMaxTime) * 100;
                        return (
                          <span
                            key={time}
                            className="absolute transform -translate-x-1/2"
                            style={{ left: `${Math.min(position, 98)}%` }}
                          >
                            {time}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-border/30">
            {Array.from(new Set(results.customers.map(c => c.priority))).sort().map(priority => (
              <div key={priority} className="flex items-center gap-1.5 text-xs">
                <div 
                  className="w-4 h-4 rounded-sm border border-foreground/30" 
                  style={{ backgroundColor: PRIORITY_COLORS[(priority - 1) % PRIORITY_COLORS.length] }}
                />
                <span className="text-muted-foreground">Priority {priority}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}