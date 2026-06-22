import { TrendingUp, TrendingDown, DollarSign, Hotel, Percent, BarChart3, Wallet } from 'lucide-react';
import { useApp } from '../store/AppContext';

export default function DashboardPage() {
  const { dashboardKPI, dailyRevenue, revenueBreakdown, todayStats, occupancyRate, adr, revpar, totalRevenue, totalExpenses } = useApp();

  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 bg-slate-50">
      <h1 className="text-lg font-bold text-slate-800">Dashboard</h1>

      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'Total Revenue', value: `₹${(totalRevenue / 1000).toFixed(1)}K`, change: `+${dashboardKPI.revenueChange}%`, icon: DollarSign, up: true, color: 'bg-blue-500' },
          { label: 'Occupancy Rate', value: `${occupancyRate}%`, change: `+${dashboardKPI.occupancyChange}%`, icon: Hotel, up: true, color: 'bg-emerald-500' },
          { label: 'ADR', value: `₹${adr}`, change: `${dashboardKPI.adrChange}%`, icon: Percent, up: false, color: 'bg-amber-500' },
          { label: 'RevPAR', value: `₹${revpar}`, change: '+8.3%', icon: BarChart3, up: true, color: 'bg-purple-500' },
          { label: 'Expenses', value: `₹${(totalExpenses / 1000).toFixed(1)}K`, change: '+2.1%', icon: Wallet, up: false, color: 'bg-red-500' },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{kpi.label}</span>
                <div className={`${kpi.color} p-1.5 rounded-lg`}><Icon size={14} className="text-white" /></div>
              </div>
              <div className="text-xl font-bold text-slate-800 mb-1">{kpi.value}</div>
              <div className={`flex items-center gap-1 text-[11px] font-medium ${kpi.up ? 'text-emerald-600' : 'text-red-500'}`}>
                {kpi.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {kpi.change} vs last week
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Revenue Breakdown</h3>
          <div className="flex items-center gap-6">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                {revenueBreakdown.map((item, i) => {
                  const total = revenueBreakdown.reduce((s, r) => s + r.value, 1);
                  const pct = item.value / total;
                  const circumference = 2 * Math.PI * 14;
                  const offset = revenueBreakdown.slice(0, i).reduce((s, r) => s + (r.value / total) * circumference, 0);
                  const colors = ['#3B82F6', '#10B981', '#F59E0B'];
                  return (
                    <circle key={item.label} cx="18" cy="18" r="14" fill="none" stroke={colors[i]} strokeWidth="3.5"
                      strokeDasharray={`${pct * circumference} ${circumference - pct * circumference}`} strokeDashoffset={-offset} />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-lg font-bold text-slate-800">₹{(totalRevenue / 1000).toFixed(0)}K</div>
                  <div className="text-[9px] text-slate-500">Total</div>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2.5">
              {revenueBreakdown.map((item, i) => {
                const dots = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500'];
                const colors = ['text-blue-500', 'text-emerald-500', 'text-amber-500'];
                const total = revenueBreakdown.reduce((s, r) => s + r.value, 1);
                return (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${dots[i]}`} />
                      <span className="text-xs text-slate-600">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-semibold ${colors[i]}`}>₹{(item.value / 1000).toFixed(0)}K</span>
                      <span className="text-[10px] text-slate-400">{Math.round(item.value / total * 100)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 col-span-2">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-4">Daily Revenue & Occupancy Trend</h3>
          <div className="flex items-end gap-2 h-44">
            {dailyRevenue.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="text-[10px] font-medium text-slate-600">₹{(d.revenue / 1000).toFixed(0)}K</div>
                <div className="w-full flex flex-col items-center gap-0.5" style={{ height: '100px' }}>
                  <div className="w-5/6 bg-blue-500 rounded-t transition-all" style={{ height: `${(d.revenue / maxRevenue) * 80}px` }} />
                  <div className="w-5/6 bg-emerald-400 rounded-t transition-all" style={{ height: `${(d.occupancy / 100) * 30}px` }} />
                </div>
                <div className="text-[9px] text-slate-400 mt-1">{d.date}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500" /> Revenue</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-400" /> Occupancy</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">Today's Summary</h3>
        <div className="grid grid-cols-4 gap-6">
          {[
            { label: 'Arrivals', value: todayStats.arrivals, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'In-House', value: todayStats.inHouse, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Departures', value: todayStats.departures, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Vacant', value: todayStats.vacant, color: 'text-slate-600', bg: 'bg-slate-100' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={`${item.bg} rounded-lg px-3 py-2 text-center min-w-[50px]`}>
                <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
              </div>
              <span className="text-xs font-medium text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
