"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Dialogue, Sentence } from "@/lib/types";
import { Plus, Edit, Trash2, Save, X, ChevronDown, ChevronUp, MessageSquare, Play, Mic } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DialogueManagerProps {
  chapterId: string;
}

export default function DialogueManager({ chapterId }: DialogueManagerProps) {
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialogue Form State
  const [isDialogueModalOpen, setIsDialogueModalOpen] = useState(false);
  const [editingDialogue, setEditingDialogue] = useState<Dialogue | null>(null);
  const [dialogueTitle, setDialogueTitle] = useState("");
  const [dialogueDescription, setDialogueDescription] = useState("");

  // Sentence Form State
  const [activeDialogueId, setActiveDialogueId] = useState<number | null>(null);
  const [editingSentence, setEditingSentence] = useState<Sentence | null>(null);
  const [sentenceSpeaker, setSentenceSpeaker] = useState("A");
  const [sentenceChinese, setSentenceChinese] = useState("");
  const [sentencePinyin, setSentencePinyin] = useState("");
  const [sentenceEnglish, setSentenceEnglish] = useState("");
  const [sentenceOrder, setSentenceOrder] = useState(1);

  useEffect(() => {
    fetchDialogues();
  }, [chapterId]);

  const fetchDialogues = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/chapters/${chapterId}/dialogues`);
      setDialogues(response.data);
    } catch (error) {
      console.error("Failed to fetch dialogues", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDialogue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDialogue) {
        const response = await api.put(`/dialogues/${editingDialogue.id}`, {
          title: dialogueTitle,
          description: dialogueDescription
        });
        setDialogues(dialogues.map(d => d.id === editingDialogue.id ? { ...d, ...response.data } : d));
      } else {
        const response = await api.post(`/chapters/${chapterId}/dialogues`, {
          title: dialogueTitle,
          description: dialogueDescription
        });
        setDialogues([...dialogues, { ...response.data, sentences: [] }]);
      }
      closeDialogueModal();
    } catch (error) {
      console.error("Failed to save dialogue", error);
    }
  };

  const handleDeleteDialogue = async (id: number) => {
    if (!confirm("Delete this dialogue and all its sentences?")) return;
    try {
      await api.delete(`/dialogues/${id}`);
      setDialogues(dialogues.filter(d => d.id !== id));
    } catch (error) {
      console.error("Failed to delete dialogue", error);
    }
  };

  const openDialogueModal = (dialogue?: Dialogue) => {
    if (dialogue) {
      setEditingDialogue(dialogue);
      setDialogueTitle(dialogue.title);
      setDialogueDescription(dialogue.description);
    } else {
      setEditingDialogue(null);
      setDialogueTitle("");
      setDialogueDescription("");
    }
    setIsDialogueModalOpen(true);
  };

  const closeDialogueModal = () => {
    setIsDialogueModalOpen(false);
    setEditingDialogue(null);
    setDialogueTitle("");
    setDialogueDescription("");
  };

  const handleSaveSentence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDialogueId) return;

    try {
      if (editingSentence) {
        const response = await api.put(`/sentences/${editingSentence.id}`, {
          speaker: sentenceSpeaker,
          chinese: sentenceChinese,
          pinyin: sentencePinyin,
          english: sentenceEnglish,
          order: sentenceOrder,
          dialogue_id: activeDialogueId
        });
        
        setDialogues(dialogues.map(d => {
          if (d.id === activeDialogueId) {
            const updatedSentences = d.sentences?.map(s => s.id === editingSentence.id ? response.data : s) || [];
            return { ...d, sentences: updatedSentences.sort((a, b) => a.order - b.order) };
          }
          return d;
        }));
      } else {
        const response = await api.post(`/dialogues/${activeDialogueId}/sentences`, {
          speaker: sentenceSpeaker,
          chinese: sentenceChinese,
          pinyin: sentencePinyin,
          english: sentenceEnglish,
          order: sentenceOrder
        });

        setDialogues(dialogues.map(d => {
          if (d.id === activeDialogueId) {
            const updatedSentences = [...(d.sentences || []), response.data];
            return { ...d, sentences: updatedSentences.sort((a, b) => a.order - b.order) };
          }
          return d;
        }));
      }
      resetSentenceForm();
    } catch (error) {
      console.error("Failed to save sentence", error);
    }
  };

  const handleDeleteSentence = async (sentenceId: number, dialogueId: number) => {
    if (!confirm("Delete this sentence?")) return;
    try {
      await api.delete(`/sentences/${sentenceId}`);
      setDialogues(dialogues.map(d => {
        if (d.id === dialogueId) {
          return { ...d, sentences: d.sentences?.filter(s => s.id !== sentenceId) };
        }
        return d;
      }));
    } catch (error) {
      console.error("Failed to delete sentence", error);
    }
  };

  const resetSentenceForm = () => {
    setEditingSentence(null);
    setSentenceSpeaker("A");
    setSentenceChinese("");
    setSentencePinyin("");
    setSentenceEnglish("");
    // Auto-increment order based on last sentence
    const currentDialogue = dialogues.find(d => d.id === activeDialogueId);
    const lastOrder = currentDialogue?.sentences?.length ? Math.max(...currentDialogue.sentences.map(s => s.order)) : 0;
    setSentenceOrder(lastOrder + 1);
  };

  const prepareEditSentence = (sentence: Sentence) => {
    setEditingSentence(sentence);
    setSentenceSpeaker(sentence.speaker);
    setSentenceChinese(sentence.chinese);
    setSentencePinyin(sentence.pinyin);
    setSentenceEnglish(sentence.english);
    setSentenceOrder(sentence.order);
    
    // Scroll to form if needed
    const formElement = document.getElementById(`sentence-form-${activeDialogueId}`);
    if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Dialogues</h2>
        <button
          onClick={() => openDialogueModal()}
          className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Dialogue
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">Loading dialogues...</div>
      ) : dialogues.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-700">
          <MessageSquare className="w-10 h-10 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">No dialogues yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {dialogues.map((dialogue) => (
            <div key={dialogue.id} className="bg-white dark:bg-zinc-800 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-sm overflow-hidden">
              <div 
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-700/50 transition-colors"
                onClick={() => setActiveDialogueId(activeDialogueId === dialogue.id ? null : dialogue.id)}
              >
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{dialogue.title || "Untitled Dialogue"}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{dialogue.description}</p>
                  <p className="text-xs text-blue-500 mt-1 font-medium">{dialogue.sentences?.length || 0} sentences</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openDialogueModal(dialogue); }}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDialogue(dialogue.id); }}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2">
                    {activeDialogueId === dialogue.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {activeDialogueId === dialogue.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-900/30"
                  >
                    <div className="p-4 space-y-4">
                      {/* Sentences List */}
                      <div className="space-y-3">
                        {dialogue.sentences?.map((sentence) => (
                          <div key={sentence.id} className="flex gap-4 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-sm">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs">
                              {sentence.speaker}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{sentence.chinese}</p>
                                <div className="flex gap-1 ml-2">
                                  <button onClick={() => prepareEditSentence(sentence)} className="p-1 text-gray-400 hover:text-blue-500">
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => handleDeleteSentence(sentence.id, dialogue.id)} className="p-1 text-gray-400 hover:text-red-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                              <p className="text-sm text-blue-500 dark:text-blue-400">{sentence.pinyin}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{sentence.english}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add/Edit Sentence Form */}
                      <div id={`sentence-form-${dialogue.id}`} className="mt-4 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-blue-100 dark:border-blue-900/30 shadow-sm">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                          {editingSentence ? "Edit Sentence" : "Add New Sentence"}
                        </h4>
                        <form onSubmit={handleSaveSentence} className="space-y-3">
                          <div className="flex gap-3">
                            <div className="w-24">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Speaker</label>
                              <input
                                type="text"
                                value={sentenceSpeaker}
                                onChange={(e) => setSentenceSpeaker(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                placeholder="A"
                              />
                            </div>
                            <div className="w-24">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Order</label>
                              <input
                                type="number"
                                value={sentenceOrder}
                                onChange={(e) => setSentenceOrder(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Chinese</label>
                            <input
                              type="text"
                              value={sentenceChinese}
                              onChange={(e) => setSentenceChinese(e.target.value)}
                              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                              placeholder="你好"
                              required
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Pinyin</label>
                              <input
                                type="text"
                                value={sentencePinyin}
                                onChange={(e) => setSentencePinyin(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                placeholder="nǐ hǎo"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">English</label>
                              <input
                                type="text"
                                value={sentenceEnglish}
                                onChange={(e) => setSentenceEnglish(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm text-gray-900 dark:text-white"
                                placeholder="Hello"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <button
                              type="submit"
                              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                              {editingSentence ? "Update Sentence" : "Add Sentence"}
                            </button>
                            {editingSentence && (
                              <button
                                type="button"
                                onClick={resetSentenceForm}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </form>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      )}

      {/* Dialogue Modal */}
      {isDialogueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-zinc-700"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingDialogue ? "Edit Dialogue" : "New Dialogue"}
              </h3>
              <button onClick={closeDialogueModal} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDialogue} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  value={dialogueTitle}
                  onChange={(e) => setDialogueTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
                  placeholder="e.g. Ordering Coffee"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={dialogueDescription}
                  onChange={(e) => setDialogueDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none text-gray-900 dark:text-white"
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeDialogueModal}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
