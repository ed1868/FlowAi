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
      if (currentSessionId) {
        completeSession(currentSessionId);
      }
      // Browser notification
      if (Notification.permission === "granted") {
        new Notification("Focus Session Complete!", {
          body: "Great job! Your 90-minute focus session is done.",
        });
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
    if (sessionStartTime) {
      const actualMinutes = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60);
      setShowCompletionForm(true);
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
        return [25, 5]; // Work, break
      case "ultradian":
        return [90, 20]; // Work, break
      case "flowtime":
        return [90]; // Just work
      default:
        return [25, 45, 90]; // Standard options
    }
  };

  const getWorkflowDescription = () => {
    switch (workflow) {
      case "pomodoro":
        return "25 minutes of focused work followed by a 5-minute break";
      case "ultradian":
        return "90 minutes of deep work aligned with natural attention cycles";
      case "flowtime":
        return "Flexible duration based on your flow state";
      default:
        return "Choose your preferred work duration";
    }
  };

  return (
    <div>
      <h3>Focus Timer</h3>
      
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
        {[25, 45, 90].map(minutes => (
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
          width: `${100 - (timeLeft / (90 * 60)) * 100}%`,
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
            cursor: "pointer"
          }}
        >
          Reset
        </button>
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

      {/* Instructions */}
      <div style={{ 
        marginTop: "30px", 
        padding: "15px", 
        backgroundColor: "#1a1a1a", 
        border: "1px solid #333",
        borderRadius: "5px"
      }}>
        <h4>How to use:</h4>
        <ul style={{ paddingLeft: "20px" }}>
          <li>Choose your session type and duration</li>
          <li>Click Start to begin your focus session</li>
          <li>Stay focused until the timer completes</li>
          <li>You'll get a notification when time is up</li>
          <li>Sessions are automatically saved to your history</li>
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