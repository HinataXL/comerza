'use client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface ChartProps {
  lineData: any[];
  pieData: any[];
}

export default function Charts({ lineData, pieData }: ChartProps) {
  return (
    <div className="charts-grid">
      <div className="card">
        <div className="flex-between card-header">
          <h3 className="card-title">Ventas y cobros</h3>
          <select className="select-input">
            <option>Últimos 6 meses</option>
          </select>
        </div>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={lineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(val) => `${val/1000}K`} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.08)', background: 'white', fontSize: '13px' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#6b7280' }} />
              <Line type="monotone" name="Ventas (Q)" dataKey="ventas" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#6366f1' }} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Cobros (Q)" dataKey="cobros" stroke="#14b8a6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: 'white', stroke: '#14b8a6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="flex-between card-header">
          <h3 className="card-title">Métodos de pago</h3>
          <select className="select-input">
            <option>Este mes</option>
          </select>
        </div>
        <div style={{ width: '100%', height: 300, display: 'flex', flexDirection: 'column' }}>
          <ResponsiveContainer width="100%" height="70%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="pie-legend" style={{ marginTop: '1rem' }}>
            {pieData.map((item) => (
              <div key={item.name} className="flex-between" style={{ marginBottom: '8px', fontSize: '12px' }}>
                <div className="flex-row">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color }}></div>
                  <span className="text-secondary">{item.name}</span>
                </div>
                <div className="flex-row" style={{ gap: '1rem' }}>
                  <span style={{ fontWeight: 600 }}>{item.value}%</span>
                  <span className="text-secondary">Q {item.amount ? item.amount.toLocaleString('en-US', { maximumFractionDigits: 0 }) : 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
