"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Chapter } from "@/lib/types";
import { Plus, BookOpen, Loader2, Edit, LogOut, Settings, LayoutDashboard } from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function AdminDashboard() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChapterName, setNewChapterName] = useState("");
  const [newChapterDesc, setNewChapterDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

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

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChapterName.trim()) return;

    setCreating(true);
    try {
      const response = await api.post("/chapters", {
        name: newChapterName,
        description: newChapterDesc,
      });
      // Fetch fresh list to ensure consistency
      await fetchChapters();
      setNewChapterName("");
      setNewChapterDesc("");
    } catch (error) {
      console.error("Failed to create chapter", error);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    Cookies.remove("admin_token");
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900 p-8">
      <div className="max-w-5xl mx-auto">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
            </div>
            <p className="text-gray-500 dark:text-gray-400 ml-1">
              Manage your vocabulary chapters and content
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors dark:bg-zinc-800 dark:border-zinc-700 dark:text-gray-300 dark:hover:text-white"
            >
              View Public Site
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400"
            >
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                Logout
              </div>
            </button>
          </div>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Chapter Form - Left Column */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="bg-white dark:bg-zinc-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded-md">
                  <Plus className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Chapter</h2>
              </div>
              
              <form onSubmit={handleCreateChapter} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chapter Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HSK 1 - Chapter 1"
                    value={newChapterName}
                    onChange={(e) => setNewChapterName(e.target.value)}
                    className="w-full p-3 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-gray-400"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <textarea
                    placeholder="Brief description of this chapter..."
                    value={newChapterDesc}
                    onChange={(e) => setNewChapterDesc(e.target.value)}
                    rows={3}
                    className="w-full p-3 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-gray-400 resize-none"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={creating || !newChapterName.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none transform active:scale-[0.98]"
                >
                  {creating ? <Loader2 className="animate-spin w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  Create Chapter
                </button>
              </form>
            </div>
          </motion.div>

          {/* Chapters List - Right Column */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-700 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-zinc-700 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-gray-500" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">All Chapters</h2>
                </div>
                <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold px-2.5 py-1 rounded-full">
                  {chapters.length} Total
                </span>
              </div>
              
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : chapters.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No chapters yet</h3>
                  <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    Create your first chapter using the form on the left to get started.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                  {chapters.map((chapter) => (
                    <motion.div
                      key={chapter.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 hover:bg-gray-50 dark:hover:bg-zinc-700/30 transition-colors group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {chapter.name}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-1">
                          {chapter.description || "No description provided"}
                        </p>
                        <div className="mt-2 text-xs text-gray-400">
                          ID: {chapter.id} • Created: {new Date(chapter.created_at || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <Link
                        href={`/admin/chapters/${chapter.id}`}
                        className="flex-shrink-0 inline-flex items-center px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:bg-zinc-800 dark:border-zinc-600 dark:text-gray-300 dark:hover:bg-blue-900/20 dark:hover:border-blue-800 dark:hover:text-blue-300 transition-all shadow-sm font-medium text-sm"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Manage Words
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
