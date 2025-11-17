import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MindMapData } from './types';
import MindMap from './components/MindMap';
import Controls from './components/Controls';
import Icon from './components/Icon';
import {
  generateMindMapExplanation,
  generateMindMapExplanationFromImage,
  generateTopicExplanation,
  generateSpeech,
  decode,
  decodeAudioData,
  ExplanationResponse,
} from './services/geminiService';

const isValidMindMapData = (data: any): data is MindMapData => {
  return (
    data &&
    typeof data.centralTopic === 'string' &&
    Array.isArray(data.nodes) &&
    Array.isArray(data.links) &&
    data.nodes.every((n: any) => n.id && n.label && typeof n.level === 'number') &&
    data.links.every((l: any) => l.source && l.target)
  );
};

type Language = 'English' | 'Arabic';
type DisplayMode = 'structure' | 'topic';
type Descriptions = { english: string; arabic: string };

const App: React.FC = () => {
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [centralTopic, setCentralTopic] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [explanationText, setExplanationText] = useState<string>('Welcome! Please upload a mind map image or JSON file to get started.');
  const [isSoundOn, setIsSoundOn] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const [structureDescriptions, setStructureDescriptions] = useState<Descriptions | null>(null);
  const [topicDescriptions, setTopicDescriptions] = useState<Descriptions | null>(null);
  const [displayLanguage, setDisplayLanguage] = useState<Language>('English');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('structure');

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const structureAudioBuffersRef = useRef<{ English: AudioBuffer | null; Arabic: AudioBuffer | null }>({ English: null, Arabic: null });
  const topicAudioBuffersRef = useRef<{ English: AudioBuffer | null; Arabic: AudioBuffer | null }>({ English: null, Arabic: null });
  const svgRef = useRef<SVGSVGElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopAudio = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch (error) {
        console.warn("Audio node could not be stopped:", error);
      }
      sourceNodeRef.current = null;
    }
  }, []);

  const playAudio = useCallback((language: Language, mode: DisplayMode) => {
    const buffer = mode === 'structure' 
      ? structureAudioBuffersRef.current[language] 
      : topicAudioBuffersRef.current[language];

    if (buffer && audioCtxRef.current) {
      stopAudio();
      const source = audioCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtxRef.current.destination);
      source.start();
      sourceNodeRef.current = source;
    }
  }, [stopAudio]);
  
  const generateAndPlayAudio = useCallback(async (text: string, language: Language, mode: DisplayMode) => {
    setAudioError(null);
    if (!text) return;
  
    try {
      const speechResult = await generateSpeech(text);
      if (speechResult.audio && audioCtxRef.current) {
        const decodedBytes = decode(speechResult.audio);
        const buffer = await decodeAudioData(decodedBytes, audioCtxRef.current);
        
        if (mode === 'structure') {
          structureAudioBuffersRef.current[language] = buffer;
        } else {
          topicAudioBuffersRef.current[language] = buffer;
        }

        if (isSoundOn) {
          playAudio(language, mode);
        }
      } else {
        if (mode === 'structure') {
          structureAudioBuffersRef.current[language] = null;
        } else {
          topicAudioBuffersRef.current[language] = null;
        }
        if (speechResult.error) {
          setAudioError(speechResult.error);
        }
      }
    } catch (error) {
      console.error("Error in audio generation pipeline:", error);
      setAudioError("An unexpected error occurred while generating audio.");
    }
  }, [isSoundOn, playAudio]);

  const processInitialExplanation = useCallback(async (explanationResponse: ExplanationResponse) => {
    setIsLoading(true);
    stopAudio();
    structureAudioBuffersRef.current = { English: null, Arabic: null };
  
    const { centralTopic, english, arabic } = explanationResponse;
    
    setCentralTopic(centralTopic);
    setStructureDescriptions({ english, arabic });
  
    const initialLang: Language = /[\u0600-\u06FF]/.test(centralTopic) ? 'Arabic' : 'English';
    setDisplayLanguage(initialLang);
    setDisplayMode('structure');
    
    const initialText = initialLang === 'English' ? english : arabic;
    await generateAndPlayAudio(initialText, initialLang, 'structure');
  
    setIsLoading(false);
  }, [stopAudio, generateAndPlayAudio]);

  const fetchAndProcessData = useCallback(async (data: MindMapData) => {
    setExplanationText('Generating explanation...');
    await processInitialExplanation(await generateMindMapExplanation(data));
  }, [processInitialExplanation]);

  const fetchAndProcessImageData = useCallback(async (base64: string, mimeType: string) => {
    setExplanationText('Analyzing image and generating explanation...');
    setCentralTopic('Analyzing Image...');
    await processInitialExplanation(await generateMindMapExplanationFromImage(base64, mimeType));
  }, [processInitialExplanation]);
  
  const handleLanguageSwitch = async () => {
    if (isLoading || !structureDescriptions) return;
  
    const newLanguage: Language = displayLanguage === 'English' ? 'Arabic' : 'English';
    setDisplayLanguage(newLanguage);
  
    stopAudio();
  
    if (isSoundOn) {
      const descriptions = displayMode === 'structure' ? structureDescriptions : topicDescriptions;
      const audioBuffer = displayMode === 'structure' 
        ? structureAudioBuffersRef.current[newLanguage] 
        : topicAudioBuffersRef.current[newLanguage];
      
      if (audioBuffer) {
        playAudio(newLanguage, displayMode);
      } else if (descriptions) {
        const textToSpeak = newLanguage === 'English' ? descriptions.english : descriptions.arabic;
        setIsLoading(true);
        await generateAndPlayAudio(textToSpeak, newLanguage, displayMode);
        setIsLoading(false);
      }
    }
  };

  const handleExplainTopicClick = async () => {
    if (isLoading || !centralTopic) return;
    
    stopAudio();
    setDisplayMode('topic');

    if (topicDescriptions) {
        if (isSoundOn) playAudio(displayLanguage, 'topic');
        return;
    }

    setIsLoading(true);
    setExplanationText(`Generating explanation for ${centralTopic}...`);
    const result = await generateTopicExplanation(centralTopic);
    setTopicDescriptions(result);

    const textToSpeak = displayLanguage === 'English' ? result.english : result.arabic;
    await generateAndPlayAudio(textToSpeak, displayLanguage, 'topic');
    setIsLoading(false);
  };

  useEffect(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  useEffect(() => {
    const descriptions = displayMode === 'structure' ? structureDescriptions : topicDescriptions;
    if (descriptions) {
      setExplanationText(displayLanguage === 'English' ? descriptions.english : descriptions.arabic);
    }
  }, [structureDescriptions, topicDescriptions, displayLanguage, displayMode]);

  const handleSoundToggle = () => {
    const newSoundState = !isSoundOn;
    setIsSoundOn(newSoundState);
    if (newSoundState) {
        if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        playAudio(displayLanguage, displayMode);
    } else {
        stopAudio();
    }
  };

  const handleDisplayModeChange = (mode: DisplayMode) => {
    if (mode === displayMode || (mode === 'topic' && !topicDescriptions)) return;
    stopAudio();
    setDisplayMode(mode);
    if(isSoundOn) {
        playAudio(displayLanguage, mode);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMindMapData(null);
    setUploadedImageSrc(null);
    setStructureDescriptions(null);
    setTopicDescriptions(null);
    setDisplayMode('structure');
    setIsLoading(true);
    
    const reader = new FileReader();
    if (file.type.startsWith('image/')) {
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            const base64 = dataUrl.split(',')[1];
            setUploadedImageSrc(dataUrl);
            fetchAndProcessImageData(base64, file.type);
        };
        reader.readAsDataURL(file);
    } else if (file.type === 'application/json') {
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File is not readable");
                const parsedData = JSON.parse(text);

                if (isValidMindMapData(parsedData)) {
                    setMindMapData(parsedData);
                    fetchAndProcessData(parsedData);
                } else {
                    alert("Invalid mind map file format. Please check the file structure.");
                    setExplanationText('The uploaded JSON file has an invalid format. Please try again with a valid file.');
                    setCentralTopic('Upload Failed');
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Error parsing mind map file:", error);
                alert("Could not read or parse the mind map file. Please ensure it's a valid JSON file.");
                setExplanationText('Could not read the uploaded JSON file. Please ensure it is well-formed.');
                setCentralTopic('Upload Failed');
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
    } else {
        alert("Unsupported file type. Please upload a JSON, PNG, or JPEG file.");
        setIsLoading(false);
    }
    event.target.value = '';
  };
  
  const textDirection = displayLanguage === 'Arabic' ? 'rtl' : 'ltr';
  const ToggleButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`w-1/2 p-2 text-center font-semibold rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-secondary ${
        active ? 'bg-brand-secondary text-brand-background' : 'bg-brand-surface hover:bg-white/10 text-brand-text-secondary'
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-screen h-screen flex flex-col md:flex-row bg-brand-background text-brand-text-primary overflow-hidden">
      <main className="flex-1 h-full w-full md:w-2/3 relative flex items-center justify-center bg-black/20">
        {uploadedImageSrc ? (
            <div className="w-full h-full flex items-center justify-center p-4">
                 <img src={uploadedImageSrc} alt="Uploaded mind map" className="max-w-full max-h-full object-contain"/>
            </div>
        ) : mindMapData ? (
            <MindMap data={mindMapData} svgRef={svgRef} />
        ) : (
          <div className="text-center text-brand-text-secondary">
            <Icon name="upload" className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">The canvas is ready.</h2>
            <p className="text-lg">Upload a mind map to begin.</p>
          </div>
        )}
      </main>
      <aside className="w-full md:w-1/3 h-1/2 md:h-full bg-brand-surface p-6 md:p-8 overflow-y-auto shadow-lg">
        <div className="flex flex-col h-full">
            <h1 className="text-3xl font-bold mb-4 text-brand-primary" dir={textDirection}>
            {centralTopic || 'Mind Map Description'}
            </h1>
            
            {structureDescriptions && (
                <div className="flex items-center bg-brand-background p-1 mb-4 rounded-lg" role="tablist">
                    <ToggleButton active={displayMode === 'structure'} onClick={() => handleDisplayModeChange('structure')}>
                        Map Structure
                    </ToggleButton>
                    <ToggleButton active={displayMode === 'topic'} onClick={() => handleDisplayModeChange('topic')}>
                        Topic Explanation
                    </ToggleButton>
                </div>
            )}

            <h2 className="text-xl font-semibold mb-2 text-brand-secondary" dir={textDirection}>
                {displayMode === 'structure' ? 'Audio Description' : 'Topic Explanation'}
            </h2>

            {audioError && (
              <div className="bg-red-900/50 border-l-4 border-red-500 text-red-200 p-4 mb-4 rounded" role="alert">
                <p className="font-bold">Audio Generation Failed</p>
                <p>{audioError}</p>
              </div>
            )}
            {isLoading ? (
            <div className="flex-grow flex items-center justify-center">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-brand-secondary"></div>
                    <p className="mt-4 text-lg text-brand-text-secondary">AI is thinking...</p>
                </div>
            </div>
            ) : (
            <div 
                className="prose prose-invert max-w-none text-brand-text-primary text-lg leading-relaxed flex-grow"
                dir={textDirection}
                aria-live="assertive"
            >
                {explanationText.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                ))}
            </div>
            )}
        </div>
      </aside>
      <Controls
        isSoundOn={isSoundOn}
        isLoading={isLoading}
        onSoundToggle={handleSoundToggle}
        onUpload={handleUploadClick}
        onTranslate={handleLanguageSwitch}
        onExplainTopic={handleExplainTopicClick}
        isTranslationDisabled={isLoading || !structureDescriptions}
        isExplainDisabled={isLoading || !structureDescriptions}
      />
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept="application/json,image/png,image/jpeg,image/webp"
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
};

export default App;
