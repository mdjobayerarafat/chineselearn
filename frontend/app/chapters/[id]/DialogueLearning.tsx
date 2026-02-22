"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Dialogue, Sentence } from "@/lib/types";
import { ArrowLeft, Play, Volume2, ChevronRight, MessageSquare, BookOpen, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DialogueLearningProps {
  chapterId: string;
}

export default function DialogueLearning({ chapterId }: DialogueLearningProps) {
  const [dialogues, setDialogues] = useState<Dialogue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDialogue, setSelectedDialogue] = useState<Dialogue | null>(null);
  const [playingSentenceId, setPlayingSentenceId] = useState<number | null>(null);

  const fetchDialogues = useCallback(async () => {
    try {
      const response = await api.get(`/chapters/${chapterId}/dialogues`);
      setDialogues(response.data);
    } catch (error) {
      console.error("Failed to fetch dialogues", error);
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    fetchDialogues();
  }, [fetchDialogues]);

  // Mock audio play function for now
  const playAudio = (sentence: Sentence) => {
    if (sentence.audio_url) {
      const audio = new Audio(sentence.audio_url);
      audio.play();
      setPlayingSentenceId(sentence.id);
      audio.onended = () => setPlayingSentenceId(null);
    } else {
        // Fallback or just visual indication
        setPlayingSentenceId(sentence.id);
        setTimeout(() => setPlayingSentenceId(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedDialogue) {
    return (
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedDialogue(null)}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dialogues
        </button>

        <div className="bg-white dark:bg-zinc-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-zinc-700">
          <div className="p-8 border-b border-gray-100 dark:border-zinc-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-zinc-800 dark:to-zinc-800/50">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{selectedDialogue.title}</h2>
            {selectedDialogue.description && (
              <p className="text-gray-600 dark:text-gray-400">{selectedDialogue.description}</p>
            )}
          </div>

          <div className="p-8 space-y-6">
            {selectedDialogue.sentences && selectedDialogue.sentences.length > 0 ? (
              selectedDialogue.sentences.map((sentence, index) => (
                <motion.div
                  key={sentence.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative p-6 rounded-2xl transition-all duration-300 ${
                    playingSentenceId === sentence.id
                      ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800"
                      : "bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-700 hover:border-blue-200 dark:hover:border-blue-800"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {sentence.speaker || "A"}
                      </div>
                    </div>
                    
                    <div className="flex-grow space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xl font-medium text-gray-900 dark:text-white">{sentence.chinese}</p>
                        <button
                          onClick={() => playAudio(sentence)}
                          className={`p-2 rounded-full transition-colors ${
                            playingSentenceId === sentence.id
                              ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400"
                              : "hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 dark:text-gray-500"
                          }`}
                        >
                          <Volume2 className="w-5 h-5" />
                        </button>
                      </div>
                      <p className="text-base text-blue-600 dark:text-blue-400">{sentence.pinyin}</p>
                      <p className="text-base text-gray-500 dark:text-gray-400">{sentence.english}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No sentences in this dialogue yet.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      {dialogues.length > 0 ? (
        dialogues.map((dialogue) => (
          <motion.div
            key={dialogue.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => setSelectedDialogue(dialogue)}
            className="cursor-pointer bg-white dark:bg-zinc-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-zinc-700 hover:shadow-xl transition-all duration-300 group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="flex items-center text-gray-400 dark:text-gray-500 text-sm font-medium">
                {dialogue.sentences?.length || 0} sentences
                <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {dialogue.title}
            </h3>
            
            {dialogue.description && (
              <p className="text-gray-500 dark:text-gray-400 line-clamp-2 text-sm leading-relaxed">
                {dialogue.description}
              </p>
            )}
          </motion.div>
        ))
      ) : (
        <div className="col-span-full text-center py-20 bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm rounded-3xl border border-dashed border-gray-300 dark:border-zinc-700">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-xl text-gray-500 dark:text-gray-400 font-medium">No dialogues available yet.</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Check back later for new content!</p>
        </div>
      )}
    </div>
  );
}
