import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { JournalEntry } from "@shared/schema";

interface JournalCalendarProps {
  entries: JournalEntry[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onCreateEntry: (date: Date) => void;
}

const moodEmojis: Record<string, string> = {
  excellent: "😁",
  good: "😊", 
  neutral: "😐",
  bad: "😟",
  terrible: "😭"
};

export default function JournalCalendar({ entries, selectedDate, onDateSelect, onCreateEntry }: JournalCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEntriesForDate = (date: Date) => {
    return entries.filter(entry => 
      isSameDay(new Date(entry.createdAt), date)
    );
  };

  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <Card className="p-6 glass-card border-glass-border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={previousMonth}
            className="glass-button border-glass-border text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={nextMonth}
            className="glass-button border-glass-border text-white hover:bg-white/10"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayEntries = getEntriesForDate(day);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isCurrentMonth = isSameMonth(day, currentMonth);
          
          return (
            <div
              key={day.toISOString()}
              className={`
                relative p-2 min-h-[60px] cursor-pointer rounded-lg transition-all
                ${isSelected ? 'bg-blue-500/20 border border-blue-500/50' : 'hover:bg-white/5'}
                ${!isCurrentMonth ? 'opacity-50' : ''}
              `}
              onClick={() => onDateSelect(day)}
            >
              <div className="text-sm text-white mb-1">
                {format(day, "d")}
              </div>
              
              {/* Entry indicators */}
              <div className="space-y-1">
                {dayEntries.slice(0, 2).map(entry => (
                  <div key={entry.id} className="flex items-center gap-1">
                    <span className="text-xs">
                      {moodEmojis[entry.mood] || "📝"}
                    </span>
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  </div>
                ))}
                {dayEntries.length > 2 && (
                  <div className="text-xs text-gray-400">
                    +{dayEntries.length - 2} more
                  </div>
                )}
              </div>

              {/* Add entry button */}
              {isSelected && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute bottom-1 right-1 h-6 w-6 p-0 glass-button border-glass-border"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateEntry(day);
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected date entries */}
      {selectedDate && (
        <div className="mt-6 pt-6 border-t border-glass-border">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-white">
              Entries for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : ""}
            </h4>
            <Button
              size="sm"
              onClick={() => onCreateEntry(selectedDate)}
              className="glass-button border-glass-border text-white hover:bg-white/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </div>
          
          <div className="space-y-2">
            {getEntriesForDate(selectedDate).map(entry => (
              <div key={entry.id} className="p-3 rounded-lg bg-white/5 border border-glass-border">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{entry.mood ? moodEmojis[entry.mood] || "📝" : "📝"}</span>
                    <div>
                      <h5 className="font-medium text-white">{entry.title}</h5>
                      <p className="text-sm text-gray-300 line-clamp-2">{entry.content}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {entry.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {getEntriesForDate(selectedDate).length === 0 && (
              <p className="text-gray-400 text-center py-4">
                No entries for this date. Click "Add Entry" to create one.
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}