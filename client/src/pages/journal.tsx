import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { X, Save, Search, Edit, Trash2, BookOpen } from "lucide-react";

interface JournalEntry {
  id: number;
  title?: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

const moodOptions = [
  { value: "great", label: "Great", emoji: "😄", color: "text-apple-green" },
  { value: "good", label: "Good", emoji: "😊", color: "text-apple-blue" },
  { value: "neutral", label: "Neutral", emoji: "😐", color: "text-text-tertiary" },
  { value: "bad", label: "Bad", emoji: "😔", color: "text-apple-orange" },
  { value: "terrible", label: "Terrible", emoji: "😢", color: "text-apple-red" },
];

export default function Journal() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("");
  const [tags, setTags] = useState<string>("");
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  console.log("Journal rendering - isAuthenticated:", isAuthenticated, "authLoading:", authLoading);

  // Get journal entries
  const { data: entries = [], isLoading, error } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
    enabled: isAuthenticated,
    retry: false,
  });

  console.log("Journal data:", entries, "Loading:", isLoading, "Error:", error?.message);

  // Handle unauthorized errors
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-1 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue mx-auto"></div>
          <p className="text-text-secondary mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-1 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p>Please log in to access the journal.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-1 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Journal</h1>
        
        {/* Basic functionality test */}
        <Card className="glass-card rounded-2xl mb-8">
          <CardHeader>
            <CardTitle>Journal Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Authentication: {isAuthenticated ? 'Yes' : 'No'}</p>
            <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
            <p>Entries count: {entries.length}</p>
            <p>Error: {error?.message || 'None'}</p>
          </CardContent>
        </Card>

        {/* Show entries if available */}
        {entries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Entries</h2>
            {entries.map((entry) => (
              <Card key={entry.id} className="glass-card rounded-2xl">
                <CardContent className="p-4">
                  <h3 className="font-semibold">{entry.title || 'Untitled'}</h3>
                  <p className="text-text-secondary">{entry.content}</p>
                  <p className="text-sm text-text-tertiary mt-2">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}