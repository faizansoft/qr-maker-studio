
import React, { useState, useRef, useEffect, useMemo } from 'react';
import QRCodeStyling, { Options } from 'qr-code-styling';
import { QRConfig, QRType, StylePreset, AIStyleSuggestion } from './types';
import { STYLE_PRESETS, ERROR_CORRECTION_LEVELS, DOT_STYLES, CORNER_SQUARE_STYLES, CORNER_DOT_STYLES } from './constants';
import { getAIStyleSuggestion } from './services/geminiService';
import { Button } from './components/Button';
import { LogoUploader } from './components/LogoUploader';

// Simple Modal Component for Sub-pages
const Modal: React.FC<{ title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode }> = ({ title, isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-display font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-8 prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium text-sm">
          {children}
        </div>
        <div className="p-8 border-t border-slate-50 flex justify-end">
          <Button onClick={onClose} size="sm" variant="secondary">Close</Button>
        </div>
      </div>
    </div>
  );
};

const AdPlacement: React.FC<{ label?: string, height?: string, className?: string }> = ({ label = "Advertisement", height = "90px", className = "" }) => (
  <div className={`w-full flex flex-col items-center justify-center my-8 ${className}`}>
    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">{label}</span>
    <div className="w-full ad-placeholder flex items-center justify-center overflow-hidden rounded-2xl" style={{ minHeight: height }}>
      <p className="text-slate-400 text-xs italic">Google AdSense Partner Unit</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [config, setConfig] = useState<QRConfig>({
    value: 'https://qrstudiopro.app',
    fgColor: '#1e293b',
    bgColor: '#ffffff',
    level: 'H',
    size: 512,
    includeMargin: true,
    dotType: 'square',
    cornerSquareType: 'square',
    cornerDotType: 'square',
    cornerSquareColor: '#1e293b',
    cornerDotColor: '#1e293b',
  });
  
  const [activeType, setActiveType] = useState<QRType>('url');
  const [activeTab, setActiveTab] = useState<'content' | 'pattern' | 'corners' | 'logo'>('content');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AIStyleSuggestion | null>(null);
  const [modalType, setModalType] = useState<string | null>(null);
  
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCode = useMemo(() => new QRCodeStyling(), []);

  // Simple Input Validation
  const isValid = useMemo(() => {
    if (!config.value.trim()) return false;
    if (activeType === 'url') {
      try { new URL(config.value); return true; } catch { return config.value.includes('.'); }
    }
    return true;
  }, [config.value, activeType]);

  useEffect(() => {
    const options: Options = {
      width: 320,
      height: 320,
      data: config.value || ' ',
      margin: config.includeMargin ? 12 : 0,
      qrOptions: { errorCorrectionLevel: config.level },
      image: logoSrc || undefined,
      dotsOptions: { color: config.fgColor, type: config.dotType },
      backgroundOptions: { color: config.bgColor },
      imageOptions: { crossOrigin: 'anonymous', margin: 8, imageSize: 0.4, hideBackgroundDots: true },
      cornersSquareOptions: { type: config.cornerSquareType, color: config.cornerSquareColor },
      cornersDotOptions: { type: config.cornerDotType, color: config.cornerDotColor }
    };
    qrCode.update(options);
  }, [config, logoSrc, qrCode]);

  useEffect(() => {
    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.append(qrRef.current);
    }
  }, [qrCode]);

  const handleDownload = (format: 'png' | 'svg' | 'webp') => {
    qrCode.download({ name: `qr-maker-${Date.now()}`, extension: format });
  };

  const applyAIStyle = async () => {
    if (!config.value) return;
    setIsAiLoading(true);
    try {
      const suggestion = await getAIStyleSuggestion(config.value);
      setAiSuggestion(suggestion);
      setConfig(prev => ({
        ...prev,
        fgColor: suggestion.primaryColor,
        bgColor: suggestion.secondaryColor,
        cornerSquareColor: suggestion.cornerSquareColor,
        cornerDotColor: suggestion.cornerDotColor,
        dotType: suggestion.dotType,
        cornerSquareType: suggestion.cornerSquareType,
        cornerDotType: suggestion.cornerDotType,
      }));
    } finally { setIsAiLoading(false); }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="qr-gradient w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100 ring-2 ring-white">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 17h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h1 className="text-xl font-display font-bold text-slate-900 tracking-tight">QR Maker <span className="text-indigo-600">Studio</span></h1>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('how-to')} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">How to Create</button>
            <button onClick={() => scrollToSection('benefits')} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">Benefits</button>
            <button onClick={() => scrollToSection('faq')} className="text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">FAQ</button>
          </nav>
          <div className="hidden sm:flex px-3 py-1 bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-100">Verified Professional Tool</div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-display font-extrabold text-slate-900 mb-4 tracking-tight">
            The #1 Free <span className="text-indigo-600">QR Code Maker</span>
          </h2>
          <p className="text-lg text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
            Generate custom, scannable QR codes with logos instantly. Our AI-powered generator helps you design professional 
            codes for websites, business cards, and marketing materials in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-7 space-y-8">
            <section className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
              <div className="flex bg-slate-50/50 border-b border-slate-100">
                {(['content', 'pattern', 'corners', 'logo'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 px-4 py-5 text-xs font-black uppercase tracking-widest transition-all relative ${
                      activeTab === tab ? 'text-indigo-600 bg-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab}
                    {activeTab === tab && <div className="absolute inset-x-0 bottom-0 h-1 bg-indigo-500"></div>}
                  </button>
                ))}
              </div>

              <div className="p-8 md:p-10">
                {activeTab === 'content' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex flex-wrap gap-2.5 p-2 bg-slate-100 rounded-2xl w-fit">
                      {(['url', 'text', 'email', 'phone', 'vcard'] as QRType[]).map(type => (
                        <button key={type} onClick={() => setActiveType(type)} className={`px-5 py-2.5 rounded-xl text-xs font-bold capitalize transition-all ${activeType === type ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>{type}</button>
                      ))}
                    </div>
                    <div className="relative group">
                      <textarea 
                        value={config.value} 
                        onChange={(e) => setConfig(prev => ({ ...prev, value: e.target.value }))} 
                        placeholder={`Enter your ${activeType} here...`} 
                        className={`w-full h-44 p-6 rounded-[2rem] border-2 bg-white text-slate-900 placeholder:text-slate-300 focus:ring-4 outline-none transition-all resize-none text-lg font-medium shadow-inner ${isValid ? 'border-slate-100 focus:ring-indigo-50 focus:border-indigo-400' : 'border-red-100 focus:ring-red-50 focus:border-red-400'}`}
                      />
                      <div className="absolute bottom-6 right-6 flex items-center gap-2">
                        {config.value && (
                          <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${isValid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                            {isValid ? 'Ready to Scan' : 'Invalid Format'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Button variant="ghost" size="md" onClick={applyAIStyle} loading={isAiLoading} className="text-indigo-600 font-bold hover:bg-indigo-50 px-6">
                        <svg className="mr-3 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        Apply AI Smart Style
                      </Button>
                    </div>
                  </div>
                )}
                {activeTab === 'pattern' && (
                  <div className="space-y-8 animate-in fade-in">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {DOT_STYLES.map(style => (
                        <button key={style.value} onClick={() => setConfig(prev => ({ ...prev, dotType: style.value }))} className={`p-5 rounded-2xl border-2 text-left transition-all ${config.dotType === style.value ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-300'}`}>
                          <span className="text-xs font-black uppercase tracking-widest block">{style.label}</span>
                        </button>
                      ))}
                    </div>
                    <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pattern Palette</label><div className="flex gap-3 items-center p-3 bg-slate-50 rounded-2xl border border-slate-200"><input type="color" value={config.fgColor} onChange={(e) => setConfig(prev => ({ ...prev, fgColor: e.target.value }))} className="w-12 h-10 rounded-xl cursor-pointer border-0 bg-transparent"/><input type="text" value={config.fgColor} onChange={(e) => setConfig(prev => ({ ...prev, fgColor: e.target.value }))} className="bg-transparent text-sm font-mono font-bold uppercase outline-none flex-1" /></div></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canvas Background</label><div className="flex gap-3 items-center p-3 bg-slate-50 rounded-2xl border border-slate-200"><input type="color" value={config.bgColor} onChange={(e) => setConfig(prev => ({ ...prev, bgColor: e.target.value }))} className="w-12 h-10 rounded-xl cursor-pointer border-0 bg-transparent"/><input type="text" value={config.bgColor} onChange={(e) => setConfig(prev => ({ ...prev, bgColor: e.target.value }))} className="bg-transparent text-sm font-mono font-bold uppercase outline-none flex-1" /></div></div>
                    </div>
                  </div>
                )}
                {activeTab === 'corners' && (
                  <div className="grid sm:grid-cols-2 gap-10 animate-in fade-in">
                    <div className="space-y-5">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Outer Frame Style</label>
                      <div className="space-y-2.5">{CORNER_SQUARE_STYLES.map(s => <button key={s.value} onClick={() => setConfig(prev => ({ ...prev, cornerSquareType: s.value }))} className={`w-full p-4 rounded-2xl border-2 text-left text-xs font-bold uppercase transition-all ${config.cornerSquareType === s.value ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-50 hover:border-slate-200'}`}>{s.label}</button>)}</div>
                    </div>
                    <div className="space-y-5">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Inner Eye Style</label>
                      <div className="space-y-2.5">{CORNER_DOT_STYLES.map(s => <button key={s.value} onClick={() => setConfig(prev => ({ ...prev, cornerDotType: s.value }))} className={`w-full p-4 rounded-2xl border-2 text-left text-xs font-bold uppercase transition-all ${config.cornerDotType === s.value ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-50 hover:border-slate-200'}`}>{s.label}</button>)}</div>
                    </div>
                  </div>
                )}
                {activeTab === 'logo' && (
                  <div className="space-y-8 animate-in fade-in">
                    <LogoUploader onUpload={setLogoSrc} currentLogo={logoSrc} />
                    <div className="p-6 rounded-3xl bg-indigo-50/50 border border-indigo-100">
                      <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                        Professional Logo Masking
                      </h4>
                      <p className="text-sm text-indigo-600/80 leading-relaxed font-medium">
                        Our QR generator uses high-level error correction to ensure your code remains scannable 
                        even with a logo in the center. We recommend using a high-contrast logo for the best results.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>
            
            <AdPlacement height="120px" label="Featured Design Resource" className="hidden md:flex" />
          </div>

          <aside className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center group relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 qr-gradient"></div>
              <div className="relative p-10 rounded-[2.5rem] bg-slate-50 shadow-inner">
                <div ref={qrRef} className="relative z-10 shadow-2xl rounded-2xl overflow-hidden bg-white border-8 border-white" />
              </div>

              {aiSuggestion && (
                <div className="mt-8 p-6 rounded-3xl bg-slate-900 text-white text-center w-full shadow-xl">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 block mb-2">AI Design Report</span>
                  <h4 className="text-sm font-bold mb-1">{aiSuggestion.mood} Style</h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-medium">"{aiSuggestion.description}"</p>
                </div>
              )}

              <div className="w-full mt-10 space-y-3">
                <Button onClick={() => handleDownload('png')} disabled={!isValid} className="w-full py-5 text-lg rounded-2xl shadow-indigo-200 shadow-xl hover:-translate-y-1">Export High-Res PNG</Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => handleDownload('svg')} disabled={!isValid} variant="outline" className="w-full py-4 text-xs font-black tracking-widest border-slate-200 uppercase">Vector SVG</Button>
                  <Button onClick={() => handleDownload('webp')} disabled={!isValid} variant="outline" className="w-full py-4 text-xs font-black tracking-widest border-slate-200 uppercase">WebP Image</Button>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <article className="mt-32 seo-content max-w-5xl mx-auto border-t border-slate-200 pt-16">
          <h2 id="how-to">How to Use the Ultimate QR Code Maker</h2>
          <p>
            Creating a professional QR code has never been easier. With <strong>QR Maker Studio</strong>, you have access to the same 
            technology used by major brands to create scannable marketing assets.
          </p>
          
          <h3>Step-by-Step Instructions:</h3>
          <ul>
            <li><strong>Step 1:</strong> Select your content type (URL, Text, VCard, or Email).</li>
            <li><strong>Step 2:</strong> Enter your data accurately. Our validator will confirm if the format is ready.</li>
            <li><strong>Step 3:</strong> Use the "Pattern" tab to choose from modern styles like 'Classy' or 'Soft Rounded'.</li>
            <li><strong>Step 4:</strong> Upload your business logo to build trust and brand recognition.</li>
            <li><strong>Step 5:</strong> Download your code in high-resolution vector formats for crystal-clear printing.</li>
          </ul>

          <h2 id="benefits">Benefits of Custom QR Codes for Business</h2>
          <div className="grid md:grid-cols-2 gap-8 my-10">
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-2">High Scan Reliability</h4>
                <p className="text-sm">We use ISO standard error correction (up to 30%) so your codes scan even if they are slightly damaged.</p>
            </div>
            <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-2">Infinite Scalability</h4>
                <p className="text-sm">Our SVG vector export allows you to print your QR code on anything from a postage stamp to a giant billboard.</p>
            </div>
          </div>

          <h2 id="faq">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <details className="p-6 bg-slate-50 rounded-3xl cursor-pointer group">
                <summary className="font-bold text-slate-900 list-none flex justify-between items-center">
                    Can I make a QR code for a PDF?
                    <span className="text-indigo-600 transition-transform group-open:rotate-180">▼</span>
                </summary>
                <p className="mt-4 text-sm text-slate-500">To create a QR code for a PDF, upload your PDF file to a cloud service (like Google Drive or Dropbox), copy the link, and paste it into our URL input field.</p>
            </details>
          </div>
        </article>
      </main>

      <footer className="bg-slate-900 text-white py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-12 text-sm">
          <div className="space-y-4">
            <h5 className="font-display font-bold text-xl">QR Maker Studio</h5>
            <p className="text-slate-400 leading-relaxed">The world's most trusted free resource for professional QR codes.</p>
          </div>
          <div className="space-y-4">
            <h6 className="font-bold uppercase tracking-widest text-xs text-indigo-400">Products</h6>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-white transition-colors">Free QR Generator</button></li>
              <li><button onClick={() => { setActiveTab('content'); window.scrollTo({ top: 400, behavior: 'smooth' }); }} className="hover:text-white transition-colors">AI Style Designer</button></li>
              <li><button onClick={() => { setActiveTab('logo'); window.scrollTo({ top: 400, behavior: 'smooth' }); }} className="hover:text-white transition-colors">Branded Solutions</button></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h6 className="font-bold uppercase tracking-widest text-xs text-indigo-400">Resources</h6>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => setModalType('guides')} className="hover:text-white transition-colors">User Guides</button></li>
              <li><button onClick={() => setModalType('api')} className="hover:text-white transition-colors">API Docs</button></li>
              <li><button onClick={() => setModalType('privacy')} className="hover:text-white transition-colors">Privacy Policy</button></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h6 className="font-bold uppercase tracking-widest text-xs text-indigo-400">Company</h6>
            <ul className="space-y-2 text-slate-400">
              <li><button onClick={() => setModalType('terms')} className="hover:text-white transition-colors">Terms of Service</button></li>
              <li><a href="mailto:support@qrstudiopro.app" className="hover:text-white transition-colors">Support Email</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-slate-800 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          © 2024 QR Maker Studio • All rights reserved
        </div>
      </footer>

      {/* SUB-PAGES MODALS */}
      <Modal title="Privacy Policy" isOpen={modalType === 'privacy'} onClose={() => setModalType(null)}>
        <p>Your privacy is our priority. Unlike other generators, QR Maker Studio does not store the data you input into our QR generator. All processing happens locally in your browser.</p>
        <p><strong>1. Data Collection:</strong> We do not collect personal information or the content of the QR codes you generate.</p>
        <p><strong>2. Cookies:</strong> We use minimal cookies to remember your design preferences (like colors and patterns) so you can continue your work later.</p>
        <p><strong>3. Third Parties:</strong> We may use Google AdSense to serve advertisements, which might collect non-identifiable usage data to improve ad relevance.</p>
      </Modal>

      <Modal title="Terms of Service" isOpen={modalType === 'terms'} onClose={() => setModalType(null)}>
        <p>By using QR Maker Studio, you agree to the following terms:</p>
        <p><strong>1. Usage:</strong> You are free to use the generated QR codes for personal and commercial projects. No license fee is required.</p>
        <p><strong>2. Restrictions:</strong> You may not use this tool to generate QR codes leading to malicious software, phishing sites, or illegal content.</p>
        <p><strong>3. Warranty:</strong> This tool is provided "as is" without any warranties. While we strive for 100% scannability, it is your responsibility to test your QR codes before printing.</p>
      </Modal>

      <Modal title="API Documentation" isOpen={modalType === 'api'} onClose={() => setModalType(null)}>
        <p>Integrate our QR generation engine into your own workflow with our easy-to-use API.</p>
        <pre className="bg-slate-900 text-indigo-400 p-4 rounded-xl text-xs overflow-x-auto my-4">
{`// Example API Request
fetch('https://api.qrstudiopro.app/v1/generate', {
  method: 'POST',
  body: JSON.stringify({
    data: 'https://mysite.com',
    style: 'classy',
    color: '#6366f1'
  })
})`}
        </pre>
        <p>Contact us for API key access and custom pricing for high-volume enterprise needs.</p>
      </Modal>

      <Modal title="User Guide" isOpen={modalType === 'guides'} onClose={() => setModalType(null)}>
        <h4 className="text-slate-900 font-bold mb-2">Getting the best results:</h4>
        <ul className="list-disc pl-5 space-y-2">
          <li><strong>Contrast is King:</strong> Always make sure your pattern color is much darker than your background.</li>
          <li><strong>Quiet Zones:</strong> Keep the margin option enabled. Scanners need white space around the QR code to focus correctly.</li>
          <li><strong>Size Matters:</strong> Don't print QR codes smaller than 2cm x 2cm for best reliability.</li>
          <li><strong>Vector Benefits:</strong> Use SVG for any printed materials (posters, cards) as it won't pixelate.</li>
        </ul>
      </Modal>
    </div>
  );
};

export default App;
