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
  }, [isRunning, timeLeft, currentSessionId, workflow]);

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
      return response;
    },
    onSuccess: (data: any) => {
      setCurrentSessionId(data.id);
      setSessionStartTime(new Date());
      setIsRunning(true);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, actualDuration, mood, setbacks, notes, productivity }: any) => {
      return apiRequest("PATCH", `/api/sessions/${sessionId}`, {
        endTime: new Date().toISOString(),
        duration: actualDuration,
        completed: true,
        mood,
        setbacks,
        notes,
        productivity,
      });
    },
    onSuccess: () => {
      setShowCompletionForm(false);
      setCurrentSessionId(null);
      setSessionStartTime(null);
      setMood("");
      setSetbacks("");
      setNotes("");
      setProductivity(5);
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
    },
  });

  const completeSession = (sessionId: number) => {
    setShowCompletionForm(true);
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
    // Reset Pomodoro state
    setPomodoroSession(1);
    setIsOnBreak(false);
    setCompletedCycles(0);
  };

  const handleDurationChange = (minutes: number) => {
    if (!isRunning) {
      setTimeLeft(minutes * 60);
    }
  };

  // Update timer when workflow changes
  useEffect(() => {
    if (workflow === "pomodoro" && !isRunning) {
      setTimeLeft(25 * 60); // Always 25 minutes for Pomodoro
      setPomodoroSession(1);
      setIsOnBreak(false);
      setCompletedCycles(0);
    } else if (workflow !== "pomodoro" && !isRunning) {
      setTimeLeft(90 * 60); // Default to 90 minutes for other workflows
    }
  }, [workflow, isRunning]);

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

  const getInitialDuration = () => {
    if (workflow === "pomodoro") {
      return isOnBreak ? (pomodoroSession === 1 ? 30 * 60 : 5 * 60) : 25 * 60;
    }
    return Math.floor(timeLeft / 60) * 60 || 90 * 60;
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
          style={{ 
            padding: "5px", 
            marginRight: "20px", 
            backgroundColor: "#333", 
            color: "#fff", 
            border: "1px solid #555",
            borderRadius: "3px"
          }}
        >
          <option value="standard">Standard</option>
          <option value="pomodoro">Pomodoro</option>
          <option value="ultradian">Ultradian</option>
          <option value="flowtime">Flowtime</option>
        </select>
        
        <label style={{ marginRight: "10px" }}>Session Type:</label>
        <select 
          value={sessionType} 
          onChange={(e) => setSessionType(e.target.value)}
          style={{ 
            padding: "5px", 
            backgroundColor: "#333", 
            color: "#fff", 
            border: "1px solid #555",
            borderRadius: "3px"
          }}
        >
          <option value="deep_work">Deep Work</option>
          <option value="study">Study</option>
          <option value="reading">Reading</option>
          <option value="writing">Writing</option>
          <option value="creative">Creative</option>
        </select>
      </div>

      {/* Workflow Description */}
      <div style={{ marginBottom: "20px", fontStyle: "italic", color: "#ccc" }}>
        {getWorkflowDescription()}
      </div>

      {/* Pomodoro Status */}
      {workflow === "pomodoro" && (
        <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#2a2a2a", borderRadius: "5px" }}>
          <div>Session: {pomodoroSession}/4</div>
          <div>Status: {isOnBreak ? "Break Time" : "Work Time"}</div>
          <div>Completed Cycles: {completedCycles}</div>
        </div>
      )}

      {/* Duration Selector */}
      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>Duration:</label>
        {getWorkflowDurations().map(minutes => (
          <button
            key={minutes}
            onClick={() => handleDurationChange(minutes)}
            disabled={isRunning}
            style={{
              padding: "5px 10px",
              margin: "0 5px",
              backgroundColor: timeLeft === minutes * 60 ? "#4CAF50" : "#333",
              color: "#fff",
              border: "none",
              borderRadius: "3px",
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
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: "20px",
        color: timeLeft < 300 ? "#ff6b6b" : "#4CAF50" // Red when < 5 minutes
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
          width: sessionStartTime ? `${100 - (timeLeft / (workflow === "pomodoro" ? 25 * 60 : 90 * 60)) * 100}%` : "0%",
          height: "100%",
          backgroundColor: "#4CAF50",
          transition: "width 1s ease"
        }} />
      </div>

      {/* Timer Controls */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        {!isRunning ? (
          <button
            onClick={handleStart}
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
            Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            style={{
              padding: "15px 30px",
              fontSize: "18px",
              backgroundColor: "#ff9800",
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

      {/* Session Completion Form */}
      {showCompletionForm && (
        <div style={{ 
          marginTop: "30px", 
          padding: "20px", 
          backgroundColor: "#2a2a2a", 
          borderRadius: "10px",
          border: "1px solid #333"
        }}>
          <h4>How was your session?</h4>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Mood:</label>
            <select 
              value={mood} 
              onChange={(e) => setMood(e.target.value)}
              style={{ width: "100%", padding: "5px" }}
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
            <label style={{ display: "block", marginBottom: "5px" }}>Productivity (1-10):</label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={productivity} 
              onChange={(e) => setProductivity(parseInt(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ textAlign: "center", marginTop: "5px" }}>{productivity}/10</div>
          </div>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Setbacks or distractions:</label>
            <input 
              type="text" 
              value={setbacks} 
              onChange={(e) => setSetbacks(e.target.value)}
              placeholder="What interrupted your focus?"
              style={{ width: "100%", padding: "5px" }}
            />
          </div>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>Notes:</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other thoughts about this session?"
              style={{ width: "100%", padding: "5px", height: "60px" }}
            />
          </div>
          
          <div style={{ textAlign: "center" }}>
            <button
              onClick={handleCompleteSession}
              style={{
                padding: "10px 20px",
                backgroundColor: "#4CAF50",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                marginRight: "10px"
              }}
            >
              Save Session
            </button>
            <button
              onClick={() => setShowCompletionForm(false)}
              style={{
                padding: "10px 20px",
                backgroundColor: "#666",
                color: "#fff",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Session History */}
      <div style={{ 
        marginTop: "30px", 
        padding: "20px", 
        backgroundColor: "#2a2a2a", 
        borderRadius: "10px",
        border: "1px solid #333"
      }}>
        <h4>Recent Sessions</h4>
        {sessions.length === 0 ? (
          <p style={{ color: "#888" }}>No sessions yet. Start your first focus session!</p>
        ) : (
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {sessions.slice(0, 5).map((session: any) => (
              <div key={session.id} style={{ 
                marginBottom: "10px", 
                padding: "10px", 
                backgroundColor: "#333", 
                borderRadius: "5px" 
              }}>
                <div style={{ fontWeight: "bold" }}>
                  {session.type.replace('_', ' ')} - {session.workflow} ({session.duration || session.plannedDuration}min)
                </div>
                <div style={{ fontSize: "12px", color: "#ccc" }}>
                  {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString()}
                </div>
                {session.mood && <div style={{ fontSize: "12px" }}>Mood: {session.mood}</div>}
                {session.productivity && <div style={{ fontSize: "12px" }}>Productivity: {session.productivity}/10</div>}
                {session.notes && <div style={{ fontSize: "12px", color: "#aaa" }}>"{session.notes}"</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState("timer");

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>Flow - Productivity Station</h1>
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: "30px", borderBottom: "1px solid #333" }}>
        {["timer", "journal", "habits", "voice-notes", "analytics"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              marginRight: "10px",
              backgroundColor: activeTab === tab ? "#4CAF50" : "transparent",
              color: "#fff",
              border: "none",
              borderBottom: activeTab === tab ? "2px solid #4CAF50" : "2px solid transparent",
              cursor: "pointer",
              textTransform: "capitalize"
            }}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "timer" && <TimerComponent />}
        {activeTab === "journal" && <div><h3>Journal</h3><p>Journal feature coming soon...</p></div>}
        {activeTab === "habits" && <div><h3>Habits</h3><p>Habit tracking coming soon...</p></div>}
        {activeTab === "voice-notes" && <div><h3>Voice Notes</h3><p>Voice notes coming soon...</p></div>}
        {activeTab === "analytics" && <div><h3>Analytics</h3><p>Analytics dashboard coming soon...</p></div>}
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div style={{ textAlign: "center", padding: "50px" }}>
      <h1>Welcome to Flow</h1>
      <p>Your comprehensive productivity station</p>
      <a 
        href="/api/login"
        style={{
          display: "inline-block",
          padding: "15px 30px",
          backgroundColor: "#4CAF50",
          color: "#fff",
          textDecoration: "none",
          borderRadius: "5px",
          fontSize: "18px"
        }}
      >
        Login to Get Started
      </a>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div style={{ textAlign: "center", padding: "50px" }}>Loading...</div>;
  }

  return isAuthenticated ? <Dashboard /> : <Landing />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ 
        minHeight: "100vh", 
        backgroundColor: "#1a1a1a", 
        color: "#fff",
        fontFamily: "Arial, sans-serif"
      }}>
        <AppContent />
      </div>
    </QueryClientProvider>
  );
}

export default App;