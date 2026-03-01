'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, AlertTriangle, BarChart3, Clock, Heart, Wind, RefreshCcw, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Chatbot from '@/components/chatbot';
import { generateMockVitals, analyzeVitals } from '@/lib/ai-engine';
import { VitalsData, PredictionResult, PatientProfile } from '@/types';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const MOCK_PROFILE: PatientProfile = {
  id: 'p1',
  name: 'John Doe',
  condition: 'COPD',
  baseline: {
    heartRate: 72,
    spo2: 96,
  },
};

export const dynamic = 'force-dynamic';

export default function Home() {
  const [data, setData] = useState<VitalsData[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [simulateFlareUp, setSimulateFlareUp] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setUserProfile(profile);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const refreshData = () => {
    setIsLoading(true);
    const mockData = generateMockVitals(24, simulateFlareUp);
    setData(mockData);
    
    // Use userProfile for baseline if available
    const profileForAnalysis: PatientProfile = {
      id: userProfile?.id || MOCK_PROFILE.id,
      name: userProfile?.full_name || MOCK_PROFILE.name,
      condition: userProfile?.condition || MOCK_PROFILE.condition,
      baseline: MOCK_PROFILE.baseline, // Baselines could also be stored in DB
    };

    const result = analyzeVitals(mockData, profileForAnalysis);
    setPrediction(result);
    setTimeout(() => setIsLoading(false), 800);
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    refreshData();
  }, [simulateFlareUp, userProfile]);

  const latest = data[data.length - 1];

  if (isLoading || !latest || !prediction) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-slate-500 font-medium">Analyzing Vitals...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Activity className="text-blue-600 w-8 h-8" />
              AI Care Predict
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Personalized Health Monitoring & Flare-up Prediction</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setSimulateFlareUp(!simulateFlareUp)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-sm border",
                simulateFlareUp 
                  ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 hover:bg-slate-50"
              )}
            >
              <AlertTriangle className="w-4 h-4" />
              {simulateFlareUp ? "Stop Simulation" : "Simulate Flare-up"}
            </button>
            <button 
              onClick={refreshData}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm"
            >
              <RefreshCcw className="w-4 h-4" />
              Sync Device
            </button>
            <Link 
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all"
            >
              <User className="w-4 h-4" />
              {userProfile?.full_name || MOCK_PROFILE.name}
            </Link>
          </div>
        </header>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card 
            title="Heart Rate" 
            value={`${Math.round(latest.heartRate)} bpm`} 
            icon={<Heart className="text-rose-500" />} 
            status={latest.heartRate > 90 ? 'warning' : 'stable'}
            color="rose"
          />
          <Card 
            title="Oxygen Saturation" 
            value={`${Math.round(latest.spo2)}%`} 
            icon={<Wind className="text-blue-500" />} 
            status={latest.spo2 < 92 ? 'warning' : 'stable'}
            color="blue"
          />
          <Card 
            title="Respiratory Rate" 
            value={`${Math.round(latest.respiratoryRate)} /min`} 
            icon={<Activity className="text-emerald-500" />} 
            status={latest.respiratoryRate > 20 ? 'warning' : 'stable'}
            color="emerald"
          />
          <Card 
            title="Flare-up Risk" 
            value={prediction.riskLevel} 
            icon={<AlertTriangle className={cn(
              prediction.riskLevel === 'Low' ? 'text-green-500' : 
              prediction.riskLevel === 'Moderate' ? 'text-amber-500' : 'text-red-500'
            )} />} 
            status={prediction.riskLevel.toLowerCase() as any}
            color={prediction.riskLevel === 'Low' ? 'green' : prediction.riskLevel === 'Moderate' ? 'amber' : 'red'}
          />
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Chart Section */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                SpO2 & Heart Rate Trends
              </h2>
              <div className="flex gap-2 text-xs font-medium">
                <span className="flex items-center gap-1 text-blue-500"><div className="w-2 h-2 bg-blue-500 rounded-full" /> SpO2</span>
                <span className="flex items-center gap-1 text-rose-500"><div className="w-2 h-2 bg-rose-500 rounded-full" /> HR</span>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(str) => new Date(str).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="spo2" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpo2)" strokeWidth={2} />
                  <Area type="monotone" dataKey="heartRate" stroke="#f43f5e" fillOpacity={0} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Predictions/Alerts Section */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                AI Analysis & Insights
              </h2>
              <div className="space-y-4">
                {prediction.insights.map((insight, idx) => (
                  <InsightItem 
                    key={idx}
                    type={prediction.riskLevel === 'Low' ? 'success' : prediction.riskLevel === 'Moderate' ? 'info' : 'warning'} 
                    title={insight} 
                    description={prediction.recommendations[idx] || 'Continue monitoring.'}
                  />
                ))}
              </div>
            </div>

            <div className={cn(
              "p-6 rounded-2xl shadow-lg text-white transition-colors",
              prediction.riskLevel === 'Low' ? "bg-gradient-to-br from-blue-600 to-indigo-700" :
              prediction.riskLevel === 'Moderate' ? "bg-gradient-to-br from-amber-500 to-orange-600" :
              "bg-gradient-to-br from-rose-600 to-red-700"
            )}>
              <h3 className="font-bold text-lg mb-1">Health Advisory</h3>
              <p className="text-white/80 text-sm mb-4">
                {prediction.riskLevel === 'Low' 
                  ? "Everything looks good! Your vitals are stable and within your normal baseline."
                  : "We've detected some variations in your vitals that might indicate a potential flare-up."}
              </p>
              <div className="bg-white/10 p-3 rounded-xl mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider mb-1">Risk Score</p>
                <div className="text-2xl font-bold">{prediction.riskScore}%</div>
              </div>
              <button className="w-full bg-white text-slate-900 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors shadow-sm">
                {prediction.riskLevel === 'Low' ? "View Details" : "Contact Care Team"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <Chatbot latestVitals={latest} prediction={prediction} />
    </main>
  );
}

function Card({ title, value, icon, status, color }: { title: string, value: string, icon: React.ReactNode, status: 'stable' | 'warning' | 'low' | 'high' | 'critical', color: string }) {
  const statusColors = {
    stable: 'text-green-500',
    warning: 'text-amber-500',
    low: 'text-green-500',
    high: 'text-red-500',
    critical: 'text-red-600 font-bold animate-pulse'
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={cn(
          "p-3 rounded-xl",
          `bg-${color}-50 dark:bg-${color}-900/20`
        )}>
          {icon}
        </div>
        <span className={cn("text-[10px] font-bold uppercase tracking-widest", statusColors[status])}>
          {status}
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
        <h3 className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value}</h3>
      </div>
    </div>
  );
}

function InsightItem({ type, title, description }: { type: 'info' | 'warning' | 'success', title: string, description: string }) {
  const colors = {
    info: 'bg-blue-500',
    warning: 'bg-rose-500',
    success: 'bg-emerald-500'
  };

  return (
    <div className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
      <div className={cn("w-1.5 h-auto rounded-full shrink-0", colors[type])}></div>
      <div>
        <h4 className="font-semibold text-sm text-slate-900 dark:text-white leading-tight">{title}</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  );
}
