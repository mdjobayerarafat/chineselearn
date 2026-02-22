"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Vocabulary } from "@/lib/types";
import { ArrowLeft, Image as ImageIcon, Loader2, ChevronLeft, ChevronRight, LayoutGrid, SquareStack, ArrowRightLeft } from "lucide-react";
import { motion } from "framer-motion";

interface ChapterDetailProps {
  id: string;
}

export default function ChapterDetail({ id }: ChapterDetailProps) {
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'study' | 'list'>('study');
  const [studyDirection, setStudyDirection] = useState<'zh-en' | 'en-zh'>('zh-en');
  
  // Study Mode State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const fetchVocabularies = useCallback(async () => {
    try {
      const response = await api.get(`/chapters/${id}/vocabularies`);
      setVocabularies(response.data);
    } catch (error) {
      console.error("Failed to fetch vocabularies", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVocabularies();
  }, [fetchVocabularies]);

  const handleNext = useCallback(() => {
    if (vocabularies.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev + 1) % vocabularies.length);
    }, 150);
  }, [vocabularies.length]);
  
  const handlePrev = useCallback(() => {
    if (vocabularies.length === 0) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex(prev => (prev - 1 + vocabularies.length) % vocabularies.length);
    }, 150);
  }, [vocabularies.length]);
  
  // Keyboard navigation
  useEffect(() => {
    if (viewMode !== 'study') return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        setIsFlipped(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, handleNext, handlePrev]);

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-zinc-900 dark:to-zinc-800 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4 transition-colors group">
              <div className="bg-white dark:bg-zinc-800 p-2 rounded-full shadow-sm mr-2 group-hover:-translate-x-1 transition-transform">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-medium">Back to Chapters</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Chapter Vocabularies
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {viewMode === 'study' && (
              <div className="flex items-center bg-white dark:bg-zinc-800 p-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
                <button
                  onClick={() => setStudyDirection('zh-en')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    studyDirection === 'zh-en' 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  🇨🇳 → 🇬🇧
                </button>
                <button
                  onClick={() => setStudyDirection('en-zh')}
                  className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                    studyDirection === 'en-zh' 
                      ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-700'
                  }`}
                >
                  🇬🇧 → 🇨🇳
                </button>
              </div>
            )}

            <div className="flex items-center bg-white dark:bg-zinc-800 p-1.5 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
            <button
              onClick={() => setViewMode('study')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                viewMode === 'study' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-700'
              }`}
            >
              <SquareStack className="w-4 h-4 mr-2" />
              Study Mode
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-zinc-700'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mr-2" />
              List View
            </button>
          </div>
        </div>
      </div>

      {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
          </div>
        ) : vocabularies.length === 0 ? (
          <div className="text-center py-20 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 dark:border-zinc-700">
            <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">No vocabularies in this chapter yet.</p>
          </div>
        ) : viewMode === 'study' ? (
          /* Study Mode */
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 flex flex-col gap-2">
              <div className="flex justify-between text-sm font-medium text-gray-500 dark:text-gray-400 px-1">
                <span>Progress</span>
                <span>{currentIndex + 1} / {vocabularies.length}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-blue-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentIndex + 1) / vocabularies.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            
            <div 
              className="relative h-[480px] w-full cursor-pointer group perspective-1000"
              style={{ perspective: "1000px" }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <motion.div 
                className="relative w-full h-full"
                style={{ 
                  transformStyle: "preserve-3d",
                  WebkitTransformStyle: "preserve-3d" 
                }}
                initial={false}
                animate={{ 
                  rotateY: isFlipped ? 180 : 0,
                  x: 0,
                  opacity: 1
                }}
                transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              >
                {/* Front of Card */}
                <div 
                  className="absolute w-full h-full bg-gradient-to-br from-white to-gray-50 dark:from-zinc-800 dark:to-zinc-900 rounded-[2rem] flex flex-col items-center p-8 sm:p-12 shadow-2xl border border-white/50 dark:border-zinc-700/50 overflow-hidden"
                  style={{ 
                    backfaceVisibility: "hidden", 
                    WebkitBackfaceVisibility: "hidden",
                    zIndex: isFlipped ? 0 : 1
                  }}
                >
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 dark:bg-blue-500/5 rounded-bl-[100px] -mr-10 -mt-10 pointer-events-none blur-xl" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-tr-[80px] -ml-10 -mb-10 pointer-events-none blur-xl" />
                  
                  {studyDirection === 'zh-en' ? (
                    <div className="flex-grow flex flex-col items-center justify-center w-full z-10 overflow-y-auto custom-scrollbar relative">
                      {vocabularies[currentIndex].image_url && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full max-h-48 mb-8 relative flex-shrink-0 flex justify-center"
                        >
                          <img 
                            src={vocabularies[currentIndex].image_url} 
                            alt={vocabularies[currentIndex].chinese}
                            className="h-full object-contain max-h-44 rounded-2xl drop-shadow-xl"
                          />
                        </motion.div>
                      )}
                      <div className="text-center">
                        <motion.div 
                          key={`char-${currentIndex}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-4 select-none"
                        >
                          {vocabularies[currentIndex].chinese}
                        </motion.div>
                        <motion.div 
                          key={`pinyin-${currentIndex}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-2xl sm:text-3xl font-medium text-blue-500 dark:text-blue-400 tracking-wide"
                        >
                          {vocabularies[currentIndex].pinyin}
                        </motion.div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center text-center w-full overflow-y-auto z-10">
                      <div className="space-y-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-semibold tracking-wide uppercase mb-2">
                          Meaning
                        </span>
                        <div className="text-3xl sm:text-5xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                          {vocabularies[currentIndex].meaning || "No meaning available"}
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-8 flex-shrink-0 uppercase tracking-widest font-semibold animate-pulse">Click to reveal meaning</p>
                </div>
                
                {/* Back of Card */}
                <div 
                  className="absolute w-full h-full bg-gradient-to-br from-white to-indigo-50 dark:from-zinc-800 dark:to-zinc-900 rounded-[2rem] flex flex-col items-center p-8 sm:p-12 shadow-2xl border border-white/50 dark:border-zinc-700/50 overflow-hidden"
                  style={{ 
                    transform: "rotateY(180deg)", 
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    zIndex: isFlipped ? 1 : 0
                  }}
                >
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600" />
                  <div className="absolute bottom-0 right-0 w-40 h-40 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-tl-[100px] -mr-10 -mb-10 pointer-events-none blur-xl" />
                  
                  {studyDirection === 'zh-en' ? (
                    <div className="flex-grow flex items-center justify-center text-center w-full overflow-y-auto z-10">
                      <div className="space-y-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 text-sm font-semibold tracking-wide uppercase mb-2">
                          Meaning
                        </span>
                        <div className="text-3xl sm:text-5xl font-bold text-gray-800 dark:text-gray-100 leading-tight">
                          {vocabularies[currentIndex].meaning || "No meaning available"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center w-full z-10 overflow-y-auto custom-scrollbar relative">
                      {vocabularies[currentIndex].image_url && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="w-full max-h-48 mb-8 relative flex-shrink-0 flex justify-center"
                        >
                          <img 
                            src={vocabularies[currentIndex].image_url} 
                            alt={vocabularies[currentIndex].chinese}
                            className="h-full object-contain max-h-44 rounded-2xl drop-shadow-xl"
                          />
                        </motion.div>
                      )}
                      <div className="text-center">
                        <motion.div 
                          key={`char-${currentIndex}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-6xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 mb-4 select-none"
                        >
                          {vocabularies[currentIndex].chinese}
                        </motion.div>
                        <motion.div 
                          key={`pinyin-${currentIndex}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-2xl sm:text-3xl font-medium text-blue-500 dark:text-blue-400 tracking-wide"
                        >
                          {vocabularies[currentIndex].pinyin}
                        </motion.div>
                      </div>
                    </div>
                  )}
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-8 flex-shrink-0 uppercase tracking-widest font-semibold animate-pulse">Click to flip back</p>
                </div>
              </motion.div>
            </div>
            
            <div className="flex justify-center gap-6 mt-10 px-4">
              <button
                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                className="group flex items-center justify-center w-14 h-14 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 rounded-full shadow-lg hover:shadow-xl border border-gray-100 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-all transform active:scale-95"
                title="Previous Card"
              >
                <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              
              <button
                onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
                className="flex items-center px-8 py-3 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-full shadow-lg hover:shadow-xl border border-gray-100 dark:border-zinc-700 font-semibold transition-all transform active:scale-95"
              >
                <span className="mr-2">Flip Card</span>
                <span className="text-xs bg-gray-100 dark:bg-zinc-700 px-2 py-0.5 rounded text-gray-500 dark:text-gray-400">SPACE</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                className="group flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all transform active:scale-95"
                title="Next Card"
              >
                <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          /* List Mode */
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 gap-4"
          >
            {vocabularies.map((vocab, index) => (
              <motion.div
                key={vocab.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-zinc-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-700 flex flex-col sm:flex-row gap-6 group hover:shadow-md transition-all"
              >
                <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-900 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center border border-gray-100 dark:border-zinc-800">
                  {vocab.image_url ? (
                    <img
                      src={vocab.image_url}
                      alt={vocab.chinese}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                  )}
                </div>
                
                <div className="flex-grow flex flex-col justify-center">
                  <div className="flex items-baseline gap-4 mb-2">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {vocab.chinese}
                    </h3>
                    <p className="text-xl text-blue-600 dark:text-blue-400 font-medium">
                      {vocab.pinyin}
                    </p>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-lg">
                    {vocab.meaning}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
