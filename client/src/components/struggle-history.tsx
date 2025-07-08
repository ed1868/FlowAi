import { useQuery } from "@tanstack/react-query";

interface HabitStruggle {
  id: number;
  habitId: number;
  userId: string;
  note: string;
  intensity: number;
  triggers?: string;
  location?: string;
  mood?: string;
  createdAt: string;
}

interface StruggleHistoryProps {
  habitId: number;
}

export default function StruggleHistory({ habitId }: StruggleHistoryProps) {
  const { data: struggles = [], isLoading } = useQuery({
    queryKey: ["/api/habits", habitId, "struggles"],
    enabled: !!habitId,
  });

  if (isLoading) {
    return (
      <div className="glass-button rounded-lg p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (struggles.length === 0) {
    return (
      <div className="glass-button rounded-lg p-4 text-center">
        <div className="text-text-secondary">
          <i className="fas fa-heart text-apple-green mr-2"></i>
          No struggles recorded yet. You're doing great! 💪
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {struggles.map((struggle: HabitStruggle) => (
        <div key={struggle.id} className="glass-button rounded-lg p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i
                    key={i}
                    className={`fas fa-circle text-xs ${
                      i < struggle.intensity ? "text-red-400" : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-text-secondary">
                Intensity: {struggle.intensity}/5
              </span>
            </div>
            <div className="text-xs text-text-tertiary">
              {new Date(struggle.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          <p className="text-sm mb-3">{struggle.note}</p>
          
          {(struggle.triggers || struggle.location || struggle.mood) && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {struggle.triggers && (
                <div className="glass-input p-2 rounded">
                  <span className="text-text-secondary">Triggers:</span> {struggle.triggers}
                </div>
              )}
              {struggle.location && (
                <div className="glass-input p-2 rounded">
                  <span className="text-text-secondary">Location:</span> {struggle.location}
                </div>
              )}
              {struggle.mood && (
                <div className="glass-input p-2 rounded">
                  <span className="text-text-secondary">Mood:</span> {struggle.mood}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}