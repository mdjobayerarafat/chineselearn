"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Vocabulary } from "@/lib/types";
import { ArrowLeft, Plus, Image as ImageIcon, Loader2, Edit, Save, X, Trash2, Upload, FileJson, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminChapterDetailProps {
  params: Promise<{ id: string }>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 100
    }
  }
};

export default function AdminChapterDetail({ params }: AdminChapterDetailProps) {
  const { id } = use(params);
  const router = useRouter();
  const [vocabularies, setVocabularies] = useState<Vocabulary[]>([]);
  const [chapter, setChapter] = useState<{ id: number; name: string; description: string } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Chapter Edit state
  const [isEditChapterModalOpen, setIsEditChapterModalOpen] = useState(false);
  const [editChapterName, setEditChapterName] = useState("");
  const [editChapterDescription, setEditChapterDescription] = useState("");

  // Form state
  const [chinese, setChinese] = useState("");
  const [pinyin, setPinyin] = useState("");
  const [meaning, setMeaning] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // JSON Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch vocabularies
        const vocabRes = await api.get(`/chapters/${id}/vocabularies`);
        setVocabularies(vocabRes.data);
        
        // Fetch chapter details
        const chaptersRes = await api.get('/chapters');
        const currentChapter = chaptersRes.data.find((c: any) => c.id === Number(id));
        if (currentChapter) {
          setChapter(currentChapter);
          setEditChapterName(currentChapter.name);
          setEditChapterDescription(currentChapter.description);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleUpdateChapter = async () => {
    if (!editChapterName) return;
    try {
      await api.put(`/chapters/${id}`, {
        name: editChapterName,
        description: editChapterDescription
      });
      setChapter(prev => prev ? { ...prev, name: editChapterName, description: editChapterDescription } : null);
      setIsEditChapterModalOpen(false);
      alert("Chapter updated successfully!");
    } catch (error) {
      console.error("Failed to update chapter", error);
      alert("Failed to update chapter");
    }
  };

  const handleDeleteChapter = async () => {
    if (!confirm("Are you sure you want to delete this chapter and all its words? This action cannot be undone.")) return;
    
    try {
      await api.delete(`/chapters/${id}`);
      router.push("/admin/dashboard");
    } catch (error) {
      console.error("Failed to delete chapter", error);
      alert("Failed to delete chapter");
    }
  };

  const handleEdit = (vocab: Vocabulary) => {
    setEditingId(vocab.id);
    setChinese(vocab.chinese);
    setPinyin(vocab.pinyin);
    setMeaning(vocab.meaning);
    setImageUrlInput(vocab.image_url);
    setImageFile(null); // Reset file input
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setChinese("");
    setPinyin("");
    setMeaning("");
    setImageFile(null);
    setImageUrlInput("");
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chinese) return;

    setSubmitting(true);
    const formData = new FormData();
    formData.append("chinese", chinese);
    formData.append("pinyin", pinyin);
    formData.append("meaning", meaning);
    formData.append("chapter_id", id);
    
    if (imageFile) {
      formData.append("image", imageFile);
    } else if (imageUrlInput) {
      formData.append("image_url", imageUrlInput);
    }

    try {
      if (editingId) {
        // Update existing vocabulary
        const response = await api.put(`/vocabularies/${editingId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        
        setVocabularies(vocabularies.map(v => v.id === editingId ? response.data : v));
        handleCancelEdit(); // Reset form
      } else {
        // Create new vocabulary
        const response = await api.post("/vocabularies", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        setVocabularies([...vocabularies, response.data]);
        
        // Reset form but keep image URL if desired? No, clear all for new entry
        setChinese("");
        setPinyin("");
        setMeaning("");
        setImageFile(null);
        setImageUrlInput("");
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      }
      
    } catch (error) {
      console.error("Failed to save vocabulary", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vocabId: number) => {
    if (!confirm("Are you sure you want to delete this word?")) return;
    
    try {
      await api.delete(`/vocabularies/${vocabId}`);
      setVocabularies(vocabularies.filter(v => v.id !== vocabId));
    } catch (error) {
      console.error("Failed to delete vocabulary", error);
    }
  };

  const handleJsonFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setJsonInput(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImportJson = async () => {
    if (!jsonInput.trim()) return;

    try {
      setImporting(true);
      const parsedData = JSON.parse(jsonInput);
      
      // Ensure it's an array
      const dataToImport = Array.isArray(parsedData) ? parsedData : [parsedData];
      
      if (dataToImport.length === 0) {
        alert("The JSON array is empty. Please provide at least one vocabulary item.");
        setImporting(false);
        return;
      }

      await api.post(`/chapters/${id}/vocabularies/batch`, dataToImport);
      
      // Refresh list
      const response = await api.get(`/chapters/${id}/vocabularies`);
      setVocabularies(response.data);
      
      // Reset and close
      setJsonInput("");
      setIsImportModalOpen(false);
      alert("Import successful!");
    } catch (error: any) {
      console.error("Failed to import JSON", error);
      const errorMessage = error.response?.data?.error || error.message || "Invalid JSON or server error";
      alert("Failed to import: " + errorMessage);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 p-6 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link 
            href="/admin" 
            className="inline-flex items-center text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b pb-6 border-gray-200 dark:border-zinc-700">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {chapter ? chapter.name : `Chapter ${id}`}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {chapter ? chapter.description : "Add and edit words for this chapter"}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsEditChapterModalOpen(true)}
                className="p-2.5 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm"
                title="Edit Chapter"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleDeleteChapter}
                className="p-2.5 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm"
                title="Delete Chapter"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center px-4 py-2.5 bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors shadow-sm font-medium"
              >
                <FileJson className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                Import JSON
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form Section */}
          <motion.div 
            className="lg:col-span-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="bg-white dark:bg-zinc-800/50 backdrop-blur-xl p-6 rounded-2xl shadow-xl border border-white/20 dark:border-zinc-700/50 sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  {editingId ? (
                    <>
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                        <Edit className="w-5 h-5" />
                      </div>
                      Edit Word
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                        <Plus className="w-5 h-5" />
                      </div>
                      Add New Word
                    </>
                  )}
                </h2>
                {editingId && (
                  <button
                    onClick={handleCancelEdit}
                    className="text-gray-500 hover:text-red-500 transition-colors"
                    title="Cancel Edit"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                      Chinese Character
                    </label>
                    <input
                      type="text"
                      value={chinese}
                      onChange={(e) => setChinese(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-gray-400"
                      placeholder="e.g. 你好"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                      Pinyin
                    </label>
                    <input
                      type="text"
                      value={pinyin}
                      onChange={(e) => setPinyin(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-gray-400"
                      placeholder="e.g. nǐ hǎo"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                      Meaning
                    </label>
                    <textarea
                      value={meaning}
                      onChange={(e) => setMeaning(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white placeholder:text-gray-400 min-h-[100px] resize-none"
                      placeholder="e.g. Hello"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 ml-1">
                      Image
                    </label>
                    <div className="p-4 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-colors bg-gray-50/50 dark:bg-zinc-900/30">
                      <input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-zinc-700 dark:file:text-gray-300 cursor-pointer"
                      />
                      <div className="text-center text-gray-400 text-xs my-3 font-medium">- OR USE URL -</div>
                      <input
                        type="text"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`
                    w-full py-3.5 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2
                    ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 active:translate-y-0'}
                  `}
                >
                  {submitting ? (
                    <Loader2 className="animate-spin w-5 h-5" />
                  ) : (
                    <>
                      {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                      {editingId ? "Update Word" : "Add to List"}
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* List Section */}
          <div className="lg:col-span-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span className="bg-gray-100 dark:bg-zinc-800 px-3 py-1 rounded-full text-sm font-medium">
                  {vocabularies.length} Words
                </span>
              </h2>
            </div>
            
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              </div>
            ) : vocabularies.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 bg-white/50 dark:bg-zinc-800/30 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-700"
              >
                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No words yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Start adding vocabulary words using the form on the left.
                </p>
              </motion.div>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 gap-4"
              >
                <AnimatePresence mode="popLayout">
                  {vocabularies.map((vocab) => (
                    <motion.div
                      key={vocab.id}
                      variants={itemVariants}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                      className={`
                        group relative bg-white dark:bg-zinc-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all border
                        ${editingId === vocab.id 
                          ? 'border-blue-500 ring-2 ring-blue-500/20 z-10' 
                          : 'border-gray-100 dark:border-zinc-700/50 hover:border-blue-200 dark:hover:border-blue-800'
                        }
                      `}
                    >
                      <div className="flex items-start gap-5">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-zinc-900 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100 dark:border-zinc-700/50">
                          {vocab.image_url ? (
                            <img
                              src={vocab.image_url}
                              alt={vocab.chinese}
                              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-zinc-600">
                              <ImageIcon className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-grow pt-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {vocab.chinese}
                              </h3>
                              <p className="text-lg text-blue-600 dark:text-blue-400 font-medium mb-2 font-mono">
                                {vocab.pinyin}
                              </p>
                              <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
                                {vocab.meaning}
                              </p>
                            </div>
                            
                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleEdit(vocab)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-blue-900/30 dark:hover:text-blue-300"
                                title="Edit"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(vocab.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/30 dark:hover:text-red-300"
                                title="Delete"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
      </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileJson className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Import Vocabulary from JSON
                </h3>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Paste your JSON array below or upload a .json file. The JSON should be an array of objects with the following structure:
                  <code className="block mt-2 p-3 bg-gray-50 dark:bg-zinc-900 rounded-lg text-xs font-mono text-gray-800 dark:text-gray-300 overflow-x-auto">
                    {`[
  {
    "chinese": "你好",
    "pinyin": "nǐ hǎo",
    "meaning": "Hello",
    "image_url": "https://example.com/image.jpg"
  }
]`}
                  </code>
                </p>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload JSON File
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center px-4 py-2 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-600 transition-colors shadow-sm">
                        <Upload className="w-4 h-4 mr-2 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-200">Choose File</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setJsonInput(event.target.result as string);
                                }
                              };
                              reader.readAsText(file);
                              // Reset input
                              e.target.value = '';
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {jsonInput ? "Content loaded" : "No file chosen"}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-zinc-700"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white dark:bg-zinc-800 text-gray-500">Or paste content directly</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      JSON Content
                    </label>
                    <textarea
                      value={jsonInput}
                      onChange={(e) => setJsonInput(e.target.value)}
                      className="w-full h-64 px-4 py-3 bg-gray-50 dark:bg-zinc-900/50 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white font-mono text-sm resize-none"
                      placeholder="Paste JSON array here..."
                    />
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Expected format: <code className="bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">[{`{"chinese": "word", "pinyin": "pinyin", "meaning": "meaning"}`}]</code>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 flex justify-end gap-3">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportJson}
                  disabled={importing || !jsonInput.trim()}
                  className={`
                    px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center gap-2
                    ${importing || !jsonInput.trim() ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 active:translate-y-0'}
                  `}
                >
                  {importing ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import Vocabulary
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        {isEditChapterModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-zinc-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Edit Chapter
                </h3>
                <button
                  onClick={() => setIsEditChapterModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Chapter Name
                  </label>
                  <input
                    type="text"
                    value={editChapterName}
                    onChange={(e) => setEditChapterName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white"
                    placeholder="Enter chapter name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editChapterDescription}
                    onChange={(e) => setEditChapterDescription(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white resize-none h-32"
                    placeholder="Enter chapter description"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 flex justify-end gap-3">
                <button
                  onClick={() => setIsEditChapterModalOpen(false)}
                  className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateChapter}
                  disabled={!editChapterName}
                  className={`
                    px-6 py-2.5 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all flex items-center gap-2
                    ${!editChapterName ? 'bg-blue-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform hover:-translate-y-0.5 active:translate-y-0'}
                  `}
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
