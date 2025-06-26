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

  // Get journal entries
  const { data: entries = [], isLoading, error } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
    enabled: isAuthenticated,
  });

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

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (entryData: any) => {
      const response = await apiRequest("POST", "/api/journal", entryData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/dashboard"] });
      resetForm();
      toast({
        title: "Entry Created",
        description: "Your journal entry has been saved successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to create journal entry",
        variant: "destructive",
      });
    },
  });

  // Update entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async ({ entryId, updateData }: { entryId: number; updateData: any }) => {
      const response = await apiRequest("PATCH", `/api/journal/${entryId}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      resetForm();
      toast({
        title: "Entry Updated",
        description: "Your journal entry has been updated successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to update journal entry",
        variant: "destructive",
      });
    },
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: number) => {
      const response = await apiRequest("DELETE", `/api/journal/${entryId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Entry Deleted",
        description: "Your journal entry has been deleted.",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
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
      toast({
        title: "Error",
        description: "Failed to delete journal entry",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setMood("");
    setTags("");
    setEditingEntry(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please write something in your journal entry",
        variant: "destructive",
      });
      return;
    }

    const entryData = {
      title: title.trim() || undefined,
      content: content.trim(),
      mood: mood || undefined,
      tags: tags ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : undefined,
    };

    if (editingEntry) {
      updateEntryMutation.mutate({
        entryId: editingEntry.id,
        updateData: entryData,
      });
    } else {
      createEntryMutation.mutate(entryData);
    }
  };

  const editEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title || "");
    setContent(entry.content);
    setMood(entry.mood || "");
    setTags(entry.tags?.join(", ") || "");
  };

  const deleteEntry = (entryId: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteEntryMutation.mutate(entryId);
    }
  };

  // Filter entries based on search
  const filteredEntries = entries.filter(entry =>
    entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-1">
        <Card className="glass-card rounded-3xl p-8">
          <CardContent className="p-0">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue mx-auto"></div>
            <p className="text-text-secondary mt-4">Loading journal...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-1 text-text-primary pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Journal</h1>
          <p className="text-xl text-text-secondary">
            Capture your thoughts, insights, and reflections
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Entry Form */}
          <Card className="glass-card rounded-3xl p-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <span>{editingEntry ? "Edit Entry" : "New Entry"}</span>
                {editingEntry && (
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    <i className="fas fa-times"></i>
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="Entry title (optional)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="glass-button border-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>

                <div className="flex gap-4">
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger className="glass-button border-none w-32">
                      <SelectValue placeholder="Mood" />
                    </SelectTrigger>
                    <SelectContent>
                      {moodOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <span className="flex items-center gap-2">
                            <span>{option.emoji}</span>
                            <span>{option.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Tags (comma separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="glass-button border-none focus:ring-2 focus:ring-apple-blue flex-1"
                  />
                </div>

                <div>
                  <Textarea
                    placeholder="What's on your mind today?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={12}
                    className="glass-button border-none focus:ring-2 focus:ring-apple-blue resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1 bg-apple-blue hover:bg-apple-blue/80 text-white"
                    disabled={createEntryMutation.isPending || updateEntryMutation.isPending}
                  >
                    <i className="fas fa-save mr-2"></i>
                    {editingEntry ? "Update Entry" : "Save Entry"}
                  </Button>
                  
                  {editingEntry && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Entries List */}
          <div className="space-y-6">
            {/* Search */}
            <Card className="glass-card rounded-2xl p-4">
              <CardContent className="p-0">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"></i>
                  <Input
                    placeholder="Search entries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-button border-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Entries */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => {
                  const selectedMood = moodOptions.find(m => m.value === entry.mood);
                  
                  return (
                    <Card key={entry.id} className="glass-card rounded-2xl p-4">
                      <CardContent className="p-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            {entry.title && (
                              <h3 className="font-semibold text-lg mb-1">{entry.title}</h3>
                            )}
                            <div className="flex items-center gap-3 text-sm text-text-tertiary">
                              <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                              {selectedMood && (
                                <span className={`flex items-center gap-1 ${selectedMood.color}`}>
                                  <span>{selectedMood.emoji}</span>
                                  <span>{selectedMood.label}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => editEntry(entry)}
                              className="text-apple-blue hover:text-apple-indigo"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteEntry(entry.id)}
                              className="text-apple-red hover:text-red-400"
                              disabled={deleteEntryMutation.isPending}
                            >
                              <i className="fas fa-trash"></i>
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-text-secondary leading-relaxed mb-3 line-clamp-3">
                          {entry.content}
                        </p>
                        
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card className="glass-card rounded-2xl p-8">
                  <CardContent className="p-0 text-center">
                    <i className="fas fa-journal-whills text-text-tertiary text-3xl mb-4"></i>
                    <h3 className="text-lg font-semibold mb-2">No entries found</h3>
                    <p className="text-text-tertiary">
                      {searchTerm ? "Try a different search term" : "Start writing your first journal entry"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
