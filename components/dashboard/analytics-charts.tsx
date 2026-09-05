"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";

const COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777"];

// Dashboard Analytics (Section 28): Steel by Standard, Steel by Category.
export function AnalyticsCharts({
  byStandard, byCategory,
}: {
  byStandard: { name: string; value: number }[];
  byCategory: { name: string; value: number }[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="border border-border rounded-lg p-4">
        <p className="text-sm font-medium mb-3">Steel by Standard</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byStandard}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="name" fontSize={12} />
            <YAxis fontSize={12} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="border border-border rounded-lg p-4">
        <p className="text-sm font-medium mb-3">Steel by Category</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={80} label={(d) => d.name}>
              {byCategory.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
