import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Calendar,
  TrendingUp,
  Sparkles,
  Heart,
  Smile,
  Meh,
  Frown,
  Tag
} from "lucide-react";
import JournalCalendar from "@/components/journal-calendar";
import JournalTrends from "@/components/journal-trends";
import FlowAI from "@/components/flow-ai";
import type { JournalEntry } from "@shared/schema";

const moodOptions = [
  { value: "excellent", label: "Excellent", icon: "😁", color: "text-green-500" },
  { value: "good", label: "Good", icon: "😊", color: "text-blue-500" },
  { value: "neutral", label: "Neutral", icon: "😐", color: "text-yellow-500" },
  { value: "bad", label: "Bad", icon: "😟", color: "text-orange-500" },
  { value: "terrible", label: "Terrible", icon: "😭", color: "text-red-500" },
];

export default function Journal() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMood, setFilterMood] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState("entries");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Fetch journal entries
  const { data: entries = [], isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  // Mutations
  const createEntryMutation = useMutation({
    mutationFn: (newEntry: any) => apiRequest("/api/journal", "POST", newEntry),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      resetForm();
      setIsCreateDialogOpen(false);
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: ({ id, ...updateData }: any) => 
      apiRequest(`/api/journal/${id}`, "PATCH", updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      setEditingEntry(null);
      resetForm();
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/journal/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setMood("");
    setTags("");
    setIsPrivate(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const entryData = {
      title: title || "Untitled Entry",
      content,
      mood: mood || "neutral",
      tags: tags ? tags.split(",").map(tag => tag.trim()).filter(Boolean) : [],
      isPrivate,
    };

    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, ...entryData });
    } else {
      createEntryMutation.mutate(entryData);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title || "");
    setContent(entry.content);
    setMood(entry.mood || "");
    setTags(entry.tags?.join(", ") || "");
    setIsPrivate(entry.isPrivate || false);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      deleteEntryMutation.mutate(id);
    }
  };

  // Filter and sort entries
  const filteredEntries = entries
    .filter((entry: JournalEntry) => {
      const matchesSearch = !searchQuery || 
        entry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesMood = !filterMood || filterMood === "all" || entry.mood === filterMood;
      
      return matchesSearch && matchesMood;
    })
    .sort((a: JournalEntry, b: JournalEntry) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title":
          return (a.title || "").localeCompare(b.title || "");
        case "mood":
          return (a.mood || "").localeCompare(b.mood || "");
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-apple-blue border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            📝 Journal
          </h1>
          <p className="text-text-secondary text-lg">
            Capture your thoughts, reflect on your day, and track your emotional journey
          </p>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-4 glass-card border-glass-border">
            <TabsTrigger value="entries" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Entries
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="flowai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              FlowAI
            </TabsTrigger>
          </TabsList>

          {/* Entries Tab */}
          <TabsContent value="entries" className="mt-8">
            {/* Controls */}
            <div className="glass-card rounded-2xl p-6 mb-8">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-tertiary" />
                    <Input
                      placeholder="Search entries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 glass-input border-glass-border"
                    />
                  </div>

                  {/* Mood Filter */}
                  <Select value={filterMood} onValueChange={setFilterMood}>
                    <SelectTrigger className="w-40 glass-button border-glass-border">
                      <SelectValue placeholder="Filter mood" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All moods</SelectItem>
                      {moodOptions.map(mood => (
                        <SelectItem key={mood.value} value={mood.value}>
                          {mood.icon} {mood.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-32 glass-button border-glass-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="oldest">Oldest</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="mood">Mood</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Create Button */}
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-apple-blue hover:bg-apple-blue/80 text-white">
                      <Plus size={16} className="mr-2" />
                      New Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass-card border-glass-border max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="gradient-text">Create New Journal Entry</DialogTitle>
                    </DialogHeader>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                        <Label htmlFor="title" className="text-text-primary">Title</Label>
                        <Input
                          id="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="Give your entry a title..."
                          className="glass-input border-glass-border mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="content" className="text-text-primary">Content</Label>
                        <Textarea
                          id="content"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="What's on your mind?"
                          className="glass-input border-glass-border mt-2 min-h-[150px]"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="mood" className="text-text-primary">Mood</Label>
                          <Select value={mood} onValueChange={setMood}>
                            <SelectTrigger className="glass-button border-glass-border mt-2">
                              <SelectValue placeholder="How are you feeling?" />
                            </SelectTrigger>
                            <SelectContent>
                              {moodOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.icon} {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="tags" className="text-text-primary">Tags</Label>
                          <Input
                            id="tags"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            placeholder="work, reflection, goals..."
                            className="glass-input border-glass-border mt-2"
                          />
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="private"
                          checked={isPrivate}
                          onCheckedChange={setIsPrivate}
                        />
                        <Label htmlFor="private" className="text-text-primary">
                          Make this entry private
                        </Label>
                      </div>

                      <div className="flex justify-end gap-3">
                        <Button
                          type="submit"
                          disabled={createEntryMutation.isPending}
                          className="bg-apple-blue hover:bg-apple-blue/80 text-white"
                        >
                          {createEntryMutation.isPending ? "Creating..." : "Create Entry"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            resetForm();
                            setIsCreateDialogOpen(false);
                          }}
                          className="glass-button border-glass-border"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Entries Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEntries.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {searchQuery || filterMood !== "all" ? "No entries found" : "Start your journal"}
                  </h3>
                  <p className="text-text-secondary mb-6">
                    {searchQuery || filterMood !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Create your first journal entry to begin capturing your thoughts and experiences"
                    }
                  </p>
                  {!searchQuery && filterMood === "all" && (
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-apple-blue hover:bg-apple-blue/80 text-white"
                    >
                      <Plus size={16} className="mr-2" />
                      Create First Entry
                    </Button>
                  )}
                </div>
              ) : (
                filteredEntries.map((entry: JournalEntry) => (
                  <div key={entry.id} className="glass-card rounded-2xl p-6 hover:scale-105 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {moodOptions.find(m => m.value === entry.mood)?.icon || "😐"}
                        </span>
                        <div>
                          <h3 className="font-semibold text-text-primary line-clamp-1">
                            {entry.title || "Untitled"}
                          </h3>
                          <p className="text-sm text-text-tertiary">
                            {new Date(entry.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                          className="p-2 hover:bg-apple-blue/20 text-text-secondary hover:text-apple-blue"
                        >
                          <Edit3 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(entry.id)}
                          className="p-2 hover:bg-apple-red/20 text-text-secondary hover:text-apple-red"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </div>

                    <p className="text-text-secondary text-sm line-clamp-3 mb-4">
                      {entry.content}
                    </p>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {entry.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-apple-blue/20 text-apple-blue text-xs rounded-lg"
                          >
                            {tag}
                          </span>
                        ))}
                        {entry.tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-400 text-xs rounded-lg">
                            +{entry.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-text-tertiary">
                      <span className={moodOptions.find(m => m.value === entry.mood)?.color || "text-gray-500"}>
                        {moodOptions.find(m => m.value === entry.mood)?.label || entry.mood}
                      </span>
                      {entry.isPrivate && (
                        <span className="text-apple-purple">🔒 Private</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-8">
            <JournalCalendar 
              entries={entries}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onCreateEntry={(date) => {
                setSelectedDate(date);
                setIsCreateDialogOpen(true);
              }}
            />
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="mt-8">
            <JournalTrends entries={entries} />
          </TabsContent>

          {/* FlowAI Tab */}
          <TabsContent value="flowai" className="mt-8">
            <FlowAI entries={entries} />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent className="glass-card border-glass-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="gradient-text">Edit Journal Entry</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="edit-title" className="text-text-primary">Title</Label>
                <Input
                  id="edit-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your entry a title..."
                  className="glass-input border-glass-border mt-2"
                />
              </div>

              <div>
                <Label htmlFor="edit-content" className="text-text-primary">Content</Label>
                <Textarea
                  id="edit-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's on your mind?"
                  className="glass-input border-glass-border mt-2 min-h-[150px]"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-mood" className="text-text-primary">Mood</Label>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger className="glass-button border-glass-border mt-2">
                      <SelectValue placeholder="How are you feeling?" />
                    </SelectTrigger>
                    <SelectContent>
                      {moodOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.icon} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-tags" className="text-text-primary">Tags</Label>
                  <Input
                    id="edit-tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="work, reflection, goals..."
                    className="glass-input border-glass-border mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
                <Label htmlFor="edit-private" className="text-text-primary">
                  Make this entry private
                </Label>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="submit"
                  disabled={updateEntryMutation.isPending}
                  className="bg-apple-blue hover:bg-apple-blue/80 text-white"
                >
                  {updateEntryMutation.isPending ? "Updating..." : "Update Entry"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setEditingEntry(null);
                  }}
                  className="glass-button border-glass-border"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}