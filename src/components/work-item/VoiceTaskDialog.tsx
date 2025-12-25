
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
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      if (isRecording) {
        // If it stops unexpectedly, try to restart it
        recognition.start();
      }
    };
    
    recognitionRef.current = recognition;
  }, [isRecording]);

  const handleToggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      setTranscript('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = async () => {
    if (!transcript.trim()) return;

    // Ensure recording is stopped before processing
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    setIsProcessing(true);
    await onAiSubmit(transcript);
    setIsProcessing(false);
    setTranscript('');
  };

  const handleClose = () => {
     if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Fill Task with AI</DialogTitle>
          <DialogDescription>
            Click the microphone and describe the task you want to create. The AI will fill out the form for you.
          </DialogDescription>
        </DialogHeader>

        {!isSupported && (
            <Alert variant="destructive">
                <Info className="h-4 w-4" />
                <AlertTitle>Browser Not Supported</AlertTitle>
                <AlertDescription>
                    Your browser does not support the Web Speech API. Please try Google Chrome or another supported browser.
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

        {transcript && (
          <div className="mt-4 p-3 bg-muted rounded-md text-sm">
            <p className="font-semibold mb-1">Transcript:</p>
            <p className="text-muted-foreground">{transcript}</p>
          </div>
        )}
        
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!transcript.trim() || isProcessing || isRecording}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? "Processing..." : "Fill Form"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
