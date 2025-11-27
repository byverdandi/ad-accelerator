'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Image as ImageIcon, 
  Type, 
  Download, 
  ChevronRight, 
  ChevronLeft, 
  UploadCloud, 
  Loader2, 
  LogOut, 
  Search, 
  Layout,
  X
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged, 
  signOut 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

// --- CONFIGURATION ---

// Your web app's Firebase configuration


const firebaseConfig = {

  apiKey: "AIzaSyAQJ6PFsGCnOpF-fBREpqTlw6Gd13BXrr8",
  authDomain: "ad-accelerator.firebaseapp.com",
  projectId: "ad-accelerator",
  storageBucket: "ad-accelerator.firebasestorage.app",
  messagingSenderId: "24494455308",
  appId: "1:24494455308:web:5fa6625164effb555dcc29"

};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'ad-accelerator-v1';

// --- CONSTANTS ---
const PLATFORMS = {
  meta: { id: 'meta', label: 'Meta', color: 'bg-blue-600', sizes: ['1080x1920', '1080x1080'] },
  linkedin: { id: 'linkedin', label: 'LinkedIn', color: 'bg-blue-800', sizes: ['1200x628', '1200x1200'] },
  pinterest: { id: 'pinterest', label: 'Pinterest', color: 'bg-red-600', sizes: ['1000x1500'] }
};

const TONES = ['Educational', 'Funny', 'Best Friend', 'Persuasive', 'Informational', 'Sarcastic'];

// --- COMPONENTS ---

const LoginScreen = ({ onLogin }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
      <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6">
        <Layout className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Ad Accelerator</h1>
      <p className="text-slate-500 mb-8">Create optimized multi-channel campaigns in seconds.</p>
      <button onClick={onLogin} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
        Sign In to Dashboard
      </button>
    </div>
  </div>
);

const ResultsView = ({ campaign, onBack }) => {
  if (!campaign) return null;
  const platform = PLATFORMS[campaign.platform] || PLATFORMS.meta;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm">
           <ChevronLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="text-right">
          <h2 className="text-xl font-bold text-slate-900">{campaign.campaignName}</h2>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white mt-1 ${platform.color}`}>{platform.label}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Generated Copy */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-indigo-600" /> Generated Copy
          </h3>
          <div className="space-y-6">
            {campaign.assets?.copy?.map((variant, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase mb-2 block">Option {idx + 1}</span>
                <div className="space-y-3">
                  {variant.headline && <div><span className="text-xs font-semibold text-slate-500">Headline:</span><p className="font-bold text-slate-900">{variant.headline}</p></div>}
                  {variant.primaryText && <div><span className="text-xs font-semibold text-slate-500">Primary Text:</span><p className="text-sm text-slate-800">{variant.primaryText}</p></div>}
                   {variant.description && <div><span className="text-xs font-semibold text-slate-500">Description:</span><p className="text-sm text-slate-600 italic">{variant.description}</p></div>}
                </div>
              </div>
            ))}
            {(!campaign.assets?.copy || campaign.assets.copy.length === 0) && (
              <p className="text-slate-400 text-sm italic">No copy generated.</p>
            )}
          </div>
        </section>

        {/* Generated Image */}
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-600" /> Generated Creative
          </h3>
          <div className="bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
            {campaign.assets?.imageUrl ? (
              <img src={campaign.assets.imageUrl} alt="AI Generated" className="w-full h-auto object-cover" />
            ) : (
              <div className="h-64 flex items-center justify-center text-slate-400">No Image Generated</div>
            )}
            {campaign.assets?.imageUrl && (
              <div className="p-3 bg-white border-t border-slate-200 text-center">
                <a 
                  href={campaign.assets.imageUrl} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-indigo-600 text-sm font-medium hover:underline flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download High Res
                </a>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

const CampaignWizard = ({ onCancel, onComplete, userId }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [formData, setFormData] = useState({
    campaignName: '',
    platform: '',
    industry: '',
    objective: '',
    keyMessages: '',
    tone: 'Persuasive',
    uploadedImages: [] // Storing file names for UI only for now
  });

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({
        ...prev,
        uploadedImages: [...prev.uploadedImages, file.name]
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Call YOUR new Real Backend API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const aiData = await response.json();

      if (!aiData.success) throw new Error("AI Generation Failed: " + (aiData.error || "Unknown Error"));

      // 2. Save to Firestore
      const campaignData = {
        userId,
        ...formData,
        assets: {
          copy: aiData.copy,
          imageUrl: aiData.imageUrl
        },
        createdAt: serverTimestamp()
      };
      
      await addDoc(collection(db, 'users', userId, 'campaigns'), campaignData);
      onComplete();

    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate ads. Please check: 1. Your API Key is set in Vercel. 2. You have credits in OpenAI.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4 animate-pulse">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-900">AI is working...</h3>
          <p className="text-slate-500">Writing copy and painting pixels. This takes about 15-20s.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg">New Campaign</h2>
        <span className="text-sm text-slate-500">Step {step} of 2</span>
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
              <input 
                type="text" 
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Winter Launch"
                value={formData.campaignName}
                onChange={e => setFormData({...formData, campaignName: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Platform</label>
              <div className="grid grid-cols-3 gap-4">
                {Object.values(PLATFORMS).map(p => (
                  <button
                    key={p.id}
                    onClick={() => setFormData({...formData, platform: p.id})}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${formData.platform === p.id ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className="font-semibold text-slate-900">{p.label}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="text" 
                className="w-full p-2 border border-slate-300 rounded-md"
                placeholder="Industry (e.g. Retail)"
                value={formData.industry}
                onChange={e => setFormData({...formData, industry: e.target.value})}
              />
              <select 
                className="w-full p-2 border border-slate-300 rounded-md bg-white"
                value={formData.objective}
                onChange={e => setFormData({...formData, objective: e.target.value})}
              >
                <option value="">Objective...</option>
                <option value="Brand Awareness">Brand Awareness</option>
                <option value="Sales">Sales</option>
                <option value="Traffic">Traffic</option>
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Key Messaging / Visual Description</label>
              <textarea 
                className="w-full p-3 border border-slate-300 rounded-md h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Describe what the ad should say and LOOK like..."
                value={formData.keyMessages}
                onChange={e => setFormData({...formData, keyMessages: e.target.value})}
              />
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Tone</label>
               <select 
                 className="w-full p-2 border border-slate-300 rounded-md bg-white"
                 value={formData.tone}
                 onChange={e => setFormData({...formData, tone: e.target.value})}
               >
                 {TONES.map(t => <option key={t} value={t}>{t}</option>)}
               </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Inspiration Images (Optional)</label>
              <div 
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Click to select files</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
              {formData.uploadedImages.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {formData.uploadedImages.map((name, idx) => (
                    <div key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded flex items-center gap-1 border border-indigo-100">
                      <ImageIcon className="w-3 h-3" /> {name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between rounded-b-xl">
        <button onClick={() => step === 1 ? onCancel() : setStep(step - 1)} className="px-4 py-2 text-slate-600 font-medium">
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <button 
          onClick={() => step === 2 ? handleSubmit() : setStep(step + 1)}
          disabled={!formData.platform && step === 1}
          className={`px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50`}
        >
          {step === 2 ? <><Search className="w-4 h-4" /> Generate Ads</> : <><ChevronRight className="w-4 h-4" /> Next</>}
        </button>
      </div>
    </div>
  );
};

export default function AdAcceleratorApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard');
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setView('login');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'users', user.uid, 'campaigns'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => setCampaigns(snap.docs.map(d => ({id:d.id, ...d.data()}))));
    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => signInAnonymously(auth);

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600 cursor-pointer" onClick={() => setView('dashboard')}>
            <Layout className="w-6 h-6" />
            <span className="font-bold text-xl">AdAccelerator</span>
          </div>
          <button onClick={() => signOut(auth)}><LogOut className="w-5 h-5 text-slate-400 hover:text-red-500" /></button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'dashboard' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <button onClick={() => setView('create')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex gap-2 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> New Campaign
              </button>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {campaigns.map(camp => (
                <div key={camp.id} onClick={() => {setSelectedCampaign(camp); setView('results')}} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer">
                  <h3 className="font-bold mb-1">{camp.campaignName}</h3>
                  <p className="text-sm text-slate-500 mb-4">{camp.platform} • {camp.tone}</p>
                  <div className="text-xs text-slate-400">Created: {camp.createdAt?.seconds ? new Date(camp.createdAt.seconds * 1000).toLocaleDateString() : 'Now'}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {view === 'create' && <CampaignWizard userId={user.uid} onCancel={() => setView('dashboard')} onComplete={() => setView('dashboard')} />}
        {view === 'results' && <ResultsView campaign={selectedCampaign} onBack={() => setView('dashboard')} />}
      </main>
    </div>
  );
}