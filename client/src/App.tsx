import React, { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const renderContent = () => {
    switch (activeTab) {
      case "timer":
        return <div>Timer content will go here</div>;
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