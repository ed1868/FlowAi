import React, { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

function TimerComponent() {
  const [timeLeft, setTimeLeft] = useState(90 * 60); // 90 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState("deep_work");
  const [workflow, setWorkflow] = useState("standard");
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  
  // Session completion form
  const [showCompletionForm, setShowCompletionForm] = useState(false);
  
  // Pomodoro cycle tracking
  const [pomodoroSession, setPomodoroSession] = useState(1); // Current session number
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [mood, setMood] = useState("");
  const [setbacks, setSetbacks] = useState("");
  const [notes, setNotes] = useState("");
  const [productivity, setProductivity] = useState(5);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer countdown effect
  useEffect(() => {
    let interval: number | undefined;
    
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      setIsRunning(false);
      
      if (workflow === "pomodoro") {
        handlePomodoroComplete();
      } else {
        // Regular session completion
        if (Notification.permission === "granted") {
          new Notification("Focus Session Complete!", {
            body: "Great job! Your focus session is done.",
          });
        }
        if (currentSessionId) {
          setShowCompletionForm(true);
        }
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, currentSessionId]);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Session History Query
  const { data: sessionHistory = [] } = useQuery({
    queryKey: ["/api/sessions"],
  });

  const sessions = Array.isArray(sessionHistory) ? sessionHistory : [];

  // API calls
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const plannedMinutes = Math.floor(timeLeft / 60);
      const response = await apiRequest("POST", "/api/sessions", {
        startTime: new Date().toISOString(),
        plannedDuration: plannedMinutes,
        type: sessionType,
        workflow: workflow,
        completed: false,
      });
      return response.json();
    },
    onSuccess: (session) => {
      setCurrentSessionId(session.id);
      setSessionStartTime(new Date());
      setIsRunning(true);
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async (data: {
      sessionId: number;
      actualDuration?: number;
      mood?: string;
      setbacks?: string;
      notes?: string;
      productivity?: number;
    }) => {
      const response = await apiRequest("PATCH", `/api/sessions/${data.sessionId}`, {
        endTime: new Date().toISOString(),
        completed: true,
        actualDuration: data.actualDuration,
        mood: data.mood,
        setbacks: data.setbacks,
        notes: data.notes,
        productivity: data.productivity,
      });
      return response.json();
    },
    onSuccess: () => {
      // Reset form
      setMood("");
      setSetbacks("");
      setNotes("");
      setProductivity(5);
      setShowCompletionForm(false);
      setCurrentSessionId(null);
      // Refetch session history
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });

  const completeSession = (sessionId: number) => {
    setShowCompletionForm(true);
  };

  const handlePomodoroComplete = () => {
    if (isOnBreak) {
      // Break finished, start next work session
      setIsOnBreak(false);
      setPomodoroSession(prev => prev + 1);
      setTimeLeft(25 * 60); // 25 minutes work
      
      if (Notification.permission === "granted") {
        new Notification("Break Complete!", {
          body: `Time to focus! Starting Pomodoro session ${pomodoroSession + 1}`,
        });
      }
    } else {
      // Work session finished
      setCompletedCycles(prev => prev + 1);
      
      if (pomodoroSession === 4) {
        // After 4 sessions, take longer break
        setTimeLeft(30 * 60); // 30 minute long break
        setPomodoroSession(1);
        if (Notification.permission === "granted") {
          new Notification("Long Break Time!", {
            body: "You've completed 4 Pomodoro sessions! Take a 30-minute break.",
          });
        }
      } else {
        // Regular 5-minute break
        setTimeLeft(5 * 60); // 5 minute break
        if (Notification.permission === "granted") {
          new Notification("Break Time!", {
            body: "Great work! Take a 5-minute break.",
          });
        }
      }
      
      setIsOnBreak(true);
      
      // Show completion form for work sessions
      if (currentSessionId) {
        setShowCompletionForm(true);
      }
    }
  };

  const handleStart = () => {
    if (timeLeft === 0) {
      setTimeLeft(90 * 60); // Reset timer
    }
    startSessionMutation.mutate();
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(90 * 60);
    if (currentSessionId) {
      setCurrentSessionId(null);
    }
  };

  const handleDurationChange = (minutes: number) => {
    if (!isRunning) {
      setTimeLeft(minutes * 60);
    }
  };

  const handleCompleteSession = () => {
    if (currentSessionId && sessionStartTime) {
      const actualMinutes = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60);
      updateSessionMutation.mutate({
        sessionId: currentSessionId,
        actualDuration: actualMinutes,
        mood,
        setbacks: setbacks || undefined,
        notes: notes || undefined,
        productivity,
      });
    }
  };

  const getWorkflowDurations = () => {
    switch (workflow) {
      case "pomodoro":
        return [25]; // 25-minute focused work sessions
      case "ultradian":
        return [90, 120]; // 90-120 minute natural cycles
      case "flowtime":
        return [30, 60, 90, 120]; // Flexible timing based on flow
      default:
        return [15, 30, 45, 60, 90]; // Standard options
    }
  };

  const getWorkflowDescription = () => {
    switch (workflow) {
      case "pomodoro":
        return "25-minute focused work sessions. Take 5-min breaks between sessions, 15-30min break after 4 sessions";
      case "ultradian":
        return "90-120 minute cycles aligned with your natural attention rhythms. Take 20-30min breaks between cycles";
      case "flowtime":
        return "Work as long as you're in flow state, then take breaks as needed. Flexible timing based on your energy";
      default:
        return "Traditional focused work sessions with flexible timing options";
    }
  };

  return (
    <div>
      <h3>Focus Timer</h3>
      
      {/* Workflow Method Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>Workflow Method:</label>
        <select 
          value={workflow} 
          onChange={(e) => setWorkflow(e.target.value)}
          disabled={isRunning}
          style={{ padding: "5px", backgroundColor: "#333", color: "#fff", border: "1px solid #555", marginRight: "10px" }}
        >
          <option value="standard">Standard</option>
          <option value="pomodoro">Pomodoro</option>
          <option value="ultradian">Ultradian Rhythms</option>
          <option value="flowtime">Flowtime</option>
        </select>
        <small style={{ color: "#888" }}>{getWorkflowDescription()}</small>
      </div>

      {/* Session Type Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>Session Type:</label>
        <select 
          value={sessionType} 
          onChange={(e) => setSessionType(e.target.value)}
          disabled={isRunning}
          style={{ padding: "5px", backgroundColor: "#333", color: "#fff", border: "1px solid #555" }}
        >
          <option value="deep_work">Deep Work</option>
          <option value="study">Study</option>
          <option value="reading">Reading</option>
          <option value="writing">Writing</option>
          <option value="creative">Creative</option>
        </select>
      </div>

      {/* Duration Presets */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>Duration:</label>
        {getWorkflowDurations().map(minutes => (
          <button
            key={minutes}
            onClick={() => handleDurationChange(minutes)}
            disabled={isRunning}
            style={{
              margin: "0 5px",
              padding: "5px 10px",
              backgroundColor: timeLeft === minutes * 60 ? "#444" : "#222",
              color: "#fff",
              border: "1px solid #555",
              cursor: isRunning ? "not-allowed" : "pointer"
            }}
          >
            {minutes}m
          </button>
        ))}
      </div>

      {/* Timer Display */}
      <div style={{ 
        fontSize: "48px", 
        fontFamily: "monospace", 
        textAlign: "center", 
        margin: "30px 0",
        padding: "20px",
        backgroundColor: "#222",
        border: "2px solid #444",
        borderRadius: "10px"
      }}>
        {formatTime(timeLeft)}
      </div>

      {/* Progress Bar */}
      <div style={{ 
        width: "100%", 
        height: "20px", 
        backgroundColor: "#333", 
        borderRadius: "10px", 
        marginBottom: "20px",
        overflow: "hidden"
      }}>
        <div style={{
          width: sessionStartTime ? `${100 - (timeLeft / (90 * 60)) * 100}%` : "0%",
          height: "100%",
          backgroundColor: "#4CAF50",
          transition: "width 1s ease"
        }} />
      </div>

      {/* Control Buttons */}
      <div style={{ textAlign: "center" }}>
        {!isRunning ? (
          <button
            onClick={handleStart}
            disabled={startSessionMutation.isPending}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#4CAF50",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginRight: "10px"
            }}
          >
            {timeLeft === 90 * 60 ? "Start" : "Resume"}
          </button>
        ) : (
          <button
            onClick={handlePause}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#FF9800",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginRight: "10px"
            }}
          >
            Pause
          </button>
        )}
        
        <button
          onClick={handleReset}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: "#f44336",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginRight: "10px"
          }}
        >
          Reset
        </button>

        {currentSessionId && (
          <button
            onClick={() => setShowCompletionForm(true)}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#2196F3",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Complete Session
          </button>
        )}
      </div>

      {/* Session Status */}
      {currentSessionId && (
        <div style={{ 
          marginTop: "20px", 
          padding: "10px", 
          backgroundColor: "#1a4d2e", 
          border: "1px solid #4CAF50",
          borderRadius: "5px",
          textAlign: "center"
        }}>
          Session Active - Stay focused! 🎯
        </div>
      )}

      {/* Session Completion Form */}
      {showCompletionForm && (
        <div style={{ 
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          backgroundColor: "#222",
          border: "2px solid #444",
          borderRadius: "10px",
          padding: "30px",
          width: "400px",
          zIndex: 1000
        }}>
          <h4 style={{ marginBottom: "20px" }}>Session Complete! 🎉</h4>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>How did you feel?</label>
            <select 
              value={mood} 
              onChange={(e) => setMood(e.target.value)}
              style={{ width: "100%", padding: "8px", backgroundColor: "#333", color: "#fff", border: "1px solid #555" }}
            >
              <option value="">Select mood...</option>
              <option value="energized">Energized</option>
              <option value="focused">Focused</option>
              <option value="calm">Calm</option>
              <option value="tired">Tired</option>
              <option value="distracted">Distracted</option>
              <option value="stressed">Stressed</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Productivity (1-10)</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={productivity}
              onChange={(e) => setProductivity(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ textAlign: "center", color: "#888" }}>{productivity}/10</div>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Any setbacks or interruptions?</label>
            <textarea 
              value={setbacks}
              onChange={(e) => setSetbacks(e.target.value)}
              placeholder="Phone notifications, noise, etc..."
              style={{ 
                width: "100%", 
                height: "60px", 
                padding: "8px", 
                backgroundColor: "#333", 
                color: "#fff", 
                border: "1px solid #555",
                borderRadius: "3px"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Session notes</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you work on? How did it go?"
              style={{ 
                width: "100%", 
                height: "60px", 
                padding: "8px", 
                backgroundColor: "#333", 
                color: "#fff", 
                border: "1px solid #555",
                borderRadius: "3px"
              }}
            />
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={handleCompleteSession}
              disabled={updateSessionMutation.isPending}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              {updateSessionMutation.isPending ? "Saving..." : "Save Session"}
            </button>
            <button
              onClick={() => setShowCompletionForm(false)}
              style={{
                flex: 1,
                padding: "12px",
                backgroundColor: "#666",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Session History */}
      <div style={{ 
        marginTop: "30px", 
        padding: "15px", 
        backgroundColor: "#1a1a1a", 
        border: "1px solid #333",
        borderRadius: "5px"
      }}>
        <h4>Recent Sessions</h4>
        {sessions.length === 0 ? (
          <p style={{ color: "#888" }}>No sessions yet. Start your first focus session!</p>
        ) : (
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {sessions.slice(0, 5).map((session: any) => (
              <div key={session.id} style={{ 
                padding: "10px", 
                marginBottom: "10px", 
                backgroundColor: "#2a2a2a", 
                border: "1px solid #444",
                borderRadius: "5px"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>{session.type} - {session.workflow}</span>
                  <span style={{ color: "#888" }}>
                    {session.actualDuration || session.plannedDuration}min
                  </span>
                </div>
                {session.mood && (
                  <div style={{ fontSize: "12px", color: "#aaa" }}>
                    Mood: {session.mood} | Productivity: {session.productivity}/10
                  </div>
                )}
                {session.setbacks && (
                  <div style={{ fontSize: "12px", color: "#f44336" }}>
                    Setbacks: {session.setbacks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div style={{ 
        marginTop: "20px", 
        padding: "15px", 
        backgroundColor: "#1a1a1a", 
        border: "1px solid #333",
        borderRadius: "5px"
      }}>
        <h4>Workflow Methods:</h4>
        <ul style={{ paddingLeft: "20px", color: "#ccc" }}>
          <li><strong>Pomodoro:</strong> 25min work + 5min break cycles</li>
          <li><strong>Ultradian:</strong> 90min work + 20min break (natural rhythms)</li>
          <li><strong>Flowtime:</strong> Work until you naturally need a break</li>
          <li><strong>Standard:</strong> Traditional fixed-duration sessions</li>
        </ul>
      </div>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const renderContent = () => {
    switch (activeTab) {
      case "timer":
        return <TimerComponent />;
      case "journal":
        return <div>Journal content will go here</div>;
      case "voice-notes":
        return <div>Voice Notes content will go here</div>;
      case "habits":
        return <div>Habits content will go here</div>;
      case "analytics":
        return <div>Analytics content will go here</div>;
      default:
        return <div>Welcome to your Flow dashboard!</div>;
    }
  };
  
  return (
    <div style={{ padding: "20px", backgroundColor: "#000", color: "#fff", minHeight: "100vh" }}>
      <div style={{ borderBottom: "1px solid #333", paddingBottom: "20px", marginBottom: "20px" }}>
        <h1>Flow Dashboard</h1>
        <p>Welcome, {user?.firstName || user?.email || "User"}!</p>
        <a href="/api/logout" style={{ color: "#fff", textDecoration: "underline" }}>
          Logout
        </a>
      </div>
      
      <div style={{ marginBottom: "30px" }}>
        <nav>
          {["dashboard", "timer", "journal", "voice-notes", "habits", "analytics"].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ 
                margin: "5px", 
                padding: "10px 15px", 
                backgroundColor: activeTab === tab ? "#444" : "#222", 
                color: "#fff", 
                border: "1px solid #555",
                cursor: "pointer"
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
            </button>
          ))}
        </nav>
      </div>
      
      <div style={{ padding: "20px", backgroundColor: "#111", border: "1px solid #333" }}>
        <h2>Current Tab: {activeTab}</h2>
        {renderContent()}
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div style={{ 
      padding: "20px", 
      backgroundColor: "#000", 
      color: "#fff", 
      minHeight: "100vh", 
      textAlign: "center",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <h1>Welcome to Flow</h1>
      <p style={{ marginBottom: "30px" }}>Please log in to access your productivity dashboard.</p>
      <a 
        href="/api/login" 
        style={{ 
          color: "#fff", 
          textDecoration: "none", 
          fontSize: "18px",
          backgroundColor: "#333",
          padding: "10px 20px",
          borderRadius: "5px",
          border: "1px solid #555"
        }}
      >
        Log In
      </a>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ 
        padding: "20px", 
        backgroundColor: "#000", 
        color: "#fff", 
        minHeight: "100vh", 
        textAlign: "center",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <Landing />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;