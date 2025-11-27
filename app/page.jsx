'use client';

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  Image as ImageIcon, 
  Type, 
  Download, 
  ChevronRight, 
  ChevronLeft, 
  UploadCloud, 
  Check, 
  Loader2, 
  Save, 
  LogOut,
  Search,
  Layout
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
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';

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

// --- CONSTANTS & DATA MODELS ---

const PLATFORMS = {
  meta: {
    id: 'meta',
    label: 'Meta (Facebook/Instagram)',
    color: 'bg-blue-600',
    sizes: [
      { id: '1080x1920', label: 'Story/Reel (1080x1920)' },
      { id: '1080x1080', label: 'Square (1080x1080)' },
      { id: '1440x1800', label: 'Portrait (1440x1800)' },
      { id: '398x208', label: 'Link Preview (398x208)' },
      { id: '500x320', label: 'Marketplace (500x320)' }
    ],
    copyFields: ['Headline', 'Primary Text', 'Description']
  },
  linkedin: {
    id: 'linkedin',
    label: 'LinkedIn',
    color: 'bg-blue-800',
    sizes: [
      { id: '1200x628', label: 'Landscape (1200x628)' },
      { id: '1200x1200', label: 'Square (1200x1200)' },
      { id: '720x900', label: 'Portrait (720x900)' }
    ],
    copyFields: ['Headline', 'Primary Text', 'Description']
  },
  pinterest: {
    id: 'pinterest',
    label: 'Pinterest',
    color: 'bg-red-600',
    sizes: [
      { id: '1000x1500', label: 'Standard Pin (1000x1500)', default: true },
      { id: '1000x1000', label: 'Square Pin (1000x1000)' },
      { id: '1000x2100', label: 'Giraffe Pin (1000x2100)' },
      { id: '1080x1920', label: 'Idea Pin (1080x1920)' }
    ],
    copyFields: ['SEO Title', 'SEO Description']
  }
};

const TONES = [
  'Educational', 
  'Funny', 
  'Best Friend', 
  'Persuasive', 
  'Informational', 
  'Sarcastic'
];

// --- MOCK AI GENERATOR (Simulates Backend) ---
const generateCampaignAssets = async (details) => {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 2500));

  const platformConfig = PLATFORMS[details.platform];
  const generated = {
    copy: [],
    images: []
  };

  // Generate Copy Variations
  for (let i = 0; i < parseInt(details.variations); i++) {
    const variant = {};
    platformConfig.copyFields.forEach(field => {
      if (field.includes('SEO')) {
         variant[field] = `[SEO Optimized] ${details.industry} ${details.objective} #${i+1}`;
      } else {
         variant[field] = `${details.tone} style ${field} for ${details.industry} #${i+1}`;
      }
    });
    generated.copy.push(variant);
  }

  // Generate Image Variations (Mocking URLs with placeholders)
  details.selectedSizes.forEach(size => {
    const [w, h] = size.split('x');
    for (let i = 0; i < parseInt(details.variations); i++) {
      generated.images.push({
        size: size,
        url: `https://placehold.co/${w}x${h}/${details.platform === 'pinterest' ? 'E60023' : '2563EB'}/FFFFFF?text=${details.platform}+Ad+${i+1}`,
        prompt: `A ${details.tone} photo for ${details.industry}, showing ${details.keyMessages}`
      });
    }
  });

  return generated;
};


// --- COMPONENTS ---

const LoginScreen = ({ onLogin }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
      <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6">
        <Layout className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Ad Accelerator</h1>
      <p className="text-slate-500 mb-8">Create optimized multi-channel campaigns in seconds.</p>
      <button 
        onClick={onLogin}
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
      >
        Sign In to Dashboard
      </button>
    </div>
  </div>
);

const ResultsView = ({ campaign, onBack }) => {
  if (!campaign) return null;

  const platform = PLATFORMS[campaign.platform];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
           <button onClick={onBack} className="text-slate-500 hover:text-indigo-600 flex items-center gap-1 text-sm mb-2">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-slate-900">{campaign.campaignName}</h2>
          <span className={`inline-block px-2 py-1 rounded text-xs font-medium text-white mt-1 ${platform.color}`}>
            {platform.label}
          </span>
        </div>
        <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-800">
          <Download className="w-4 h-4" /> Download All Assets
        </button>
      </div>

      {/* Copy Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Type className="w-5 h-5 text-indigo-600" />
          Generated Copy Options
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          {campaign.assets?.copy.map((variant, idx) => (
            <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-100 relative group">
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-slate-200 rounded" title="Copy to clipboard">
                   <Save className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Option {idx + 1}</span>
              <div className="space-y-3">
                {Object.entries(variant).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-xs font-semibold text-slate-500">{key}:</span>
                    <p className="text-slate-800 text-sm leading-relaxed">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Images Section */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-indigo-600" />
          Generated Creatives
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {campaign.assets?.images.map((img, idx) => (
            <div key={idx} className="group relative bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
              <img src={img.url} alt={`Asset ${idx}`} className="w-full h-auto object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button className="bg-white p-2 rounded-full hover:scale-110 transition-transform">
                  <Download className="w-4 h-4 text-slate-900" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-white/90 p-2 text-xs font-medium text-center border-t border-slate-200">
                {img.size}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const CampaignWizard = ({ onCancel, onComplete, userId }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    campaignName: '',
    platform: '',
    isPaid: true,
    industry: '',
    objective: '',
    keyMessages: '',
    tone: 'Persuasive',
    uploadedImages: [],
    variations: '2',
    selectedSizes: []
  });

  // Auto-select default sizes for Pinterest
  useEffect(() => {
    if (formData.platform === 'pinterest') {
      setFormData(prev => ({ ...prev, selectedSizes: ['1000x1500'] }));
    } else {
      setFormData(prev => ({ ...prev, selectedSizes: [] }));
    }
  }, [formData.platform]);

  const handleSizeToggle = (sizeId) => {
    setFormData(prev => {
      const sizes = prev.selectedSizes.includes(sizeId)
        ? prev.selectedSizes.filter(s => s !== sizeId)
        : [...prev.selectedSizes, sizeId];
      return { ...prev, selectedSizes: sizes };
    });
  };

  const handleMockUpload = () => {
    // Simulates uploading a file
    setFormData(prev => ({
      ...prev,
      uploadedImages: [...prev.uploadedImages, { name: 'inspiration_v1.jpg', url: '#' }]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 1. Generate Assets (Mock Backend Call)
      const assets = await generateCampaignAssets(formData);

      // 2. Save to Firestore
      const campaignData = {
        userId,
        ...formData,
        assets,
        createdAt: serverTimestamp()
      };
      
      // Save to Firebase
      await addDoc(collection(db, 'users', userId, 'campaigns'), campaignData);

      onComplete();
    } catch (error) {
      console.error("Error creating campaign:", error);
      // For demo purposes, we complete even if firebase fails (e.g. permission error)
      // Remove this in production!
      onComplete(); 
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-slate-900">Generating Assets...</h3>
          <p className="text-slate-500">Analyzing tone, optimizing copy, and rendering images.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-semibold text-lg">New Campaign</h2>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className={step >= 1 ? 'text-indigo-600 font-bold' : ''}>1. Strategy</span>
          <ChevronRight className="w-4 h-4" />
          <span className={step >= 2 ? 'text-indigo-600 font-bold' : ''}>2. Creative</span>
          <ChevronRight className="w-4 h-4" />
          <span className={step >= 3 ? 'text-indigo-600 font-bold' : ''}>3. Specs</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-6">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Campaign Name</label>
              <input 
                type="text" 
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. Summer Sale 2025"
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
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Industry</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-md"
                  placeholder="e.g. Retail, SaaS, Beauty"
                  value={formData.industry}
                  onChange={e => setFormData({...formData, industry: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Objective</label>
                 <select 
                  className="w-full p-2 border border-slate-300 rounded-md bg-white"
                  value={formData.objective}
                  onChange={e => setFormData({...formData, objective: e.target.value})}
                >
                  <option value="">Select...</option>
                  <option value="Brand Awareness">Brand Awareness</option>
                  <option value="Traffic">Traffic</option>
                  <option value="Conversions">Conversions/Sales</option>
                  <option value="Lead Gen">Lead Gen</option>
                </select>
              </div>
            </div>

             <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="paid" 
                    checked={formData.isPaid} 
                    onChange={() => setFormData({...formData, isPaid: true})}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">Paid Ads</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="paid" 
                    checked={!formData.isPaid} 
                    onChange={() => setFormData({...formData, isPaid: false})}
                    className="text-indigo-600"
                  />
                  <span className="text-sm text-slate-700">Organic Social</span>
                </label>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Key Messaging / Prompt</label>
              <textarea 
                className="w-full p-3 border border-slate-300 rounded-md h-32 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Describe the product, the offer, and what you want the user to feel..."
                value={formData.keyMessages}
                onChange={e => setFormData({...formData, keyMessages: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tone of Voice</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                    value={formData.tone}
                    onChange={e => setFormData({...formData, tone: e.target.value})}
                  >
                    {TONES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </div>
               <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Variations needed</label>
                   <select 
                    className="w-full p-2 border border-slate-300 rounded-md bg-white"
                    value={formData.variations}
                    onChange={e => setFormData({...formData, variations: e.target.value})}
                  >
                    <option value="1">1 Option</option>
                    <option value="2">2 Options</option>
                    <option value="3">3 Options</option>
                    <option value="5">5 Options</option>
                  </select>
               </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Inspiration Uploads (Optional)</label>
              <div 
                onClick={handleMockUpload}
                className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-sm text-slate-500">Click to upload reference images</p>
              </div>
              {formData.uploadedImages.length > 0 && (
                <div className="mt-2 flex gap-2">
                  {formData.uploadedImages.map((img, idx) => (
                    <div key={idx} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> {img.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
           <div className="space-y-6 animate-fade-in">
             <div>
               <h3 className="font-medium text-slate-900 mb-2">Select Output Sizes</h3>
               <p className="text-sm text-slate-500 mb-4">Based on your selection of <strong>{PLATFORMS[formData.platform]?.label}</strong>.</p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {PLATFORMS[formData.platform]?.sizes.map(size => (
                   <label 
                    key={size.id} 
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${formData.selectedSizes.includes(size.id) ? 'bg-indigo-50 border-indigo-500' : 'hover:bg-slate-50 border-slate-200'}`}
                   >
                     <input 
                       type="checkbox"
                       className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                       checked={formData.selectedSizes.includes(size.id)}
                       onChange={() => handleSizeToggle(size.id)}
                     />
                     <span className="ml-2 text-sm font-medium text-slate-700">{size.label}</span>
                   </label>
                 ))}
               </div>
             </div>

             <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg">
                <h4 className="text-sm font-bold text-yellow-800 mb-1">AI Usage Note</h4>
                <p className="text-xs text-yellow-700">
                  This will generate {formData.variations} unique copy variations and {formData.variations * formData.selectedSizes.length} image assets. 
                </p>
             </div>
           </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-between rounded-b-xl">
        <button 
          onClick={() => step === 1 ? onCancel() : setStep(step - 1)}
          className="px-4 py-2 text-slate-600 font-medium hover:text-slate-900"
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </button>
        <button 
          onClick={() => step === 3 ? handleSubmit() : setStep(step + 1)}
          disabled={!formData.platform && step === 1}
          className={`px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {step === 3 ? (
            <>
              <Search className="w-4 h-4" /> Generate
            </>
          ) : (
            <>
              Next <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};


export default function AdAcceleratorApp() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('dashboard'); // dashboard, create, results
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setView('login');
    });
    return () => unsubscribe();
  }, []);

  // Campaigns Listener
  useEffect(() => {
    if (!user) return;
    
    // NOTE: In a real app, you need to create a composite index in Firestore for this query to work
    // or remove the orderBy clause until you do.
    const q = query(
      collection(db, 'users', user.uid, 'campaigns'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const camps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(camps);
    }, (error) => {
      console.error("Error fetching campaigns:", error);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogin = async () => {
    // Basic anonymous login for demo purposes
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error("Login failed. Did you paste your firebase keys?", e);
      alert("Login failed. Check console. Likely missing Firebase keys.");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-600">
            <Layout className="w-6 h-6" />
            <span className="font-bold text-xl tracking-tight">AdAccelerator</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500 hidden sm:block">
              {user.uid.slice(0,6)}...
            </div>
            <button onClick={handleLogout} className="text-slate-500 hover:text-red-600 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                  <p className="text-slate-500">Manage your social campaigns and creatives.</p>
                </div>
                <button 
                  onClick={() => setView('create')}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" /> New Campaign
                </button>
             </div>

             {campaigns.length === 0 ? (
               <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                 <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Plus className="w-8 h-8" />
                 </div>
                 <h3 className="text-lg font-medium text-slate-900">No campaigns yet</h3>
                 <p className="text-slate-500 mb-6">Start your first AI-powered ad campaign today.</p>
                 <button 
                   onClick={() => setView('create')}
                   className="text-indigo-600 font-medium hover:text-indigo-800"
                 >
                   Create Campaign &rarr;
                 </button>
               </div>
             ) : (
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {campaigns.map(camp => (
                   <div 
                    key={camp.id} 
                    onClick={() => { setSelectedCampaign(camp); setView('results'); }}
                    className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                   >
                     <div className="flex justify-between items-start mb-4">
                       <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${PLATFORMS[camp.platform]?.color}`}>
                          {camp.platform === 'pinterest' ? 'P' : camp.platform === 'linkedin' ? 'in' : 'f'}
                       </div>
                       <span className="text-xs text-slate-400 font-mono">
                         {camp.createdAt?.seconds ? new Date(camp.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                       </span>
                     </div>
                     <h3 className="font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{camp.campaignName}</h3>
                     <p className="text-sm text-slate-500 line-clamp-2 mb-4">{camp.keyMessages}</p>
                     <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                       <span>{camp.assets?.images?.length || 0} Assets</span>
                       <span>{camp.objective}</span>
                     </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        )}

        {/* Create View */}
        {view === 'create' && (
          <CampaignWizard 
            userId={user.uid}
            onCancel={() => setView('dashboard')}
            onComplete={() => setView('dashboard')}
          />
        )}

        {/* Results View */}
        {view === 'results' && (
          <ResultsView 
            campaign={selectedCampaign} 
            onBack={() => { setSelectedCampaign(null); setView('dashboard'); }} 
          />
        )}
      </main>
    </div>
  );
}