import React, { useState } from 'react';
import { Module, Language, Lesson, Question } from '../types';
import { moduleService } from '../services/moduleService';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

interface AdminPanelProps {
  modules: Module[];
  language: Language;
}

export default function AdminPanel({ modules, language }: AdminPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Module>>({
    category: 'basic',
    title: { en: '', ml: '' },
    lessons: [],
    quiz: []
  });

  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSave = async () => {
    if (!formData.title?.en || !formData.title?.ml) {
      setError('Please fill in both English and Malayalam titles');
      return;
    }

    try {
      if (editingId) {
        await moduleService.updateModule(editingId, formData);
      } else {
        await moduleService.addModule({
          ...formData as Omit<Module, 'id'>,
          order: modules.length
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ category: 'basic', title: { en: '', ml: '' }, lessons: [], quiz: [] });
      setError(null);
    } catch (err) {
      console.error('Error saving module:', err);
      setError('Error saving module. Check console for details.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await moduleService.deleteModule(id);
      setConfirmDelete(null);
    } catch (err) {
      console.error('Error deleting module:', err);
      setError('Error deleting module.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border-2 border-stone-800 p-8 rounded-[2rem] max-w-md w-full space-y-6">
            <h3 className="text-2xl font-black">Delete Module?</h3>
            <p className="text-stone-400">This action cannot be undone. All lessons and quizzes in this module will be lost.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-stone-800 rounded-xl font-black">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 bg-red-500 rounded-xl font-black">Delete</button>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tighter">
          {language === 'ml' ? 'അഡ്മിൻ പാനൽ' : 'Admin Panel'}
        </h2>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black rounded-2xl font-black hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" />
          <span>{language === 'ml' ? 'പുതിയ മൊഡ്യൂൾ' : 'New Module'}</span>
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-stone-800/50 border-2 border-emerald-500/30 rounded-3xl p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-stone-500 tracking-widest">Title (English)</label>
              <input
                type="text"
                value={formData.title?.en}
                onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-stone-500 tracking-widest">Title (Malayalam)</label>
              <input
                type="text"
                value={formData.title?.ml}
                onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ml: e.target.value } })}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-stone-500 tracking-widest">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
              >
                <option value="basic">Basic</option>
                <option value="internet">Internet</option>
                <option value="office">Office</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase text-stone-500 tracking-widest">Lessons</h4>
            {formData.lessons?.map((lesson, idx) => (
              <div key={idx} className="p-4 bg-stone-900 rounded-xl border border-stone-700 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Lesson Title (EN)"
                    value={lesson.title.en}
                    onChange={(e) => {
                      const newLessons = [...(formData.lessons || [])];
                      newLessons[idx] = { ...lesson, title: { ...lesson.title, en: e.target.value } };
                      setFormData({ ...formData, lessons: newLessons });
                    }}
                    className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Lesson Title (ML)"
                    value={lesson.title.ml}
                    onChange={(e) => {
                      const newLessons = [...(formData.lessons || [])];
                      newLessons[idx] = { ...lesson, title: { ...lesson.title, ml: e.target.value } };
                      setFormData({ ...formData, lessons: newLessons });
                    }}
                    className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <textarea
                  placeholder="Lesson Content (EN)"
                  value={lesson.content.en}
                  onChange={(e) => {
                    const newLessons = [...(formData.lessons || [])];
                    newLessons[idx] = { ...lesson, content: { ...lesson.content, en: e.target.value } };
                    setFormData({ ...formData, lessons: newLessons });
                  }}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm h-20"
                />
                <textarea
                  placeholder="Lesson Content (ML)"
                  value={lesson.content.ml}
                  onChange={(e) => {
                    const newLessons = [...(formData.lessons || [])];
                    newLessons[idx] = { ...lesson, content: { ...lesson.content, ml: e.target.value } };
                    setFormData({ ...formData, lessons: newLessons });
                  }}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm h-20"
                />
              </div>
            ))}
            <button
              onClick={() => setFormData({ ...formData, lessons: [...(formData.lessons || []), { id: Date.now().toString(), title: { en: '', ml: '' }, content: { en: '', ml: '' } }] })}
              className="w-full py-3 border-2 border-dashed border-stone-700 rounded-xl text-stone-500 hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Lesson
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-black uppercase text-stone-500 tracking-widest">Quiz Questions</h4>
            {formData.quiz?.map((q, idx) => (
              <div key={idx} className="p-4 bg-stone-900 rounded-xl border border-stone-700 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    placeholder="Question (EN)"
                    value={q.text.en}
                    onChange={(e) => {
                      const newQuiz = [...(formData.quiz || [])];
                      newQuiz[idx] = { ...q, text: { ...q.text, en: e.target.value } };
                      setFormData({ ...formData, quiz: newQuiz });
                    }}
                    className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    placeholder="Question (ML)"
                    value={q.text.ml}
                    onChange={(e) => {
                      const newQuiz = [...(formData.quiz || [])];
                      newQuiz[idx] = { ...q, text: { ...q.text, ml: e.target.value } };
                      setFormData({ ...formData, quiz: newQuiz });
                    }}
                    className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[0, 1, 2, 3].map(optIdx => (
                    <input
                      key={optIdx}
                      placeholder={`Option ${optIdx + 1} (EN)`}
                      value={q.options.en?.[optIdx] || ''}
                      onChange={(e) => {
                        const newQuiz = [...(formData.quiz || [])];
                        const newOptions = [...(q.options.en || [])];
                        newOptions[optIdx] = e.target.value;
                        newQuiz[idx] = { ...q, options: { ...q.options, en: newOptions } };
                        setFormData({ ...formData, quiz: newQuiz });
                      }}
                      className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black uppercase text-stone-500">Correct Index (0-3):</span>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={q.correctIndex}
                    onChange={(e) => {
                      const newQuiz = [...(formData.quiz || [])];
                      newQuiz[idx] = { ...q, correctIndex: parseInt(e.target.value) };
                      setFormData({ ...formData, quiz: newQuiz });
                    }}
                    className="w-16 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
            <button
              onClick={() => setFormData({ ...formData, quiz: [...(formData.quiz || []), { id: Date.now().toString(), text: { en: '', ml: '' }, options: { en: ['', '', '', ''], ml: ['', '', '', ''] }, correctIndex: 0 }] })}
              className="w-full py-3 border-2 border-dashed border-stone-700 rounded-xl text-stone-500 hover:border-emerald-500 hover:text-emerald-500 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="px-6 py-3 bg-stone-700 rounded-xl font-black hover:bg-stone-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 bg-emerald-500 text-black rounded-xl font-black hover:bg-emerald-400 transition-colors flex items-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Module
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {modules.map((m) => (
          <div key={m.id} className="bg-stone-800/30 border border-stone-700 rounded-2xl p-6 flex items-center justify-between group hover:border-emerald-500/30 transition-all">
            <div>
              <h3 className="text-xl font-black">{m.title[language] || m.title.en}</h3>
              <p className="text-stone-500 text-xs uppercase tracking-widest font-black mt-1">{m.category}</p>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => { setEditingId(m.id); setFormData(m); }}
                className="p-3 bg-stone-700 rounded-xl hover:bg-emerald-500 hover:text-black transition-all"
              >
                <Edit2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setConfirmDelete(m.id)}
                className="p-3 bg-stone-700 rounded-xl hover:bg-red-500 transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
