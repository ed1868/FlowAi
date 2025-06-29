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
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Calendar,
  Heart,
  Smile,
  Meh,
  Frown,
  Tag
} from "lucide-react";

interface JournalEntry {
  id: number;
  userId: string;
  title: string;
  content: string;
  mood: string;
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

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

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (entryData: any) => {
      return await apiRequest("/api/journal", "POST", entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      resetForm();
      setIsCreateDialogOpen(false);
    },
  });

  // Update entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, ...entryData }: any) => {
      return await apiRequest(`/api/journal/${id}`, "PATCH", entryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      resetForm();
      setEditingEntry(null);
    },
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/journal/${id}`, "DELETE");
    },
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

  const handleSubmit = () => {
    const entryData = {
      title,
      content,
      mood,
      tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
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
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood);
    setTags(entry.tags.join(", "));
    setIsPrivate(entry.isPrivate);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this journal entry?")) {
      deleteEntryMutation.mutate(id);
    }
  };

  // Filter and sort entries
  const filteredEntries = entries
    .filter((entry: JournalEntry) => {
      const matchesSearch = !searchQuery || 
        entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesMood = !filterMood || filterMood === "all" || entry.mood === filterMood;
      
      return matchesSearch && matchesMood;
    })
    .sort((a: JournalEntry, b: JournalEntry) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "title":
          return a.title.localeCompare(b.title);
        case "mood":
          return a.mood.localeCompare(b.mood);
        default: // newest
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  const getMoodIcon = (moodValue: string) => {
    const mood = moodOptions.find(m => m.value === moodValue);
    return mood ? mood.icon : "😐";
  };

  const getMoodColor = (moodValue: string) => {
    const mood = moodOptions.find(m => m.value === moodValue);
    return mood ? mood.color : "text-gray-500";
  };

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

        {/* Controls */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary" size={16} />
                <Input
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 glass-button border-glass-border"
                />
              </div>

              {/* Filter by mood */}
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

              {/* Sort by */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 glass-button border-glass-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="title">By title</SelectItem>
                  <SelectItem value="mood">By mood</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* New entry button */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-apple-blue hover:bg-apple-blue/80 text-white px-6 py-3 rounded-xl glass-button">
                  <Plus size={16} className="mr-2" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-card border-glass-border max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="gradient-text">Create New Journal Entry</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block">Title</label>
                    <Input
                      placeholder="Give your entry a title..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="glass-button border-glass-border"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-text-secondary mb-2 block">Content</label>
                    <Textarea
                      placeholder="Write your thoughts here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="glass-button border-glass-border min-h-32"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-text-secondary mb-2 block">Mood</label>
                      <Select value={mood} onValueChange={setMood}>
                        <SelectTrigger className="glass-button border-glass-border">
                          <SelectValue placeholder="How are you feeling?" />
                        </SelectTrigger>
                        <SelectContent>
                          {moodOptions.map(moodOption => (
                            <SelectItem key={moodOption.value} value={moodOption.value}>
                              {moodOption.icon} {moodOption.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-text-secondary mb-2 block">Tags</label>
                      <Input
                        placeholder="work, reflection, goals"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        className="glass-button border-glass-border"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="private"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="private" className="text-sm text-text-secondary">
                      Keep this entry private
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSubmit}
                      disabled={!title.trim() || !content.trim() || createEntryMutation.isPending}
                      className="bg-apple-green hover:bg-apple-green/80 text-white flex-1"
                    >
                      {createEntryMutation.isPending ? "Creating..." : "Create Entry"}
                    </Button>
                    <Button
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
                </div>
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
                {searchQuery || filterMood ? "No entries found" : "Start your journal"}
              </h3>
              <p className="text-text-secondary mb-6">
                {searchQuery || filterMood 
                  ? "Try adjusting your search or filter criteria"
                  : "Create your first journal entry to begin capturing your thoughts and experiences"
                }
              </p>
              {!searchQuery && !filterMood && (
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
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getMoodIcon(entry.mood)}</span>
                    <div>
                      <h3 className="font-semibold text-text-primary line-clamp-1">{entry.title}</h3>
                      <div className="flex items-center text-xs text-text-tertiary mt-1">
                        <Calendar size={12} className="mr-1" />
                        {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
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

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {entry.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-apple-blue/20 text-apple-blue text-xs rounded-lg"
                      >
                        #{tag}
                      </span>
                    ))}
                    {entry.tags.length > 3 && (
                      <span className="text-xs text-text-tertiary">+{entry.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span className={getMoodColor(entry.mood)}>
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

        {/* Edit Dialog */}
        <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
          <DialogContent className="glass-card border-glass-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="gradient-text">Edit Journal Entry</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Title</label>
                <Input
                  placeholder="Give your entry a title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="glass-button border-glass-border"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-text-secondary mb-2 block">Content</label>
                <Textarea
                  placeholder="Write your thoughts here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="glass-button border-glass-border min-h-32"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Mood</label>
                  <Select value={mood} onValueChange={setMood}>
                    <SelectTrigger className="glass-button border-glass-border">
                      <SelectValue placeholder="How are you feeling?" />
                    </SelectTrigger>
                    <SelectContent>
                      {moodOptions.map(moodOption => (
                        <SelectItem key={moodOption.value} value={moodOption.value}>
                          {moodOption.icon} {moodOption.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-text-secondary mb-2 block">Tags</label>
                  <Input
                    placeholder="work, reflection, goals"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="glass-button border-glass-border"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="edit-private" className="text-sm text-text-secondary">
                  Keep this entry private
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleSubmit}
                  disabled={!title.trim() || !content.trim() || updateEntryMutation.isPending}
                  className="bg-apple-green hover:bg-apple-green/80 text-white flex-1"
                >
                  {updateEntryMutation.isPending ? "Updating..." : "Update Entry"}
                </Button>
                <Button
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
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}