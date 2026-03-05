import React, { useState, useEffect } from 'react';
import { Search, Info, Flame, Utensils, Activity, ArrowRight, Loader2, History } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getNutritionInfo, type NutritionInfo } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NutritionInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<NutritionInfo[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('calorie_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse history', e);
      }
    }
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const data = await getNutritionInfo(query);
      setResult(data);
      
      const newHistory = [data, ...history.filter(h => h.foodName !== data.foodName)].slice(0, 5);
      setHistory(newHistory);
      localStorage.setItem('calorie_history', JSON.stringify(newHistory));
    } catch (err) {
      setError('Could not find nutritional info. Please try a different food name.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="bg-emerald-500 p-2 rounded-xl shadow-lg shadow-emerald-200">
            <Flame className="text-white w-6 h-6" />
          </div>
          <h1 className="text-4xl font-bold font-display tracking-tight text-slate-900">CalorieWise</h1>
        </div>
        <p className="text-slate-500 max-w-md mx-auto">
          Instantly discover the nutritional profile of any food. Just type and learn.
        </p>
      </motion.header>

      {/* Search Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl mb-12"
      >
        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a food (e.g., 'Avocado', 'Big Mac')"
            className="w-full pl-14 pr-24 py-5 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all outline-none text-lg"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors w-6 h-6" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-300 text-white px-5 py-2.5 rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mt-3 text-center"
          >
            {error}
          </motion.p>
        )}
      </motion.div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {result && !loading ? (
          <motion.div
            key={result.foodName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            {/* Main Info Card */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold font-display text-slate-900 capitalize">{result.foodName}</h2>
                  <p className="text-slate-500 flex items-center gap-1.5 mt-1">
                    <Utensils className="w-4 h-4" />
                    Per {result.servingSize}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-emerald-600 font-display">{result.calories}</div>
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-400">Calories</div>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed mb-8 italic">
                "{result.description}"
              </p>

              <div className="grid grid-cols-3 gap-4">
                <MacroCard label="Protein" value={result.macros.protein} unit="g" color="bg-blue-50 text-blue-600" />
                <MacroCard label="Carbs" value={result.macros.carbs} unit="g" color="bg-orange-50 text-orange-600" />
                <MacroCard label="Fat" value={result.macros.fat} unit="g" color="bg-purple-50 text-purple-600" />
              </div>
            </div>

            {/* Quick Stats / Tips */}
            <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl flex flex-col justify-between">
              <div>
                <Activity className="w-8 h-8 text-emerald-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">Health Insight</h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  To burn {result.calories} calories, a person weighing 155 lbs would need to walk for approximately {Math.round(result.calories / 3.5)} minutes.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
                  <Info className="w-4 h-4" />
                  Pro Tip
                </div>
                <p className="text-xs text-slate-400">
                  Always check labels for accurate data as nutritional content varies by brand and preparation.
                </p>
              </div>
            </div>
          </motion.div>
        ) : loading ? (
          <div className="py-20 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Analyzing nutritional data...</p>
          </div>
        ) : null}
      </AnimatePresence>

      {/* History Section */}
      {history.length > 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-xl"
        >
          <div className="flex items-center gap-2 mb-4 text-slate-400 font-bold text-xs uppercase tracking-widest">
            <History className="w-4 h-4" />
            Recent Searches
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(item.foodName);
                  setResult(item);
                }}
                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-sm font-medium text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all shadow-sm"
              >
                {item.foodName}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <footer className="mt-auto pt-12 text-slate-400 text-xs text-center">
        <p>© {new Date().getFullYear()} CalorieWise AI • Powered by Gemini</p>
      </footer>
    </div>
  );
}

function MacroCard({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) {
  return (
    <div className={cn("rounded-2xl p-4 text-center flex flex-col items-center", color)}>
      <div className="text-xl font-bold font-display">{value}{unit}</div>
      <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</div>
    </div>
  );
}
