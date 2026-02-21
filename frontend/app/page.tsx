"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Chapter } from "@/lib/types";
import { BookOpen, Loader2, ShieldCheck, ChevronRight, GraduationCap, Layout } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChapters();
  }, []);

  const fetchChapters = async () => {
    try {
      const response = await api.get("/chapters");
      setChapters(response.data);
    } catch (error) {
      console.error("Failed to fetch chapters", error);
    } finally {
      setLoading(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800 p-8 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl translate-y-1/2" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mb-20 text-center pt-12"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center p-4 bg-white/80 dark:bg-zinc-800/80 backdrop-blur-xl rounded-3xl shadow-2xl mb-8 border border-white/50 dark:border-zinc-700/50"
          >
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400 mb-6 tracking-tight drop-shadow-sm">
            Chinese Vocabulary
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
            Master the language chapter by chapter with interactive flashcards and smart repetition.
          </p>
        </motion.header>

        {/* Chapters List */}
        <div className="mb-20">
          <div className="flex flex-col sm:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3 mb-2">
                <Layout className="w-8 h-8 text-indigo-500" />
                Available Chapters
              </h2>
              <p className="text-gray-500 dark:text-gray-400">Select a chapter to start your learning session</p>
            </div>
            
            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-full border border-indigo-100 dark:border-indigo-800/50 shadow-sm">
              {chapters.length} {chapters.length === 1 ? 'Chapter' : 'Chapters'} Available
            </span>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
            </div>
          ) : chapters.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-32 bg-white/40 dark:bg-zinc-800/40 backdrop-blur-md rounded-[2.5rem] border border-dashed border-gray-300 dark:border-zinc-700"
            >
              <div className="bg-gray-100 dark:bg-zinc-800/80 w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-6">
                <GraduationCap className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-2xl text-gray-600 dark:text-gray-300 font-bold mb-2">No chapters yet</p>
              <p className="text-gray-500 dark:text-gray-400">New content is coming soon!</p>
            </motion.div>
          ) : (
            <motion.div 
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {chapters.map((chapter) => (
                <motion.div key={chapter.id} variants={item}>
                  <Link
                    href={`/chapters/${chapter.id}`}
                    className="block group h-full"
                  >
                    <div className="bg-white/70 dark:bg-zinc-800/70 backdrop-blur-xl p-8 rounded-[2rem] shadow-xl shadow-indigo-100/20 dark:shadow-none hover:shadow-2xl hover:shadow-indigo-200/40 dark:hover:shadow-indigo-900/20 transition-all duration-500 border border-white/60 dark:border-zinc-700/60 h-full flex flex-col transform hover:-translate-y-2 relative overflow-hidden group-hover:border-indigo-200 dark:group-hover:border-indigo-800">
                      
                      {/* Card Decoration */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-[100px] -mr-10 -mt-10 transition-transform duration-700 group-hover:scale-150" />
                      
                      <div className="relative z-10">
                        <div className="mb-6 flex justify-between items-start">
                          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-2xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                            <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          {/* Optional: Add a "New" badge or something if needed */}
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {chapter.name}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-400 mb-8 text-base leading-relaxed line-clamp-3">
                          {chapter.description || "Start your journey with these essential vocabulary words."}
                        </p>
                      </div>
                      
                      <div className="mt-auto relative z-10">
                        <div className="flex items-center justify-between p-1 pl-4 bg-gray-50 dark:bg-zinc-900/50 rounded-full border border-gray-100 dark:border-zinc-700 group-hover:border-indigo-100 dark:group-hover:border-indigo-800/50 transition-colors">
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            Start Learning
                          </span>
                          <div className="bg-white dark:bg-zinc-800 p-2 rounded-full shadow-sm text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0 transition-all">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Footer with Admin Link */}
        <motion.footer 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-20 text-center border-t border-gray-200/50 dark:border-zinc-700/50 pt-10 pb-8"
        >
          <p className="text-gray-400 dark:text-gray-500 mb-6">Designed for efficient learning</p>
          <Link 
            href="/admin" 
            className="inline-flex items-center px-5 py-2.5 text-gray-500 hover:text-indigo-600 dark:text-zinc-500 dark:hover:text-indigo-400 text-sm font-medium transition-all rounded-full hover:bg-white dark:hover:bg-zinc-800 hover:shadow-lg hover:-translate-y-0.5"
          >
            <ShieldCheck className="w-4 h-4 mr-2" />
            Admin Dashboard
          </Link>
        </motion.footer>
      </div>
    </div>
  );
}
