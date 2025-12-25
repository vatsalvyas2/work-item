
'use client';

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, Square, Sparkles, Info, Send } from "lucide-react";
import { transcribeAudio } from "@/ai/flows/transcribe-audio-flow";
import { createTaskFromVoice } from "@/ai/flows/create-task-flow";
import type { Task, Epic } from "@/lib/types";
import { parseISO } from "date-fns";

interface VoiceCommandDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    epics: Epic[];
    tasks: Task[];
    onAiSubmit: (data: any) => void;
}

export function VoiceCommandDialog({ open, onOpenChange, epics, tasks, onAiSubmit }: VoiceCommandDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isMicSupported, setIsMicSupported] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);


  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setIsMicSupported(false);
        }
    }
  }, []);

  const startRecording = async () => {
    setTranscript('');
    setRecordingTime(0);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        audioBitsPerSecond : 16000,
        mimeType: 'audio/webm'
      });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        if(timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
            const base64Audio = reader.result as string;
            setIsTranscribing(true);
            try {
                const transcription = await transcribeAudio({ audioDataUri: base64Audio });
                setTranscript(transcription);
            } catch (error) {
                console.error("Transcription error:", error);
                setTranscript("Sorry, I couldn't transcribe that. Please try again.");
            } finally {
                setIsTranscribing(false);
            }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsMicSupported(false); 
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleAiSubmit = async () => {
    if (!transcript.trim()) return;

    setIsAiProcessing(true);
    try {
      const result = await createTaskFromVoice({
        command: transcript,
        availableEpics: epics.map(e => ({ id: e.id, title: e.title })),
        availableTasks: tasks.map(t => ({ id: t.id, title: t.title })),
        currentDate: new Date().toISOString(),
      });
      
      const populatedResult = {
        ...result,
        plannedStartDate: result.plannedStartDate ? parseISO(result.plannedStartDate) : undefined,
        dueDate: result.dueDate ? parseISO(result.dueDate) : undefined,
      };
      
      onAiSubmit(populatedResult);
      setTranscript('');
      onOpenChange(false);
    } catch (error) {
      console.error("Error processing voice command:", error);
    } finally {
      setIsAiProcessing(false);
    }
  };
  
  const isAiSubmitDisabled = !transcript.trim() || isAiProcessing || isRecording || isTranscribing;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Auto Fill with AI</DialogTitle>
          <DialogDescription>
            Click the button and speak your command. The AI will parse it and fill out the form for you.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
             {!isMicSupported ? (
                <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Audio Recording Not Supported</AlertTitle>
                    <AlertDescription>
                        Your browser does not support audio recording or microphone access was denied. Please use a modern browser and grant microphone permissions.
                    </AlertDescription>
                </Alert>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <Button
                        type="button"
                        size="icon"
                        variant={isRecording ? 'destructive' : 'outline'}
                        className="rounded-full flex-shrink-0 w-20 h-20"
                        onClick={handleToggleRecording}
                        disabled={!isMicSupported || isAiProcessing}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                        {isRecording ? <Square size={32}/> : <Sparkles size={32} />}
                    </Button>
                    {isRecording && <span className="text-sm font-mono text-muted-foreground">{formatTime(recordingTime)}</span>}
                   
                    <div className="p-3 bg-muted rounded-md text-sm min-h-[60px] w-full">
                        {isTranscribing ? (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Transcribing...</span>
                            </div>
                        ) : (
                            <p className="text-muted-foreground italic">
                                {transcript || (isRecording ? "Listening..." : "Click the button to start recording...")}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleAiSubmit} disabled={isAiSubmitDisabled}>
            {isAiProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Apply to Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
