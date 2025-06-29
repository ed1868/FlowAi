import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { 
  Mic, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload,
  Trash2,
  FileText,
  Clock,
  Tag,
  Search,
  Filter,
  Sparkles,
  MessageSquare,
  Zap,
  User,
  Bot,
  Volume2,
  Brain,
  ArrowRight,
  Copy,
  Plus,
  Settings
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { VoiceNote, UserVoiceClone } from "@shared/schema";

interface AIInsight {
  category: "mood" | "productivity" | "growth" | "patterns";
  title: string;
  insight: string;
  recommendation: string;
  confidence: number;
}

interface FutureMeAdvice {
  text: string;
  audioUrl?: string;
}

export default function VoiceNotesNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isVoiceCloneDialogOpen, setIsVoiceCloneDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<VoiceNote | null>(null);
  const [title, setTitle] = useState("");
  const [transcription, setTranscription] = useState("");
  const [noteType, setNoteType] = useState("memo");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState("notes");
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  
  // Voice clone states
  const [voiceCloneName, setVoiceCloneName] = useState("");
  const [voiceCloneFiles, setVoiceCloneFiles] = useState<File[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch voice notes
  const { data: voiceNotes = [], isLoading } = useQuery({
    queryKey: ["/api/voice-notes"],
  });

  // Fetch voice clones
  const { data: voiceClones = [] } = useQuery({
    queryKey: ["/api/voice-clones"],
  });

  // Fetch AI insights
  const { data: aiInsights = [], isLoading: isLoadingInsights } = useQuery({
    queryKey: ["/api/voice-notes/ai-insights"],
    enabled: voiceNotes.length > 0,
  });

  // Create voice note mutation
  const createVoiceNoteMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/voice-notes', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create voice note');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/voice-notes/ai-insights"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Voice note created",
        description: "Your voice note has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create voice note. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete voice note mutation
  const deleteVoiceNoteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/voice-notes/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/voice-notes/ai-insights"] });
      toast({
        title: "Voice note deleted",
        description: "Voice note has been removed.",
      });
    },
  });

  // Convert to journal entry mutation
  const convertToJournalMutation = useMutation({
    mutationFn: async (voiceNoteId: number) => {
      return await apiRequest(`/api/voice-notes/${voiceNoteId}/convert-to-journal`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-notes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
      toast({
        title: "Converted to journal",
        description: "Voice note has been converted to a journal entry.",
      });
    },
  });

  // Create voice clone mutation
  const createVoiceCloneMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/voice-clones', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Failed to create voice clone');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice-clones"] });
      setIsVoiceCloneDialogOpen(false);
      resetVoiceCloneForm();
      toast({
        title: "Voice clone created",
        description: "Your voice has been cloned successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create voice clone. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate future me advice mutation
  const generateAdviceMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/voice-notes/future-me-advice", {
        method: "POST",
      });
    },
    onSuccess: (data: FutureMeAdvice) => {
      toast({
        title: "Future Me advice generated",
        description: "Your personalized advice is ready!",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setTranscription("");
    setNoteType("memo");
    setMood("");
    setTags("");
    setAudioFile(null);
    setSelectedNote(null);
  };

  const resetVoiceCloneForm = () => {
    setVoiceCloneName("");
    setVoiceCloneFiles([]);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(audioFile);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const playAudio = (note: VoiceNote) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const audio = new Audio(`/api/voice-notes/${note.id}/audio`);
    audioRef.current = audio;
    
    audio.onended = () => setIsPlaying(null);
    audio.onerror = () => {
      toast({
        title: "Playback failed",
        description: "Could not play audio file.",
        variant: "destructive",
      });
      setIsPlaying(null);
    };

    if (isPlaying === note.id) {
      audio.pause();
      setIsPlaying(null);
    } else {
      audio.play();
      setIsPlaying(note.id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!audioFile) {
      toast({
        title: "No audio file",
        description: "Please record or upload an audio file.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('title', title);
    formData.append('transcription', transcription);
    formData.append('noteType', noteType);
    formData.append('mood', mood === 'none' ? '' : mood);
    formData.append('tags', tags);

    createVoiceNoteMutation.mutate(formData);
  };

  const handleVoiceCloneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!voiceCloneName || voiceCloneFiles.length === 0) {
      toast({
        title: "Missing information",
        description: "Please provide a name and at least one audio sample.",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('name', voiceCloneName);
    voiceCloneFiles.forEach((file, index) => {
      formData.append(`samples`, file);
    });

    createVoiceCloneMutation.mutate(formData);
  };

  const filteredNotes = voiceNotes.filter((note: VoiceNote) => {
    const matchesSearch = note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         note.transcription?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || note.noteType === filterType;
    return matchesSearch && matchesFilter;
  });

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'memo': return 'bg-blue-500/20 text-blue-400';
      case 'journal_draft': return 'bg-green-500/20 text-green-400';
      case 'thought': return 'bg-purple-500/20 text-purple-400';
      case 'future_advice': return 'bg-orange-500/20 text-orange-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleGenerateAdvice = async () => {
    setIsGeneratingAdvice(true);
    try {
      await generateAdviceMutation.mutateAsync();
    } finally {
      setIsGeneratingAdvice(false);
    }
  };

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold gradient-text">Voice Studio</h1>
          <p className="text-text-secondary mt-2 text-sm sm:text-base">
            Record thoughts, clone your voice, and get AI-powered insights
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Dialog open={isVoiceCloneDialogOpen} onOpenChange={setIsVoiceCloneDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="glass-button border-glass-border h-12 sm:h-10 w-full sm:w-auto justify-center text-base sm:text-sm font-medium">
                <Bot className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                Clone Voice
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-glass-border max-w-xl">
              <DialogHeader>
                <DialogTitle className="gradient-text">Create Voice Clone</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleVoiceCloneSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="voiceCloneName" className="text-text-primary">Voice Clone Name</Label>
                  <Input
                    id="voiceCloneName"
                    value={voiceCloneName}
                    onChange={(e) => setVoiceCloneName(e.target.value)}
                    placeholder="My Voice Clone"
                    className="glass-input border-glass-border mt-2"
                    required
                  />
                </div>

                <div>
                  <Label className="text-text-primary">Audio Samples (3-5 recommended)</Label>
                  <div className="mt-2 space-y-2">
                    <input
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={(e) => setVoiceCloneFiles(Array.from(e.target.files || []))}
                      className="glass-input border-glass-border"
                    />
                    <p className="text-sm text-text-secondary">
                      Upload 3-5 audio samples of yourself speaking for best results. Each sample should be 10-30 seconds long.
                    </p>
                  </div>
                  
                  {voiceCloneFiles.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {voiceCloneFiles.map((file, index) => (
                        <div key={index} className="text-sm text-text-secondary">
                          • {file.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="submit"
                    disabled={createVoiceCloneMutation.isPending}
                    className="bg-apple-blue hover:bg-apple-blue/80 text-white"
                  >
                    {createVoiceCloneMutation.isPending ? "Creating Clone..." : "Create Voice Clone"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-apple-blue hover:bg-apple-blue/80 text-white h-12 sm:h-10 w-full sm:w-auto justify-center text-base sm:text-sm font-medium">
                <Mic className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
                New Recording
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-glass-border max-w-2xl max-h-[90vh] overflow-y-auto mx-4 sm:mx-0">
              <DialogHeader>
                <DialogTitle className="gradient-text">Create Voice Note</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Recording Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 p-4 sm:p-6 glass-card rounded-lg">
                  {!isRecording ? (
                    <Button
                      type="button"
                      onClick={startRecording}
                      className="bg-red-500 hover:bg-red-600 text-white h-12 sm:h-10 w-full sm:w-auto px-6 text-base sm:text-sm font-medium"
                    >
                      <Mic className="h-5 w-5 mr-2" />
                      Start Recording
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={stopRecording}
                      className="bg-red-600 hover:bg-red-700 text-white animate-pulse h-12 sm:h-10 w-full sm:w-auto px-6 text-base sm:text-sm font-medium"
                    >
                      <Square className="h-5 w-5 mr-2" />
                      Stop Recording
                    </Button>
                  )}
                  
                  <div className="text-center">
                    <Label htmlFor="audio-upload" className="cursor-pointer">
                      <div className="glass-button border-glass-border p-3 hover:bg-white/10 transition-colors">
                        <Upload className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-sm">Upload File</span>
                      </div>
                    </Label>
                    <input
                      id="audio-upload"
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </div>
                  
                  {audioFile && (
                    <div className="text-center">
                      <Badge className="bg-green-500/20 text-green-400">
                        Audio Ready
                      </Badge>
                      <p className="text-sm text-text-secondary mt-1">{audioFile.name}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="text-text-primary">Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give your voice note a title..."
                      className="glass-input border-glass-border mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="noteType" className="text-text-primary">Type</Label>
                    <Select value={noteType} onValueChange={setNoteType}>
                      <SelectTrigger className="glass-input border-glass-border mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-glass-border">
                        <SelectItem value="memo">Voice Memo</SelectItem>
                        <SelectItem value="journal_draft">Journal Draft</SelectItem>
                        <SelectItem value="thought">Random Thought</SelectItem>
                        <SelectItem value="future_advice">Future Me Advice</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="transcription" className="text-text-primary">Transcription</Label>
                  <Textarea
                    id="transcription"
                    value={transcription}
                    onChange={(e) => setTranscription(e.target.value)}
                    placeholder="Add transcription or notes about this recording..."
                    className="glass-input border-glass-border mt-2 min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mood" className="text-text-primary">Mood (Optional)</Label>
                    <Select value={mood} onValueChange={setMood}>
                      <SelectTrigger className="glass-input border-glass-border mt-2">
                        <SelectValue placeholder="Select mood" />
                      </SelectTrigger>
                      <SelectContent className="glass-card border-glass-border">
                        <SelectItem value="none">No mood</SelectItem>
                        <SelectItem value="great">😊 Great</SelectItem>
                        <SelectItem value="good">🙂 Good</SelectItem>
                        <SelectItem value="neutral">😐 Neutral</SelectItem>
                        <SelectItem value="bad">😞 Bad</SelectItem>
                        <SelectItem value="terrible">😢 Terrible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tags" className="text-text-primary">Tags</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="work, personal, ideas (comma-separated)"
                      className="glass-input border-glass-border mt-2"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    type="submit"
                    disabled={createVoiceNoteMutation.isPending || !audioFile}
                    className="bg-apple-blue hover:bg-apple-blue/80 text-white"
                  >
                    {createVoiceNoteMutation.isPending ? "Saving..." : "Save Voice Note"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        </div>

        {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="glass-tabs">
          <TabsTrigger value="notes" className="glass-tab">
            <Mic className="h-4 w-4 mr-2" />
            Voice Notes
          </TabsTrigger>
          <TabsTrigger value="ai-insights" className="glass-tab">
            <Brain className="h-4 w-4 mr-2" />
            FlowAI Analysis
          </TabsTrigger>
          <TabsTrigger value="future-me" className="glass-tab">
            <Bot className="h-4 w-4 mr-2" />
            Future Me
          </TabsTrigger>
          <TabsTrigger value="voice-clones" className="glass-tab">
            <Volume2 className="h-4 w-4 mr-2" />
            Voice Clones
          </TabsTrigger>
        </TabsList>

        {/* Voice Notes Tab */}
        <TabsContent value="notes" className="space-y-6">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Search voice notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input border-glass-border pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="glass-input border-glass-border w-full sm:w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass-card border-glass-border">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="memo">Voice Memos</SelectItem>
                <SelectItem value="journal_draft">Journal Drafts</SelectItem>
                <SelectItem value="thought">Random Thoughts</SelectItem>
                <SelectItem value="future_advice">Future Advice</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Voice Notes Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="glass-card border-glass-border p-6 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-4"></div>
                  <div className="h-3 bg-white/10 rounded mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3"></div>
                </Card>
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <Card className="glass-card border-glass-border p-12 text-center">
              <Mic className="h-16 w-16 mx-auto mb-4 text-text-secondary" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No voice notes yet</h3>
              <p className="text-text-secondary">
                Start recording your thoughts and ideas with voice notes
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredNotes.map((note: VoiceNote) => (
                <Card key={note.id} className="glass-card border-glass-border p-6 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary truncate">
                        {note.title || "Untitled Voice Note"}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getNoteTypeColor(note.noteType || "memo")}>
                          {note.noteType?.replace('_', ' ') || 'memo'}
                        </Badge>
                        {note.duration && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDuration(note.duration)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteVoiceNoteMutation.mutate(note.id)}
                      className="text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {note.transcription && (
                    <p className="text-text-secondary text-sm mb-4 line-clamp-3">
                      {note.transcription}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playAudio(note)}
                      className="text-apple-blue hover:bg-apple-blue/20"
                    >
                      {isPlaying === note.id ? (
                        <Pause className="h-4 w-4 mr-2" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {isPlaying === note.id ? "Pause" : "Play"}
                    </Button>

                    <div className="flex items-center gap-2">
                      {note.mood && (
                        <span className="text-xs">
                          {note.mood === 'great' && '😊'}
                          {note.mood === 'good' && '🙂'}
                          {note.mood === 'neutral' && '😐'}
                          {note.mood === 'bad' && '😞'}
                          {note.mood === 'terrible' && '😢'}
                        </span>
                      )}
                      <span className="text-xs text-text-secondary">
                        {new Date(note.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {note.noteType === 'journal_draft' && !note.isConverted && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => convertToJournalMutation.mutate(note.id)}
                        className="glass-button border-glass-border text-xs"
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Convert to Journal
                      </Button>
                    )}
                  </div>

                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {note.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Tag className="h-2 w-2 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">FlowAI Voice Analysis</h2>
              <p className="text-text-secondary">AI-powered insights from your voice notes</p>
            </div>
            
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/voice-notes/ai-insights"] })}
              disabled={isLoadingInsights}
              className="glass-button border-glass-border"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Refresh Analysis
            </Button>
          </div>

          {isLoadingInsights ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="glass-card border-glass-border p-6 animate-pulse">
                  <div className="h-4 bg-white/10 rounded mb-4"></div>
                  <div className="h-3 bg-white/10 rounded mb-2"></div>
                  <div className="h-3 bg-white/10 rounded w-2/3"></div>
                </Card>
              ))}
            </div>
          ) : aiInsights.length === 0 ? (
            <Card className="glass-card border-glass-border p-12 text-center">
              <Brain className="h-16 w-16 mx-auto mb-4 text-text-secondary" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No insights yet</h3>
              <p className="text-text-secondary">
                Create some voice notes to get AI-powered insights and analysis
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiInsights.map((insight: AIInsight, index: number) => (
                <Card key={index} className="glass-card border-glass-border p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-3 h-3 rounded-full ${
                      insight.category === 'mood' ? 'bg-pink-500' :
                      insight.category === 'productivity' ? 'bg-blue-500' :
                      insight.category === 'growth' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`} />
                    <h3 className="font-semibold text-text-primary">{insight.title}</h3>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {Math.round(insight.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  
                  <p className="text-text-secondary mb-4 text-sm leading-relaxed">
                    {insight.insight}
                  </p>
                  
                  <div className="border-t border-glass-border pt-4">
                    <h4 className="font-medium text-text-primary mb-2 text-sm">Recommendation:</h4>
                    <p className="text-apple-blue text-sm">
                      {insight.recommendation}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Future Me Tab */}
        <TabsContent value="future-me" className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold gradient-text mb-4">Future Me Advice</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Get personalized advice from your future self, powered by AI analysis of your voice notes and spoken in your own cloned voice.
            </p>
          </div>

          <Card className="glass-card border-glass-border p-8 text-center max-w-2xl mx-auto">
            <Bot className="h-16 w-16 mx-auto mb-6 text-apple-blue" />
            
            <div className="space-y-4">
              <Button
                onClick={handleGenerateAdvice}
                disabled={isGeneratingAdvice || voiceNotes.length === 0}
                className="bg-apple-blue hover:bg-apple-blue/80 text-white"
                size="lg"
              >
                {isGeneratingAdvice ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Generating Advice...
                  </>
                ) : (
                  <>
                    <Zap className="h-5 w-5 mr-2" />
                    Get Future Me Advice
                  </>
                )}
              </Button>

              {voiceNotes.length === 0 && (
                <p className="text-text-secondary text-sm">
                  Create some voice notes first to generate personalized advice
                </p>
              )}
            </div>

            {generateAdviceMutation.data && (
              <div className="mt-8 p-6 glass-card rounded-lg text-left">
                <div className="flex items-center gap-3 mb-4">
                  <User className="h-6 w-6 text-apple-blue" />
                  <span className="font-semibold text-text-primary">Future You</span>
                </div>
                <p className="text-text-secondary leading-relaxed mb-4">
                  {generateAdviceMutation.data.text}
                </p>
                {generateAdviceMutation.data.audioUrl && (
                  <audio controls className="w-full">
                    <source src={generateAdviceMutation.data.audioUrl} type="audio/mpeg" />
                    Your browser does not support audio playback.
                  </audio>
                )}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Voice Clones Tab */}
        <TabsContent value="voice-clones" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Voice Clones</h2>
              <p className="text-text-secondary">Manage your cloned voices for "Future Me" advice</p>
            </div>
          </div>

          {voiceClones.length === 0 ? (
            <Card className="glass-card border-glass-border p-12 text-center">
              <Volume2 className="h-16 w-16 mx-auto mb-4 text-text-secondary" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">No voice clones yet</h3>
              <p className="text-text-secondary mb-6">
                Create a voice clone to enable "Future Me" advice in your own voice
              </p>
              <Button
                onClick={() => setIsVoiceCloneDialogOpen(true)}
                className="bg-apple-blue hover:bg-apple-blue/80 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Voice Clone
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {voiceClones.map((clone: UserVoiceClone) => (
                <Card key={clone.id} className="glass-card border-glass-border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-text-primary">{clone.voiceName}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        {clone.isActive && (
                          <Badge className="bg-green-500/20 text-green-400">
                            Active
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {clone.sampleCount} samples
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">
                      Created {new Date(clone.createdAt!).toLocaleDateString()}
                    </span>
                    
                    <div className="flex gap-2">
                      {!clone.isActive && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="glass-button border-glass-border text-xs"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}