import React, { useState } from 'react';
import { LiveSession } from './components/LiveSession';
import { PodcastGenerator } from './components/PodcastGenerator';
import { Tab } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LIVE);

  return (
    <div className="min-h-screen bg-safari-50 text-safari-900 font-sans selection:bg-safari-300">
      {/* Header */}
      <header className="bg-white border-b border-safari-200 sticky top-0 z-50 backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-safari-600 to-safari-800 rounded-lg flex items-center justify-center text-white shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a6 6 0 00-6 6v1.5a6 6 0 006 6v-1.5a6 6 0 00-6-6v1.5m6 7.5v3.75m-3.75 0h7.5" />
                </svg>
              </div>
              <div>
                 <h1 className="text-xl font-bold text-safari-900 tracking-tight">Yomba</h1>
                 <p className="text-xs text-safari-500 font-medium tracking-wide">Your own words.</p>
              </div>
            </div>
            
            {/* Disclaimer for Demo */}
            <div className="hidden md:block text-xs text-safari-400 border border-safari-200 px-3 py-1 rounded-full">
               Powered by Gemini 2.5 Live
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-10">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-safari-200 inline-flex">
            <button
              onClick={() => setActiveTab(Tab.LIVE)}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === Tab.LIVE
                  ? 'bg-safari-800 text-white shadow-md'
                  : 'text-safari-500 hover:text-safari-800 hover:bg-safari-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                 <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.382 1.59.581 2.417.581 2.052 0 3.916-1.05 5.09-2.732.495-2.083 2.028-4.756 2.028-4.756a2.008 2.008 0 00-.54-2.438l-.668-.667a.752.752 0 00-1.06.002L15.346 12.2a2.005 2.005 0 01-2.834.004l-1.603-1.602a2.005 2.005 0 01-.004-2.835L12.39 6.273a.751.751 0 00.002-1.06l-.667-.668a2.009 2.009 0 00-2.438-.54c0 0-2.673 1.533-4.756 2.028A6.732 6.732 0 001.75 11.167c0 .827.199 1.643.581 2.417C1.279 14.834.228 16.698.228 18.75c0 .414.336.75.75.75.207 0 .412-.084.557-.228a.753.753 0 00.165-.898A5.226 5.226 0 012.72 13.91a5.223 5.223 0 015.632-4.14c1.611-.383 3.692-1.575 3.692-1.575l-1.493 1.494a.502.502 0 00.001.71l1.602 1.601a.502.502 0 00.71.001l1.493-1.493s-1.191 2.08-1.574 3.692a5.223 5.223 0 01-4.141 5.632 5.235 5.235 0 01-4.464-1.026.751.751 0 00-.898.165.75.75 0 00.228.557c1.378.956 2.01 2.393 2.296 3.125z" clipRule="evenodd" />
              </svg>
              Live Conversation
            </button>
            <button
              onClick={() => setActiveTab(Tab.PODCAST)}
              className={`px-8 py-3 rounded-xl text-sm font-bold transition-all duration-200 flex items-center gap-2 ${
                activeTab === Tab.PODCAST
                  ? 'bg-safari-800 text-white shadow-md'
                  : 'text-safari-500 hover:text-safari-800 hover:bg-safari-50'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V9.017 5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" clipRule="evenodd" />
              </svg>
              Podcast Generator
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="transition-all duration-500 ease-in-out">
          {activeTab === Tab.LIVE ? (
            <div className="animate-fade-in-up">
              <LiveSession />
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <PodcastGenerator />
            </div>
          )}
        </div>
      </main>
      
      <footer className="mt-20 py-8 text-center text-safari-400 text-sm border-t border-safari-200 bg-white">
        <p>© 2025 Jackal Wild Adventures. Built with Google Gemini.</p>
      </footer>
    </div>
  );
}