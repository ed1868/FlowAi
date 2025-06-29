import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, eachDayOfInterval, isSameDay } from "date-fns";
import type { JournalEntry } from "@shared/schema";

interface JournalTrendsProps {
  entries: JournalEntry[];
}

const moodValues: Record<string, number> = {
  terrible: 1,
  bad: 2,
  neutral: 3,
  good: 4,
  excellent: 5
};

const moodColors: Record<string, string> = {
  terrible: "#ef4444",
  bad: "#f97316", 
  neutral: "#eab308",
  good: "#22c55e",
  excellent: "#10b981"
};

export default function JournalTrends({ entries }: JournalTrendsProps) {
  // Mood trend data for the last 30 days
  const moodTrendData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date()
    });

    return last30Days.map(day => {
      const dayEntries = entries.filter(entry => 
        isSameDay(new Date(entry.createdAt), day)
      );
      
      const avgMood = dayEntries.length > 0 
        ? dayEntries.reduce((sum, entry) => sum + (moodValues[entry.mood] || 3), 0) / dayEntries.length
        : null;

      return {
        date: format(day, "MMM dd"),
        mood: avgMood,
        entryCount: dayEntries.length
      };
    });
  }, [entries]);

  // Mood distribution data
  const moodDistribution = useMemo(() => {
    const moodCounts = entries.reduce((acc, entry) => {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(moodCounts).map(([mood, count]) => ({
      mood: mood.charAt(0).toUpperCase() + mood.slice(1),
      count,
      color: moodColors[mood]
    }));
  }, [entries]);

  // Writing frequency data (entries per week for last 12 weeks)
  const writingFrequency = useMemo(() => {
    const weeks = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = subDays(new Date(), i * 7 + 6);
      const weekEnd = subDays(new Date(), i * 7);
      
      const weekEntries = entries.filter(entry => {
        const entryDate = new Date(entry.createdAt);
        return entryDate >= weekStart && entryDate <= weekEnd;
      });

      weeks.push({
        week: format(weekStart, "MMM dd"),
        entries: weekEntries.length
      });
    }
    return weeks;
  }, [entries]);

  // Tag popularity
  const tagPopularity = useMemo(() => {
    const tagCounts = entries.reduce((acc, entry) => {
      entry.tags.forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));
  }, [entries]);

  // Stats calculations
  const stats = useMemo(() => {
    const totalEntries = entries.length;
    const avgMood = entries.length > 0 
      ? entries.reduce((sum, entry) => sum + (moodValues[entry.mood] || 3), 0) / entries.length
      : 0;
    
    const last7Days = entries.filter(entry => 
      new Date(entry.createdAt) >= subDays(new Date(), 7)
    );
    
    const avgWordsPerEntry = entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.content.split(' ').length, 0) / entries.length
      : 0;

    return {
      totalEntries,
      avgMood: avgMood.toFixed(1),
      entriesThisWeek: last7Days.length,
      avgWordsPerEntry: Math.round(avgWordsPerEntry)
    };
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card border-glass-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{stats.totalEntries}</div>
            <p className="text-sm text-gray-400">Total Entries</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{stats.avgMood}</div>
            <p className="text-sm text-gray-400">Avg Mood</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{stats.entriesThisWeek}</div>
            <p className="text-sm text-gray-400">This Week</p>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-glass-border">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{stats.avgWordsPerEntry}</div>
            <p className="text-sm text-gray-400">Avg Words</p>
          </CardContent>
        </Card>
      </div>

      {/* Mood Trend Chart */}
      <Card className="glass-card border-glass-border">
        <CardHeader>
          <CardTitle className="text-white">Mood Trend (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={moodTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" />
              <YAxis domain={[1, 5]} stroke="#9ca3af" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                formatter={(value: number | null) => [
                  value ? `${value.toFixed(1)} (${Object.keys(moodValues).find(k => moodValues[k] === Math.round(value || 0)) || 'neutral'})` : 'No entries',
                  'Mood'
                ]}
              />
              <Line 
                type="monotone" 
                dataKey="mood" 
                stroke="#3b82f6" 
                strokeWidth={2}
                connectNulls={false}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="text-white">Mood Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={moodDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="count"
                  label={({ mood, count }) => `${mood}: ${count}`}
                >
                  {moodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Writing Frequency */}
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="text-white">Writing Frequency</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={writingFrequency}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="entries" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Tags */}
      {tagPopularity.length > 0 && (
        <Card className="glass-card border-glass-border">
          <CardHeader>
            <CardTitle className="text-white">Most Used Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {tagPopularity.map(({ tag, count }) => (
                <div key={tag} className="text-center p-3 rounded-lg bg-white/5 border border-glass-border">
                  <div className="text-lg font-semibold text-white">{count}</div>
                  <div className="text-sm text-gray-400">{tag}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}