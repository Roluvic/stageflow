
import React, { useState, useContext, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { Sparkles, X, Bot, User, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { AppContext } from '../../App';
import { AiAssistantIcon } from '../../components/icons/AiAssistantIcon';

// --- Audio Helper Functions (as per Gemini API guidelines) ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
// --- End Audio Helper Functions ---


type ConversationStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error';
type AiAssistantStatus = 'idle' | 'connecting' | 'listening' | 'speaking' | 'processing' | 'error';
type TranscriptEntry = {
    id: number;
    speaker: 'user' | 'ai';
    text: string;
    isFinal: boolean;
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const AiAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ConversationStatus>('idle');
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  
  const { currentUser } = useContext(AppContext);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Refs for audio processing and session management
  const sessionPromise = useRef<Promise<LiveSession> | null>(null);
  const micStream = useRef<MediaStream | null>(null);
  const inputAudioContext = useRef<AudioContext | null>(null);
  const outputAudioContext = useRef<AudioContext | null>(null);
  const scriptProcessor = useRef<ScriptProcessorNode | null>(null);
  const outputSources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTime = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(scrollToBottom, [transcript]);


  const stopConversation = async () => {
      console.log('Stopping conversation...');
      setStatus('idle');
      
      if (micStream.current) {
          micStream.current.getTracks().forEach(track => track.stop());
          micStream.current = null;
      }
      if (scriptProcessor.current) {
          scriptProcessor.current.disconnect();
          scriptProcessor.current.onaudioprocess = null;
          scriptProcessor.current = null;
      }
      if (inputAudioContext.current?.state !== 'closed') await inputAudioContext.current?.close();
      if (outputAudioContext.current?.state !== 'closed') await outputAudioContext.current?.close();
      inputAudioContext.current = null;
      outputAudioContext.current = null;
      
       outputSources.current.forEach(source => source.stop());
       outputSources.current.clear();
       nextStartTime.current = 0;
      
      if (sessionPromise.current) {
          try {
              const session = await sessionPromise.current;
              session.close();
          } catch (e) { console.error("Error closing session:", e); }
          sessionPromise.current = null;
      }
  };

  const startConversation = async () => {
    setTranscript([]);
    setStatus('connecting');
    try {
        micStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        inputAudioContext.current = new (window.AudioContext)({ sampleRate: 16000 });
        outputAudioContext.current = new (window.AudioContext)({ sampleRate: 24000 });
        
        sessionPromise.current = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                inputAudioTranscription: {},
                outputAudioTranscription: {},
            },
            callbacks: {
                onopen: () => {
                    setStatus('listening');
                    const source = inputAudioContext.current!.createMediaStreamSource(micStream.current!);
                    scriptProcessor.current = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        if (sessionPromise.current) {
                             sessionPromise.current.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        }
                    };
                    source.connect(scriptProcessor.current);
                    scriptProcessor.current.connect(inputAudioContext.current!.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const outCtx = outputAudioContext.current;
                    if (!outCtx) return;

                    if (message.serverContent?.inputTranscription) {
                        const { text, isFinal } = message.serverContent.inputTranscription;
                        setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.speaker === 'user' && !last.isFinal) {
                                last.text = text;
                                last.isFinal = isFinal;
                                return [...prev];
                            }
                            return [...prev, { id: Date.now(), speaker: 'user', text, isFinal }];
                        });
                    }
                    if (message.serverContent?.outputTranscription) {
                        setStatus('speaking');
                         const { text, isFinal } = message.serverContent.outputTranscription;
                         setTranscript(prev => {
                            const last = prev[prev.length - 1];
                            if (last?.speaker === 'ai' && !last.isFinal) {
                                last.text += text;
                                last.isFinal = isFinal;
                                return [...prev];
                            }
                            return [...prev, { id: Date.now(), speaker: 'ai', text, isFinal }];
                        });
                    }

                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
                    if (audioData) {
                        setStatus('speaking');
                        nextStartTime.current = Math.max(nextStartTime.current, outCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
                        const source = outCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outCtx.destination);
                        
                        source.addEventListener('ended', () => {
                            outputSources.current.delete(source);
                            if (outputSources.current.size === 0) setStatus('listening');
                        });
                        
                        source.start(nextStartTime.current);
                        nextStartTime.current += audioBuffer.duration;
                        outputSources.current.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Session error:', e);
                    setStatus('error');
                    stopConversation();
                },
                onclose: (e: CloseEvent) => {
                    console.log('Session closed.');
                    if (status !== 'idle') stopConversation();
                },
            },
        });

    } catch (error) {
        console.error("Failed to start conversation:", error);
        setStatus('error');
        stopConversation();
    }
  };

  const handleToggleConversation = () => {
    if (status === 'idle' || status === 'error') startConversation();
    else stopConversation();
  };
  
  const closeAssistant = () => {
    setIsOpen(false);
    if (status !== 'idle') stopConversation();
  };

  useEffect(() => {
    return () => { if (status !== 'idle') stopConversation(); }
  }, []);


  if (!currentUser || !['owner', 'manager'].includes(currentUser.role)) return null;

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-8 right-8 h-20 w-20 z-50 animate-breathing-fab drop-shadow-lg"
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
      >
        <AiAssistantIcon status="idle" className="h-full w-full" />
      </button>
    );
  }

  const getStatusIndicator = () => {
    switch (status) {
        case 'connecting': return 'Verbinden...';
        case 'listening': return 'Luisteren...';
        case 'speaking': return 'Aan het woord...';
        case 'processing': return 'Verwerken...';
        case 'error': return 'Fout opgetreden';
        default: return 'Tik om te spreken';
    }
  }
  
  const assistantStatusForIcon: AiAssistantStatus = status;

  return (
    <div className="fixed inset-0 bg-black/30 z-[100] flex items-end justify-center" onClick={closeAssistant}>
        <div className="relative w-full max-w-md h-[90vh] max-h-[700px] flex flex-col bg-card rounded-t-3xl shadow-2xl animate-bounce-in-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                <h3 className="text-lg font-semibold flex items-center"><Sparkles className="h-5 w-5 mr-2 text-primary" />AI Voice Assistent</h3>
                <Button variant="ghost" size="icon" onClick={closeAssistant}><X className="h-5 w-5" /></Button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {transcript.map((entry) => (
                    <div key={entry.id} className={`flex items-start gap-3 animate-bubble-pop ${entry.speaker === 'user' ? 'justify-end' : ''}`}>
                        {entry.speaker === 'ai' && <Bot className="h-6 w-6 text-primary flex-shrink-0 mt-1" />}
                        <div className={`max-w-[80%] p-3 rounded-xl ${entry.speaker === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className={`text-sm ${!entry.isFinal ? 'opacity-70' : ''}`}>{entry.text}</p>
                        </div>
                        {entry.speaker === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0 mt-1" />}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 flex flex-col items-center justify-center border-t border-border flex-shrink-0">
                <div className="relative w-24 h-24 mb-2">
                    {status === 'listening' && (
                        <>
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-sonar-wave" style={{ animationDelay: '0s' }}></div>
                            <div className="absolute inset-0 rounded-full bg-primary/20 animate-sonar-wave" style={{ animationDelay: '1s' }}></div>
                        </>
                    )}
                    <button onClick={handleToggleConversation} className="relative w-full h-full z-10 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        <AiAssistantIcon status={assistantStatusForIcon} className="w-full h-full drop-shadow-lg" />
                    </button>
                </div>
                <p className="text-sm text-muted-foreground h-5 font-medium">{getStatusIndicator()}</p>
            </div>
        </div>
    </div>
  );
};