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
    <div className="space-y-4">
      {struggles.map((struggle: HabitStruggle) => (
        <div key={struggle.id} className="glass-button rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <i
                    key={i}
                    className={`fas fa-circle text-sm ${
                      i < struggle.intensity ? "text-red-400" : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-text-secondary font-medium">
                Intensity: {struggle.intensity}/5
              </span>
            </div>
            <div className="text-sm text-text-tertiary">
              {new Date(struggle.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
          
          <div className="bg-white/5 rounded-lg p-3">
            <div className="text-sm text-text-secondary mb-1 font-medium">What happened:</div>
            <p className="text-sm leading-relaxed">{struggle.note}</p>
          </div>
          
          {(struggle.triggers || struggle.location || struggle.mood) && (
            <div className="grid grid-cols-1 gap-3">
              {struggle.triggers && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <i className="fas fa-bolt text-orange-400 mr-2"></i>
                    <span className="text-sm font-medium text-orange-300">Triggers</span>
                  </div>
                  <p className="text-sm text-text-primary">{struggle.triggers}</p>
                </div>
              )}
              {struggle.location && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <i className="fas fa-map-marker-alt text-blue-400 mr-2"></i>
                    <span className="text-sm font-medium text-blue-300">Location</span>
                  </div>
                  <p className="text-sm text-text-primary">{struggle.location}</p>
                </div>
              )}
              {struggle.mood && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="flex items-center mb-1">
                    <i className="fas fa-heart text-purple-400 mr-2"></i>
                    <span className="text-sm font-medium text-purple-300">Mood</span>
                  </div>
                  <p className="text-sm text-text-primary">{struggle.mood}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}