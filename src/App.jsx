import { useState, useRef, useEffect } from 'react';
import { Loader2, Play, Settings2, Image as ImageIcon, Video, Music, Check, ChevronRight, Download, Wand2 } from 'lucide-react';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [apiKey, setApiKey] = useState('2de6dba5c13f5379d3e3a23b2406a402');

  // Minimalist placeholders
  const [prompt, setPrompt] = useState('A cinematic long shot of a Tokyo street at night, neon signs reflecting in puddles, a solitary figure walking away perfectly animated.');
  const [imageUrl, setImageUrl] = useState('https://file.aiquickdraw.com/custom-page/akr/section-images/17594315607644506ltpf.jpg');
  const [audioStyle, setAudioStyle] = useState('Rain hitting pavement, subtle city hum, distant siren');

  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [progressWidth, setProgressWidth] = useState(0);
  const [finalVideoUrl, setFinalVideoUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [gallery, setGallery] = useState([]);

  // Auto-clear error when user types
  useEffect(() => { if (errorMsg) setErrorMsg(''); }, [prompt, imageUrl, apiKey]);

  const handleGenerate = async () => {
    if (!isDemoMode && !apiKey) return setErrorMsg("Kie AI API Key is required in Live Mode.");
    if (!imageUrl) return setErrorMsg("A reference structure image is required.");
    if (!prompt) return setErrorMsg("Please provide a prompt for the model.");

    setIsGenerating(true);
    setFinalVideoUrl('');
    setErrorMsg('');

    if (isDemoMode) {
      setLoadingMsg('Initializing Proxy Sequence...');
      setProgressWidth(15);

      try {
        for (let i = 1; i <= 4; i++) {
          await new Promise(r => setTimeout(r, 800));
          setProgressWidth(15 + i * 20);
          const messages = ["Analyzing input topology...", "Rendering keyframes via OpenAI...", "Applying native spatial audio...", "Finalizing H.264 encode..."];
          setLoadingMsg(messages[i - 1]);
        }

        // Premium Open AI Sora Sample
        const demoVidUrl = "https://cdn.openai.com/sora/videos/tokyo-walk.mp4";

        setProgressWidth(100);
        await new Promise(r => setTimeout(r, 600)); // smooth finish

        setFinalVideoUrl(demoVidUrl);
        setGallery(prev => [demoVidUrl, ...prev]);
      } finally {
        setIsGenerating(false);
        setTimeout(() => setProgressWidth(0), 1000);
      }
      return;
    }

    setLoadingMsg('Dispatching payload to Kie AI compute cluster...');
    setProgressWidth(10);

    try {
      const response = await fetch("https://api.kie.ai/api/v1/jobs/createTask", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "sora-2-image-to-video",
          input: {
            prompt: `${prompt}. [BACKGROUND AUDIO: ${audioStyle}]`,
            image_urls: [imageUrl]
          }
        })
      });

      if (!response.ok) throw new Error(`Network cluster rejected: ${await response.text()}`);

      const initData = await response.json();
      if (initData.code !== 200 || !initData.data?.taskId) {
        throw new Error(`Init exception: ${initData.msg || 'Unknown failure'}`);
      }

      const taskId = initData.data.taskId;
      setProgressWidth(25);

      let isCompleted = false;
      let finalUrl = "";

      while (!isCompleted) {
        setLoadingMsg('Model processing: Synthesizing tensor graphics...');
        await new Promise(r => setTimeout(r, 4000));

        const pollResp = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });

        const pollData = await pollResp.json();

        if (pollData.code === 200 && pollData.data) {
          const state = pollData.data.state;

          if (state === "waiting" || state === "processing") {
            setProgressWidth(prev => Math.min(prev + 5, 88));
          } else if (state === "success") {
            isCompleted = true;
            let resultUrls = [];
            try {
              const resObj = JSON.parse(pollData.data.resultJson);
              resultUrls = resObj.resultUrls || [];
            } catch (e) { }

            finalUrl = resultUrls[0] || "";
            setProgressWidth(98);
          } else if (state === "fail") {
            throw new Error(`GPU Exception: ${pollData.data.failMsg || 'Generation failed at cluster layer.'}`);
          }
        } else {
          throw new Error(`Polling fault: ${pollData.msg}`);
        }
      }

      if (!finalUrl) throw new Error("Processing finished but output node was empty.");

      setProgressWidth(100);
      await new Promise(r => setTimeout(r, 500));
      setFinalVideoUrl(finalUrl);
      setGallery(prev => [finalUrl, ...prev]);

    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgressWidth(0), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-300 font-sans selection:bg-zinc-800">

      {/* Absolute Minimal Top Nav */}
      <nav className="flex items-center justify-between px-10 py-6 border-b border-white/5 sticky top-0 z-50 bg-[#09090b]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
            <Wand2 size={16} className="text-black" />
          </div>
          <span className="text-xl font-medium tracking-tight text-white">AuraStream</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 ml-2">PRO 2.0</span>
        </div>

        <div className="flex bg-zinc-900/50 p-1 rounded-full border border-white/5">
          {['create', 'gallery', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-out capitalize ${activeTab === tab ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-zinc-400 hover:text-white transition">Documentation</button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto mt-12 px-6 pb-24">

        {/* CREATE TAB */}
        {activeTab === 'create' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-in fade-in zoom-in-95 duration-500 fill-mode-both">

            {/* LEFT COLUMN: PARAMETERS */}
            <div className="xl:col-span-4 space-y-6">

              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold tracking-widest uppercase text-zinc-500 flex items-center gap-2">
                    <Settings2 size={14} /> Engine Config
                  </span>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-8 h-4 rounded-full transition-colors duration-300 relative ${isDemoMode ? 'bg-white' : 'bg-zinc-700'}`}>
                      <div className={`absolute top-0.5 bottom-0.5 w-3 bg-black rounded-full transition-all duration-300 shadow ${isDemoMode ? 'left-4' : 'left-0.5'}`}></div>
                    </div>
                    <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${isDemoMode ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-400'}`}>
                      Free Proxy
                    </span>
                    {/* Invisible checkbox for accessibility */}
                    <input type="checkbox" className="hidden" checked={isDemoMode} onChange={e => setIsDemoMode(e.target.checked)} />
                  </label>
                </div>

                <div className={`transition-all duration-500 overflow-hidden ${isDemoMode ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'}`}>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="input-minimal w-full rounded-xl p-3 text-sm focus:ring-1 focus:ring-zinc-700 font-mono"
                    placeholder="sk-kie-..."
                  />
                  <p className="text-[10px] text-zinc-500 mt-2 ml-1">Requires Kie AI credits for live Sora 2 inference.</p>
                </div>
              </div>

              <div className="glass-panel p-8 rounded-2xl flex flex-col gap-6">

                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3 flex items-center gap-2">
                    <Video size={14} /> Scene Director
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="input-minimal w-full rounded-xl p-4 text-sm h-32 leading-relaxed resize-none text-zinc-300 font-medium placeholder:font-normal"
                    placeholder="Describe the cinematography, action, and lighting..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3 flex items-center gap-2">
                    <ImageIcon size={14} /> Composition Anchor
                  </label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="input-minimal w-full rounded-xl p-3.5 text-sm font-mono text-zinc-400"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold tracking-widest uppercase text-zinc-500 mb-3 flex items-center gap-2">
                    <Music size={14} /> Acoustic Layer
                  </label>
                  <input
                    type="text"
                    value={audioStyle}
                    onChange={(e) => setAudioStyle(e.target.value)}
                    className="input-minimal w-full rounded-xl p-3.5 text-sm text-zinc-300"
                    placeholder="Foley, ambience, or music..."
                  />
                </div>

                {errorMsg && (
                  <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4 animate-in slide-in-from-top-2">
                    <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1">Compute Error</p>
                    <p className="text-sm text-red-200">{errorMsg}</p>
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="btn-primary w-full py-4 rounded-xl flex justify-center items-center gap-2 mt-4 text-sm"
                >
                  {isGenerating ? (
                    <><Loader2 className="animate-spin text-zinc-500" size={18} /> Executing Neural Pass...</>
                  ) : (
                    <>Initialize Render <ChevronRight size={16} /></>
                  )}
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN: PREVIEW/VIEWPORT */}
            <div className="xl:col-span-8 flex flex-col gap-4">
              <div
                className={`glass-panel w-full aspect-video rounded-[2rem] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 ${finalVideoUrl && !isGenerating ? 'bg-black shadow-[0_0_50px_rgba(255,255,255,0.05)]' : ''}`}
              >
                {/* IDLE STATE */}
                {!isGenerating && !finalVideoUrl && (
                  <div className="text-center opacity-60">
                    <div className="w-16 h-16 rounded-full border border-zinc-700/50 flex items-center justify-center mx-auto mb-4 bg-zinc-900/50">
                      <Wand2 size={24} className="text-zinc-600 shimmer-icon" />
                    </div>
                    <p className="text-zinc-500 text-sm font-medium tracking-wide">Awaiting Sequence</p>
                  </div>
                )}

                {/* GENERATING STATE */}
                {isGenerating && (
                  <div className="w-full h-full absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-md z-20 transition-all">
                    <div className="w-80 max-w-full px-6 flex flex-col items-center">
                      <Loader2 className="animate-spin text-white mb-6" size={32} strokeWidth={1.5} />
                      <p className="text-xs font-mono text-zinc-400 mb-6 tracking-widest uppercase">{loadingMsg}</p>

                      {/* Premium Progress Bar */}
                      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="bg-white h-full transition-all duration-[800ms] ease-out shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                          style={{ width: `${progressWidth}%` }}
                        ></div>
                      </div>
                      <div className="w-full flex justify-between mt-2 px-1 text-[10px] text-zinc-600 font-mono">
                        <span>0%</span>
                        <span>{Math.round(progressWidth)}%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* RESULT STATE */}
                {finalVideoUrl && !isGenerating && (
                  <video
                    src={finalVideoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover z-10 absolute inset-0 animate-in fade-in duration-1000"
                  ></video>
                )}
              </div>

              <div className="flex justify-between items-center px-6 py-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-900/50 rounded-full border border-zinc-800 text-[10px] font-medium text-zinc-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Connected
                  </div>
                  <span className="text-xs text-zinc-600 font-medium">Model: <span className="text-zinc-300 font-mono">{isDemoMode ? 'OpenAI Sample (Free)' : 'Sora 2 (Audio)'}</span></span>
                </div>
                {finalVideoUrl && (
                  <button className="flex items-center gap-2 text-xs font-semibold text-white hover:text-zinc-300 transition px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full">
                    <Download size={14} /> Download Asset
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* GALLERY TAB */}
        {activeTab === 'gallery' && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-8 duration-500 fill-mode-both">
            {gallery.length === 0 ? (
              <div className="col-span-full py-40 flex flex-col items-center justify-center opacity-40">
                <div className="w-16 h-16 rounded-full border border-zinc-700 flex items-center justify-center mb-4">
                  <ImageIcon size={24} className="text-zinc-600" />
                </div>
                <p className="text-zinc-500 text-sm font-medium">No assets generated yet.</p>
              </div>
            ) : (
              gallery.map((vid, idx) => (
                <div key={idx} className="glass-panel aspect-video rounded-2xl overflow-hidden relative group cursor-pointer ring-1 ring-white/5 hover:ring-white/20 transition-all duration-300">
                  <video src={vid} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"></video>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                    <div className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center scale-75 group-hover:scale-100 transition-all duration-300">
                      <Play fill="currentColor" size={18} className="ml-1" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-light tracking-tight mb-10 text-white">System Diagnostics</h2>

            <div className="space-y-4 text-sm text-zinc-400">
              <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
                <div className="mt-1"><Check size={18} className="text-zinc-500" /></div>
                <div>
                  <p className="text-white font-medium mb-1">Audio Spatial Override</p>
                  <p className="leading-relaxed">Acoustic parameters are compiled directly into the multimodal payload, natively directing the Sora 2 engine via proxy injection.</p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
                <div className="mt-1"><Check size={18} className="text-zinc-500" /></div>
                <div>
                  <p className="text-white font-medium mb-1">Asynchronous Compute Pipeline</p>
                  <p className="leading-relaxed">GPU clusters are polled dynamically using a 4-second heartbeat, minimizing frontend block caching while awaiting the H.264 artifact.</p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl flex items-start gap-4">
                <div className="mt-1"><Check size={18} className="text-zinc-500" /></div>
                <div>
                  <p className="text-white font-medium mb-1">Vite + React 19 Architecture</p>
                  <p className="leading-relaxed">Utilizing DOM-diffing and virtual orchestration to allow seamless state transitions without invoking generic browser painting.</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
