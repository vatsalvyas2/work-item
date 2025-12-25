
'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2, Info } from 'lucide-react';
import { Task, Epic } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { transcribeAudio } from '@/ai/flows/transcribe-audio-flow';

interface VoiceTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  epics: Epic[];
  tasks: Task[];
  onAiSubmit: (command: string) => Promise<void>;
}

export function VoiceTaskDialog({
  isOpen,
  onOpenChange,
  epics,
  tasks,
  onAiSubmit,
}: VoiceTaskDialogProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setIsSupported(false);
        }
    }
  }, []);

  const startRecording = async () => {
    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 16000, // Lower bitrate to reduce file size
      });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Convert Blob to Base64 Data URI
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
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsSupported(false); 
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) return;

    setIsProcessing(true);
    await onAiSubmit(transcript);
    setIsProcessing(false);
    setTranscript('');
  };

  const handleClose = () => {
    if (isRecording) {
      stopRecording();
    }
    onOpenChange(false);
    setTranscript('');
  };


  const isSubmitDisabled = !transcript.trim() || isProcessing || isRecording || isTranscribing;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Fill Task with AI</DialogTitle>
          <DialogDescription>
            Click the microphone, record your voice, and the AI will transcribe it. You can then submit it to pre-fill the form.
          </DialogDescription>
        </DialogHeader>

        {!isSupported && (
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Audio Recording Not Supported</AlertTitle>
                <AlertDescription>
                    Your browser does not support audio recording or microphone access was denied. Please use a modern browser and grant microphone permissions.
                </AlertDescription>
            </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Available Epics</h4>
            <ScrollArea className="h-24 w-full rounded-md border p-2 text-sm">
              {epics.length > 0 ? (
                <ul className="space-y-1">
                  {epics.map((epic) => (
                    <li key={epic.id} className="truncate" title={epic.title}>{epic.title}</li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">No epics found.</p>}
            </ScrollArea>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Available Tasks (for dependencies)</h4>
            <ScrollArea className="h-24 w-full rounded-md border p-2 text-sm">
             {tasks.length > 0 ? (
                <ul className="space-y-1">
                  {tasks.map((task) => (
                    <li key={task.id} className="truncate" title={task.title}>{task.title}</li>
                  ))}
                </ul>
              ) : <p className="text-muted-foreground">No tasks found.</p>}
            </ScrollArea>
          </div>
        </div>
        
        <div className="flex items-center justify-center">
            <Button
              size="lg"
              variant={isRecording ? 'destructive' : 'default'}
              className="rounded-full w-20 h-20"
              onClick={handleToggleRecording}
              disabled={!isSupported || isProcessing}
            >
              {isRecording ? <Square size={32} /> : <Mic size={32} />}
            </Button>
        </div>

        {(transcript || isTranscribing) && (
          <div className="mt-4 p-3 bg-muted rounded-md text-sm min-h-[6rem]">
            <p className="font-semibold mb-1">Transcript:</p>
            {isTranscribing ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Transcribing audio...</span>
                </div>
            ) : (
                <p className="text-muted-foreground">{transcript}</p>
            )}
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? "Processing..." : "Fill Form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
