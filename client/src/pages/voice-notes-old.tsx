import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import VoiceRecorder from "@/components/voice-recorder";

interface VoiceNote {
  id: number;
  title?: string;
  fileName: string;
  duration?: number;
  transcription?: string;
  createdAt: string;
}

export default function VoiceNotes() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [playingNoteId, setPlayingNoteId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get voice notes
  const { data: voiceNotes = [], isLoading, error } = useQuery<VoiceNote[]>({
    queryKey: ["/api/voice"],
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

  // Delete voice note mutation
  const deleteVoiceNoteMutation = useMutation({
    mutationFn: async (noteId: number) => {
      const response = await apiRequest("DELETE", `/api/voice/${noteId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/voice"] });
      toast({
        title: "Voice Note Deleted",
        description: "Your voice note has been deleted.",
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
        description: "Failed to delete voice note",
        variant: "destructive",
      });
    },
  });

  const handleVoiceNoteUploaded = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/voice"] });
  };

  const playVoiceNote = async (noteId: number) => {
    try {
      if (playingNoteId === noteId) {
        // Stop current playback
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlayingNoteId(null);
        return;
      }

      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause();
      }

      // Start new playback
      const audio = new Audio(`/api/voice/${noteId}/audio`);
      audioRef.current = audio;
      setPlayingNoteId(noteId);

      audio.onended = () => {
        setPlayingNoteId(null);
        audioRef.current = null;
      };

      audio.onerror = () => {
        toast({
          title: "Playback Error",
          description: "Failed to play voice note",
          variant: "destructive",
        });
        setPlayingNoteId(null);
        audioRef.current = null;
      };

      await audio.play();
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Failed to play voice note",
        variant: "destructive",
      });
      setPlayingNoteId(null);
    }
  };

  const deleteVoiceNote = (noteId: number) => {
    if (confirm("Are you sure you want to delete this voice note?")) {
      if (playingNoteId === noteId) {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        setPlayingNoteId(null);
      }
      deleteVoiceNoteMutation.mutate(noteId);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Filter voice notes based on search
  const filteredVoiceNotes = voiceNotes.filter(note =>
    note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.transcription?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-1">
        <Card className="glass-card rounded-3xl p-8">
          <CardContent className="p-0">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-apple-blue mx-auto"></div>
            <p className="text-text-secondary mt-4">Loading voice notes...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-1 text-text-primary pt-20 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 gradient-text">Voice Notes</h1>
          <p className="text-xl text-text-secondary">
            Capture your thoughts with voice recordings
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Voice Recorder */}
          <Card className="glass-card rounded-3xl p-6">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Record Voice Note</CardTitle>
            </CardHeader>
            <CardContent>
              <VoiceRecorder onVoiceNoteUploaded={handleVoiceNoteUploaded} />
            </CardContent>
          </Card>

          {/* Voice Notes List */}
          <div className="space-y-6">
            {/* Search */}
            <Card className="glass-card rounded-2xl p-4">
              <CardContent className="p-0">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"></i>
                  <Input
                    placeholder="Search voice notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 glass-button border-none focus:ring-2 focus:ring-apple-blue"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Voice Notes */}
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredVoiceNotes.length > 0 ? (
                filteredVoiceNotes.map((note) => (
                  <Card key={note.id} className="glass-card rounded-2xl p-4">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playVoiceNote(note.id)}
                            className={`w-10 h-10 rounded-full ${
                              playingNoteId === note.id
                                ? "bg-apple-red text-white"
                                : "bg-apple-blue text-white hover:bg-apple-blue/80"
                            }`}
                          >
                            <i className={`fas ${playingNoteId === note.id ? "fa-stop" : "fa-play"} text-xs`}></i>
                          </Button>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">
                              {note.title || `Voice Note ${new Date(note.createdAt).toLocaleDateString()}`}
                            </h3>
                            <div className="flex items-center gap-3 text-xs text-text-tertiary">
                              <span>{formatDuration(note.duration)}</span>
                              <span>•</span>
                              <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                            </div>
                            {note.transcription && (
                              <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                {note.transcription}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteVoiceNote(note.id)}
                          className="text-apple-red hover:text-red-400 ml-2"
                          disabled={deleteVoiceNoteMutation.isPending}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="glass-card rounded-2xl p-8">
                  <CardContent className="p-0 text-center">
                    <i className="fas fa-microphone text-text-tertiary text-3xl mb-4"></i>
                    <h3 className="text-lg font-semibold mb-2">No voice notes found</h3>
                    <p className="text-text-tertiary">
                      {searchTerm ? "Try a different search term" : "Record your first voice note to get started"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Voice Note Tips */}
        <Card className="glass-card rounded-2xl mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Voice Note Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-apple-blue rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-microphone text-white"></i>
                </div>
                <h4 className="font-medium mb-2">Clear Audio</h4>
                <p className="text-text-secondary text-sm">Speak clearly and minimize background noise for best results</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-apple-green rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-clock text-white"></i>
                </div>
                <h4 className="font-medium mb-2">Keep It Concise</h4>
                <p className="text-text-secondary text-sm">Shorter recordings are easier to organize and review later</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-apple-orange rounded-full flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-tag text-white"></i>
                </div>
                <h4 className="font-medium mb-2">Add Context</h4>
                <p className="text-text-secondary text-sm">Give your recordings descriptive titles for easy searching</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
