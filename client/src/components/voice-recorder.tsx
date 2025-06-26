import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { AudioRecorder, formatAudioDuration } from "@/lib/audio";
import { isUnauthorizedError } from "@/lib/authUtils";

interface VoiceRecorderProps {
  onVoiceNoteUploaded: () => void;
}

export default function VoiceRecorder({ onVoiceNoteUploaded }: VoiceRecorderProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [title, setTitle] = useState("");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Upload voice note mutation
  const uploadVoiceNoteMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/voice", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to upload voice note");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Voice Note Saved",
        description: "Your voice note has been saved successfully!",
      });
      resetRecorder();
      onVoiceNoteUploaded();
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
        title: "Upload Failed",
        description: "Failed to save voice note. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      if (!AudioRecorder.isRecordingSupported()) {
        toast({
          title: "Not Supported",
          description: "Voice recording is not supported in this browser",
          variant: "destructive",
        });
        return;
      }

      const hasPermission = await AudioRecorder.requestMicrophonePermission();
      if (!hasPermission) {
        toast({
          title: "Permission Denied",
          description: "Microphone permission is required to record voice notes",
          variant: "destructive",
        });
        return;
      }

      audioRecorderRef.current = new AudioRecorder();
      await audioRecorderRef.current.startRecording();
      
      setIsRecording(true);
      setIsPaused(false);
      setRecordingDuration(0);
      setAudioBlob(null);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone",
      });
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Recording Failed",
        description: "Failed to start recording. Please check your microphone.",
        variant: "destructive",
      });
    }
  };

  const pauseRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.pauseRecording();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const resumeRecording = () => {
    if (audioRecorderRef.current) {
      audioRecorderRef.current.resumeRecording();
      setIsPaused(false);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = async () => {
    if (!audioRecorderRef.current) return;

    try {
      const blob = await audioRecorderRef.current.stopRecording();
      setAudioBlob(blob);
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      toast({
        title: "Recording Complete",
        description: "Review your recording and add a title to save it",
      });
    } catch (error) {
      console.error("Failed to stop recording:", error);
      toast({
        title: "Recording Failed",
        description: "Failed to complete recording",
        variant: "destructive",
      });
    }
  };

  const playPreview = () => {
    if (!audioBlob) return;

    if (isPlayingPreview) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
        audioPreviewRef.current = null;
      }
      setIsPlayingPreview(false);
      return;
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audioPreviewRef.current = audio;
    
    audio.onended = () => {
      setIsPlayingPreview(false);
      audioPreviewRef.current = null;
      URL.revokeObjectURL(audioUrl);
    };

    audio.onerror = () => {
      setIsPlayingPreview(false);
      audioPreviewRef.current = null;
      URL.revokeObjectURL(audioUrl);
      toast({
        title: "Playback Error",
        description: "Failed to play recording",
        variant: "destructive",
      });
    };

    audio.play();
    setIsPlayingPreview(true);
  };

  const saveVoiceNote = () => {
    if (!audioBlob) return;

    const formData = new FormData();
    const fileName = `voice-note-${Date.now()}.webm`;
    formData.append("audio", audioBlob, fileName);
    formData.append("title", title || `Voice Note ${new Date().toLocaleDateString()}`);
    formData.append("duration", recordingDuration.toString());

    uploadVoiceNoteMutation.mutate(formData);
  };

  const resetRecorder = () => {
    setIsRecording(false);
    setIsPaused(false);
    setRecordingDuration(0);
    setTitle("");
    setAudioBlob(null);
    setIsPlayingPreview(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    
    audioRecorderRef.current = null;
  };

  return (
    <div className="space-y-6">
      {/* Recording Interface */}
      <div className="text-center">
        <div className="w-24 h-24 bg-gradient-to-br from-apple-green to-apple-blue rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform cursor-pointer">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              variant="ghost"
              size="lg"
              className="w-full h-full rounded-full text-white hover:bg-transparent"
            >
              <i className="fas fa-microphone text-2xl"></i>
            </Button>
          ) : (
            <div className="text-white text-center">
              <i className={`fas ${isPaused ? "fa-play" : "fa-pause"} text-2xl mb-1`}></i>
              <div className="text-xs">
                {isPaused ? "Paused" : "Recording"}
              </div>
            </div>
          )}
        </div>
        
        <div className="text-lg font-semibold mb-2">
          {isRecording ? (
            <span className="text-apple-red">
              {formatAudioDuration(recordingDuration)}
            </span>
          ) : audioBlob ? (
            "Recording ready"
          ) : (
            "Ready to record"
          )}
        </div>
        
        <div className="text-text-tertiary text-sm">
          {isRecording
            ? isPaused
              ? "Recording paused - tap to resume"
              : "Recording in progress..."
            : audioBlob
            ? "Review and save your recording"
            : "Tap the microphone to start recording"
          }
        </div>
      </div>

      {/* Recording Controls */}
      {isRecording && (
        <div className="flex justify-center space-x-4">
          <Button
            onClick={isPaused ? resumeRecording : pauseRecording}
            variant="ghost"
            size="sm"
            className="w-12 h-12 bg-apple-orange hover:bg-apple-orange/80 rounded-full text-white"
          >
            <i className={`fas ${isPaused ? "fa-play" : "fa-pause"}`}></i>
          </Button>
          
          <Button
            onClick={stopRecording}
            variant="ghost"
            size="sm"
            className="w-12 h-12 bg-apple-red hover:bg-apple-red/80 rounded-full text-white"
          >
            <i className="fas fa-stop"></i>
          </Button>
        </div>
      )}

      {/* Preview and Save */}
      {audioBlob && !isRecording && (
        <div className="space-y-4">
          <div>
            <Input
              placeholder="Give your recording a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="glass-button border-none focus:ring-2 focus:ring-apple-blue"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={playPreview}
              variant="outline"
              className="flex-1 glass-button"
            >
              <i className={`fas ${isPlayingPreview ? "fa-stop" : "fa-play"} mr-2`}></i>
              {isPlayingPreview ? "Stop Preview" : "Preview"}
            </Button>
            
            <Button
              onClick={saveVoiceNote}
              className="flex-1 bg-apple-blue hover:bg-apple-blue/80 text-white"
              disabled={uploadVoiceNoteMutation.isPending}
            >
              <i className="fas fa-save mr-2"></i>
              {uploadVoiceNoteMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
          
          <Button
            onClick={resetRecorder}
            variant="ghost"
            size="sm"
            className="w-full text-text-tertiary hover:text-apple-red"
          >
            <i className="fas fa-trash mr-2"></i>
            Discard Recording
          </Button>
        </div>
      )}

      {/* Recording Tips */}
      <div className="p-4 glass-button rounded-xl">
        <h4 className="font-medium mb-2 text-sm">Recording Tips</h4>
        <ul className="text-xs text-text-tertiary space-y-1">
          <li>• Speak clearly and at a normal pace</li>
          <li>• Keep the microphone close to your mouth</li>
          <li>• Find a quiet environment for best quality</li>
          <li>• You can pause and resume recording anytime</li>
        </ul>
      </div>
    </div>
  );
}
