import React, { useState, useEffect, useRef } from 'react';
import { Modality } from '@google/genai';
import { getGeminiClient } from '../services/geminiService';
import { MANUSCRIPT_DEFAULT, AudioStatus, VOICE_OPTIONS, Voice, ACCENT_OPTIONS, MUSIC_STYLES, MusicStyle } from '../types';
import { decodeBase64, decodeAudioData, createWavFile } from '../utils/audioUtils';

export const PodcastGenerator: React.FC = () => {
  const [manuscript, setManuscript] = useState(MANUSCRIPT_DEFAULT);
  const [status, setStatus] = useState<AudioStatus>(AudioStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  
  // Dual Speaker State
  const [isDualSpeaker, setIsDualSpeaker] = useState(false);
  
  const [host1, setHost1] = useState<Voice>(VOICE_OPTIONS[2]); // Default Kore
  const [host1Name, setHost1Name] = useState("Host 1");
  const [host1Personality, setHost1Personality] = useState("Enthusiastic, curious, and warm.");
  const [host1Accent, setHost1Accent] = useState(ACCENT_OPTIONS[0]);

  const [host2, setHost2] = useState<Voice>(VOICE_OPTIONS[0]); // Default Puck
  const [host2Name, setHost2Name] = useState("Host 2");
  const [host2Personality, setHost2Personality] = useState("Knowledgeable, calm, and professional expert.");
  const [host2Accent, setHost2Accent] = useState(ACCENT_OPTIONS[0]);
  
  // Music & Ambience
  const [musicStyle, setMusicStyle] = useState<MusicStyle>(MUSIC_STYLES[0]);
  const [musicDescription, setMusicDescription] = useState("Subtle and engaging background music that matches the mood.");

  const [isRewriting, setIsRewriting] = useState(false);
  const [speed, setSpeed] = useState(1.0);

  // Audio Playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Helper to sync name changes in text
  const updateNameInManuscript = (oldName: string, newName: string) => {
    if (!manuscript || oldName === newName) return;
    // Simple replace for "Name:" pattern
    const regex = new RegExp(`${oldName}:`, 'g');
    setManuscript(prev => prev.replace(regex, `${newName}:`));
  };

  const rewriteAsDialogue = async () => {
    setIsRewriting(true);
    setErrorMessage(null);
    try {
      const client = getGeminiClient();
      const prompt = `Rewrite the following text into a dynamic, highly engaging professional radio-style podcast dialogue between ${host1Name} and ${host2Name}.

      CHARACTERS:
      - ${host1Name} (Lead Host): ${host1Personality} (Accent: ${host1Accent})
      - ${host2Name} (Co-Host): ${host2Personality} (Accent: ${host2Accent})

      DYNAMICS & INTERACTION GUIDELINES:
      - **Chemistry & Banter:** The hosts should sound like they have excellent rapport. Use light banter, shared enthusiasm, and warm laughter.
      - **Reactive Listening:** Crucial! Ensure hosts react to each other's points (e.g., "That is absolutely stunning," "I couldn't agree more," "Wow, really?").
      - **Supportive Flow:** The dialogue should be complementary. One host might set up a point, and the other knocks it out of the park.
      - **Seamless Handoffs:** Transitions should be fluid. Avoid stiff "Q&A" formats. Make it conversational and organic.
      - **Authenticity:** Incorporate natural speech patterns, fillers (like "You know," "Right"), and idioms typical of their requested accents.

      FORMATTING:
      - STRICTLY use the format: "${host1Name}: [Text]" and "${host2Name}: [Text]".
      - Keep the factual content regarding Jackal Wild Adventures accurate.

      SOURCE TEXT:
      ${manuscript}`;

      const response = await client.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        setManuscript(response.text);
      }
    } catch (error: any) {
      console.error("Rewrite failed", error);
      setErrorMessage(error.message || "Failed to rewrite manuscript.");
    } finally {
      setIsRewriting(false);
    }
  };

  const generatePodcast = async () => {
    setStatus(AudioStatus.PROCESSING);
    setErrorMessage(null);
    setDownloadUrl(null);
    setAudioDuration(0);

    try {
      const client = getGeminiClient();
      
      // Prompt Engineering for Acting Instructions
      // Enhanced instructions to emphasize chemistry and reactivity
      const toneInstruction = musicStyle.id !== 'none' 
        ? `Acting Direction: Perform with a ${musicStyle.name} vibe. Tone: ${musicDescription}. Style: Professional radio hosts with excellent chemistry, reacting naturally to each other.`
        : "Acting Direction: Perform as professional radio hosts with genuine conversational chemistry and clear reactivity.";
        
      const characterInstruction = isDualSpeaker
        ? `Voices: ${host1Name} (${host1Personality}, Accent: ${host1Accent}) and ${host2Name} (${host2Personality}, Accent: ${host2Accent}).`
        : `Voice: ${host1Name} (${host1Personality}, Accent: ${host1Accent}).`;

      const instructionText = `${toneInstruction} ${characterInstruction}`;

      let response;
      let finalManuscript = manuscript;

      // Always use the dedicated TTS model for audio generation
      if (isDualSpeaker) {
        // Pre-process: Ensure the manuscript actually uses the Speaker Names.
        // If the text contains generic "HOST:", replace with Host 1 name to avoid mapping errors.
        if (finalManuscript.includes("HOST:") && !finalManuscript.includes(`${host1Name}:`)) {
            finalManuscript = finalManuscript.replace(/HOST:/g, `${host1Name}:`);
        }

        // For dual speaker, we rely on the manuscript having "Speaker:" prefixes
        const prompt = `${instructionText}\n\nTTS the following conversation between ${host1Name} and ${host2Name}:\n${finalManuscript}`;
        
        response = await client.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: [
                  {
                    speaker: host1Name,
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: host1.id } }
                  },
                  {
                    speaker: host2Name,
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: host2.id } }
                  }
                ]
              }
            },
          },
        });
      } else {
        const prompt = `${instructionText}\n\nRead the following text:\n${finalManuscript}`;
        response = await client.models.generateContent({
          model: 'gemini-2.5-flash-preview-tts',
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: host1.id },
              },
            },
          },
        });
      }

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        const audioBytes = decodeBase64(base64Audio);
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext({ sampleRate: 24000 });
        const audioBuffer = await decodeAudioData(audioBytes, ctx);
        
        setAudioDuration(audioBuffer.duration);

        const wavBlob = createWavFile(audioBuffer);
        const url = URL.createObjectURL(wavBlob);
        setDownloadUrl(url);
        setStatus(AudioStatus.IDLE);
        
        ctx.close();
      } else {
        // If no audio, check if the model returned a text refusal/error
        const textPart = response.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textPart) {
             throw new Error(`Model Refusal: ${textPart}`);
        }
        throw new Error("No audio data returned from API. The prompt may be too complex or violates safety guidelines.");
      }
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || "Generation failed.");
      setStatus(AudioStatus.ERROR);
    }
  };

  // Render Host Configuration Card
  const renderHostConfig = (
    label: string, 
    name: string, 
    setName: (n: string) => void, 
    persona: string, 
    setPersona: (p: string) => void,
    accent: string,
    setAccent: (a: string) => void,
    selectedVoice: Voice,
    setVoice: (v: Voice) => void
  ) => (
    <div className="p-4 bg-white rounded-xl border border-safari-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-safari-400 uppercase tracking-wider">{label}</label>
        <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${selectedVoice.gender === 'Female' ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
          {selectedVoice.gender}
        </div>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-safari-500 font-medium mb-1">Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => {
              const newName = e.target.value;
              updateNameInManuscript(name, newName);
              setName(newName);
            }}
            className="w-full text-sm p-2 bg-safari-50 border border-safari-200 rounded-lg focus:ring-1 focus:ring-safari-400 outline-none"
            placeholder="e.g. Sarah"
          />
        </div>

        <div>
           <label className="block text-xs text-safari-500 font-medium mb-1">Personality</label>
           <textarea 
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            rows={2}
            className="w-full text-sm p-2 bg-safari-50 border border-safari-200 rounded-lg focus:ring-1 focus:ring-safari-400 outline-none resize-none"
            placeholder="e.g. Energetic and funny..."
           />
        </div>

        <div>
           <label className="block text-xs text-safari-500 font-medium mb-1">Accent</label>
           <div className="relative">
             <select 
               value={accent}
               onChange={(e) => setAccent(e.target.value)}
               className="w-full text-sm p-2 bg-safari-50 border border-safari-200 rounded-lg focus:ring-1 focus:ring-safari-400 outline-none appearance-none"
             >
               {ACCENT_OPTIONS.map(opt => (
                 <option key={opt} value={opt}>{opt}</option>
               ))}
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-safari-500">
               <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
             </div>
           </div>
        </div>

        <div>
          <label className="block text-xs text-safari-500 font-medium mb-1">Voice Profile (Base)</label>
          <div className="grid grid-cols-1 gap-2">
            {VOICE_OPTIONS.map((voice) => (
              <button
                key={`${label}-${voice.id}`}
                onClick={() => setVoice(voice)}
                className={`text-left px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-3 ${
                  selectedVoice.id === voice.id 
                    ? 'border-safari-500 bg-safari-50 ring-1 ring-safari-500' 
                    : 'border-safari-100 hover:border-safari-300 bg-white'
                }`}
              >
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${voice.gender === 'Female' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                   {voice.id[0]}
                 </div>
                 <div className="truncate">
                   <span className="font-semibold text-safari-900 block leading-tight">{voice.name}</span>
                   <span className="text-[10px] text-safari-500 block leading-tight">{voice.description}</span>
                 </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-2xl shadow-xl border border-safari-100 flex flex-col lg:flex-row gap-8">
      
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
           <div>
             <h2 className="text-2xl font-bold text-safari-800">Podcast Studio</h2>
             <p className="text-safari-500 text-sm mt-1">Design your hosts and generate audio.</p>
           </div>
           
           {isDualSpeaker && (
             <button 
               onClick={rewriteAsDialogue}
               disabled={isRewriting}
               className="text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border border-yellow-200 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
             >
               {isRewriting ? (
                 <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
               ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-yellow-600">
                    <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
                 </svg>
               )}
               Apply Host Personalities (Magic Rewrite)
             </button>
           )}
        </div>
        
        <div className="relative flex-1 min-h-[500px] flex flex-col">
          <textarea
            className="w-full flex-1 p-6 text-safari-900 bg-safari-50/50 border border-safari-200 rounded-xl focus:ring-2 focus:ring-safari-400 focus:border-transparent outline-none resize-none font-mono text-sm leading-relaxed shadow-inner"
            value={manuscript}
            onChange={(e) => setManuscript(e.target.value)}
            placeholder={isDualSpeaker ? `${host1Name}: ...\n${host2Name}: ...` : "Enter podcast script here..."}
          />
          <div className="absolute bottom-4 right-4 text-[10px] text-safari-400 bg-white/80 px-2 py-1 rounded backdrop-blur-sm border border-safari-100">
             {manuscript.length} chars
          </div>
        </div>
      </div>

      <div className="w-full lg:w-80 flex flex-col gap-5 shrink-0 h-full lg:overflow-y-auto custom-scrollbar pr-1">
        
        {/* Mode Toggle */}
        <div className="bg-safari-100/50 p-1 rounded-xl flex shadow-inner border border-safari-200/50">
          <button
            onClick={() => setIsDualSpeaker(false)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${!isDualSpeaker ? 'bg-white text-safari-800 shadow-sm' : 'text-safari-500 hover:text-safari-700'}`}
          >
            Single Host
          </button>
          <button
            onClick={() => setIsDualSpeaker(true)}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wide rounded-lg transition-all ${isDualSpeaker ? 'bg-white text-safari-800 shadow-sm' : 'text-safari-500 hover:text-safari-700'}`}
          >
            Dual Host
          </button>
        </div>

        {/* Configurations */}
        <div className="space-y-4">
           {renderHostConfig(isDualSpeaker ? "Host 1 (Lead)" : "Host Voice", host1Name, setHost1Name, host1Personality, setHost1Personality, host1Accent, setHost1Accent, host1, setHost1)}
           
           {isDualSpeaker && renderHostConfig("Host 2 (Co-Host)", host2Name, setHost2Name, host2Personality, setHost2Personality, host2Accent, setHost2Accent, host2, setHost2)}
           
           {/* Studio Ambience / Acting Style */}
           <div className="p-4 bg-white rounded-xl border border-safari-100 shadow-sm space-y-3">
             <label className="text-xs font-bold text-safari-400 uppercase tracking-wider block">Acting Style & Ambience</label>
             
             <div>
               <select 
                 value={musicStyle.id}
                 onChange={(e) => {
                   const style = MUSIC_STYLES.find(s => s.id === e.target.value) || MUSIC_STYLES[0];
                   setMusicStyle(style);
                 }}
                 className="w-full text-sm p-2 bg-safari-50 border border-safari-200 rounded-lg focus:ring-1 focus:ring-safari-400 outline-none appearance-none"
               >
                 {MUSIC_STYLES.map(style => (
                   <option key={style.id} value={style.id}>{style.name}</option>
                 ))}
               </select>
             </div>

             {musicStyle.id !== 'none' && (
               <div className="animate-fade-in-up">
                 <textarea 
                   value={musicDescription}
                   onChange={(e) => setMusicDescription(e.target.value)}
                   rows={2}
                   className="w-full text-xs p-2 bg-safari-50 border border-safari-200 rounded-lg focus:ring-1 focus:ring-safari-400 outline-none resize-none placeholder-safari-300"
                   placeholder="Describe the tone (e.g. whispering, excited)..."
                 />
                 <p className="text-[10px] text-safari-400 mt-1">
                   *Ambience settings influence the voice tone and pacing.
                 </p>
               </div>
             )}
           </div>

           {/* Speed Control */}
           <div className="p-4 bg-white rounded-xl border border-safari-100 shadow-sm">
             <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold text-safari-400 uppercase tracking-wider">Playback Speed</label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-safari-600 bg-safari-50 px-2 py-0.5 rounded">{speed.toFixed(1)}x</span>
                  {speed !== 1.0 && (
                    <button 
                      onClick={() => {
                        setSpeed(1.0);
                        if (audioRef.current) audioRef.current.playbackRate = 1.0;
                      }}
                      className="text-[10px] text-safari-400 hover:text-safari-600 underline"
                    >
                      Reset
                    </button>
                  )}
                </div>
             </div>
             <input 
               type="range" 
               min="0.5" 
               max="2.0" 
               step="0.1" 
               value={speed} 
               onChange={(e) => {
                 const s = parseFloat(e.target.value);
                 setSpeed(s);
                 if (audioRef.current) audioRef.current.playbackRate = s;
               }}
               className="w-full h-2 bg-safari-200 rounded-lg appearance-none cursor-pointer accent-safari-600"
             />
             <div className="flex justify-between mt-1 text-[10px] text-safari-300 font-medium">
                 <span>0.5x</span>
                 <span>1.0x</span>
                 <span>2.0x</span>
             </div>
           </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
            <button
                onClick={generatePodcast}
                disabled={status === AudioStatus.PROCESSING || isRewriting}
                className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-95 flex items-center justify-center space-x-2
                    ${status === AudioStatus.PROCESSING || isRewriting
                        ? 'bg-safari-400 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-safari-700 to-safari-900 hover:shadow-safari-800/30'
                    }`}
            >
                {status === AudioStatus.PROCESSING ? (
                    <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Synthesizing...</span>
                    </>
                ) : (
                    <>
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                        </svg>
                        <span>Generate Audio</span>
                    </>
                )}
            </button>

            {downloadUrl && (
                <div className="space-y-2 animate-fade-in-up">
                    <audio 
                        ref={audioRef}
                        controls 
                        src={downloadUrl} 
                        className="w-full h-10"
                        onPlay={(e) => { e.currentTarget.playbackRate = speed; }}
                    />
                    <a
                        href={downloadUrl}
                        download={`jackal-podcast-${isDualSpeaker ? 'dual' : 'single'}.wav`}
                        className="block w-full"
                    >
                        <button className="w-full py-2 px-4 rounded-lg font-bold text-safari-700 bg-safari-50 border border-safari-200 hover:bg-white transition-all flex items-center justify-center space-x-2 text-sm">
                             <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                <path fillRule="evenodd" d="M12 2.25a.75.75 0 01.75.75v11.69l3.22-3.22a.75.75 0 111.06 1.06l-4.5 4.5a.75.75 0 01-1.06 0l-4.5-4.5a.75.75 0 111.06-1.06l3.22 3.22V3a.75.75 0 01.75-.75zm-9 13.5a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
                            </svg>
                            <span>Download .WAV</span>
                        </button>
                    </a>
                </div>
            )}
            
            {status === AudioStatus.ERROR && (
                <div className="text-center p-2 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-red-700 text-xs font-semibold">{errorMessage || "Generation failed. Please try again."}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};