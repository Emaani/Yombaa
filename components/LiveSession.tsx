import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { getGeminiClient } from '../services/geminiService';
import { createPcmBlob, decodeBase64, decodeAudioData } from '../utils/audioUtils';
import { AudioVisualizer } from './AudioVisualizer';
import { AudioStatus } from '../types';

export const LiveSession: React.FC = () => {
  const [status, setStatus] = useState<AudioStatus>(AudioStatus.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [volume, setVolume] = useState(0);

  // Audio References
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  
  // Logic References
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      stopSession();
    };
  }, []);

  const startSession = async () => {
    try {
      setStatus(AudioStatus.RECORDING);
      setError(null);
      
      const client = getGeminiClient();
      
      // 1. Setup Audio Contexts
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContext({ sampleRate: 16000 });
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      inputContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      // 2. Setup Analysers
      const inAnalyser = inputCtx.createAnalyser();
      inAnalyser.fftSize = 64;
      inputAnalyserRef.current = inAnalyser;

      const outAnalyser = outputCtx.createAnalyser();
      outAnalyser.fftSize = 64;
      outputAnalyserRef.current = outAnalyser;
      outAnalyser.connect(outputCtx.destination);

      // 3. Get Microphone
      // Requesting both audio and checking for permission issues
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          throw new Error("Microphone permission denied. Please allow microphone access in your browser settings.");
        }
        throw err;
      }
      
      streamRef.current = stream;
      setSessionActive(true); // Set active after successfully getting stream

      // 4. Connect Live Session
      const sessionPromise = client.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Connected");
            
            // Setup Input Processing
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            source.connect(inAnalyser);
            inAnalyser.connect(processor);
            processor.connect(inputCtx.destination); // ScriptProcessor needs connection to destination to work

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Calculate volume for UI
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
              setVolume(Math.sqrt(sum / inputData.length));

              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            inputSourceRef.current = source;
            processorRef.current = processor;
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
               setStatus(AudioStatus.PLAYING);
               const ctx = outputContextRef.current;
               if (!ctx) return;

               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               
               const audioBytes = decodeBase64(base64Audio);
               const audioBuffer = await decodeAudioData(audioBytes, ctx);
               
               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputAnalyserRef.current!); // Connect to analyser (which is connected to dest)
               
               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               
               sourcesRef.current.add(source);
               source.onended = () => {
                 sourcesRef.current.delete(source);
                 if (sourcesRef.current.size === 0) {
                    setStatus(AudioStatus.RECORDING); // Back to listening
                 }
               };
            }

            // Handle Interruptions
            if (message.serverContent?.interrupted) {
              console.log("Interrupted by user");
              sourcesRef.current.forEach(src => {
                try { src.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onclose: () => {
            console.log("Gemini Live Closed");
            setSessionActive(false);
            setStatus(AudioStatus.IDLE);
          },
          onerror: (err: any) => {
            console.error("Gemini Live Error", err);
            // Handle specific API errors if possible
            const msg = err.message || "Connection error";
            setError(`Live API Error: ${msg}. Please try again.`);
            stopSession();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          },
          systemInstruction: "You are a helpful travel assistant for Jackal Wild Adventures. You are knowledgeable about African safaris, gorillas, and luxury travel.",
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to start audio session");
      setStatus(AudioStatus.IDLE);
      setSessionActive(false);
      stopSession();
    }
  };

  const stopSession = () => {
    // 1. Stop processing input
    if (processorRef.current) {
      try {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
      } catch (e) {}
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      try { inputSourceRef.current.disconnect(); } catch (e) {}
      inputSourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 2. Stop playing output
    sourcesRef.current.forEach(src => {
        try { src.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();

    // 3. Close Contexts
    if (inputContextRef.current && inputContextRef.current.state !== 'closed') {
        try { inputContextRef.current.close(); } catch (e) {}
        inputContextRef.current = null;
    }
    if (outputContextRef.current && outputContextRef.current.state !== 'closed') {
        try { outputContextRef.current.close(); } catch (e) {}
        outputContextRef.current = null;
    }

    // 4. Close Session
    if (sessionPromiseRef.current) {
       sessionPromiseRef.current = null;
    }

    setSessionActive(false);
    setStatus(AudioStatus.IDLE);
    setVolume(0);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-safari-100">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-safari-800">Live Concierge</h2>
        <p className="text-safari-500 mt-2">Chat with our AI expert about your next safari adventure.</p>
      </div>

      <div className="relative w-full mb-8 space-y-4">
        <div className="relative z-10">
          <p className="text-xs font-semibold text-safari-400 uppercase tracking-widest mb-1">Microphone Input</p>
          <AudioVisualizer 
            isActive={sessionActive} 
            analyser={inputAnalyserRef.current || undefined} 
            color="#2e4a3b"
          />
        </div>
        
        <div className="relative z-10">
          <p className="text-xs font-semibold text-safari-400 uppercase tracking-widest mb-1">AI Response</p>
           <AudioVisualizer 
            isActive={sessionActive && status === AudioStatus.PLAYING} 
            analyser={outputAnalyserRef.current || undefined} 
            color="#8f7a55"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mt-0.5 shrink-0">
             <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
           </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-center">
        {!sessionActive ? (
          <button
            onClick={startSession}
            className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-safari-800 text-white shadow-lg hover:bg-safari-700 hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-safari-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a6 6 0 00-6 6v1.5a6 6 0 006 6v-1.5a6 6 0 00-6-6v1.5m6 7.5v3.75m-3.75 0h7.5" />
            </svg>
            <span className="absolute -bottom-8 text-sm font-medium text-safari-600 opacity-0 group-hover:opacity-100 transition-opacity">Connect</span>
          </button>
        ) : (
          <button
            onClick={stopSession}
            className="group relative flex items-center justify-center w-20 h-20 rounded-full bg-red-600 text-white shadow-lg hover:bg-red-700 hover:scale-105 transition-all duration-300 animate-pulse-slow focus:outline-none focus:ring-4 focus:ring-red-200"
          >
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            <span className="absolute -bottom-8 text-sm font-medium text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">Disconnect</span>
          </button>
        )}
      </div>
      
      {sessionActive && (
        <div className="mt-6 flex items-center space-x-2 text-sm text-safari-600">
           <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span>Live connection active</span>
        </div>
      )}
    </div>
  );
};