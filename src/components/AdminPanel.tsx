import React, { useState, useEffect } from 'react';
import { Module, Language, Lesson, Question, QuizResult } from '../types';
import { moduleService } from '../services/moduleService';
import { generateModuleContent, generateQuizQuestions, generateFullModuleFromText, generateImage } from '../services/geminiService';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, Edit2, Users, BookOpen, Calendar, ChevronLeft, Sparkles, Loader2, FileText, Upload, Database, Info } from 'lucide-react';
import * as mammoth from 'mammoth';
import { MODULES } from '../constants';
import firebaseConfig from '../../firebase-applet-config.json';

interface AdminPanelProps {
  modules: Module[];
  language: Language;
  onBack: () => void;
}

export default function AdminPanel({ modules, language, onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'modules' | 'results'>('modules');
  const [results, setResults] = useState<QuizResult[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Module>>({
    category: 'Desktop',
    level: 'basic',
    title: { en: '', ml: '' },
    description: { en: '', ml: '' },
    lessons: [],
    quiz: [],
    imageUrl: ''
  });

  const categories = [
    'Desktop', 'Taskbar', 'Start Menu', 'Notepad', 'Calculator', 
    'MS Word Basic', 'MS Word Advanced', 'Excel', 'PowerPoint', 'Internet'
  ];

  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAutoGenerate = async (field: 'module' | 'lesson', index?: number) => {
    let sourceText = '';
    if (field === 'module') {
      sourceText = formData.title?.en || formData.title?.ml || '';
    } else if (field === 'lesson' && typeof index === 'number') {
      sourceText = formData.lessons?.[index]?.title?.en || formData.lessons?.[index]?.title?.ml || '';
    }

    if (!sourceText) {
      setError('Please enter a title first to generate content');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateModuleContent(sourceText);
      if (result) {
        if (field === 'module') {
          setFormData({
            ...formData,
            title: result.title,
            // Optionally we could also generate a first lesson or something, 
            // but let's stick to titles for the module level
          });
        } else if (field === 'lesson' && typeof index === 'number') {
          const newLessons = [...(formData.lessons || [])];
          newLessons[index] = {
            ...newLessons[index],
            title: result.title,
            content: result.content
          };
          setFormData({ ...formData, lessons: newLessons });
        }
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoGenerateQuiz = async () => {
    const sourceText = formData.title?.en || formData.title?.ml || '';
    if (!sourceText) {
      setError('Please enter a module title first to generate quiz questions');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await generateQuizQuestions(sourceText);
      if (result) {
        setFormData({
          ...formData,
          quiz: [
            ...(formData.quiz || []),
            ...result.map((q: any) => ({
              ...q,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
            }))
          ]
        });
      }
    } catch (err) {
      console.error('Quiz generation error:', err);
      setError('Failed to generate quiz questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    const prompt = formData.title?.en || formData.title?.ml || '';
    if (!prompt) {
      setError('Please enter a title first to generate an image');
      return;
    }

    setIsGenerating(true);
    try {
      const imageUrl = await generateImage(prompt);
      if (imageUrl) {
        setFormData({ ...formData, imageUrl });
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsGenerating(true);
    setError(null);

    try {
      let result;
      const extension = file.name.split('.').pop()?.toLowerCase();

      if (file.type === 'text/plain' || extension === 'txt' || extension === 'note') {
        const text = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(file, 'UTF-8');
        });
        
        if (text.trim().length < 10) {
          setError(language === 'ml' 
            ? 'ഫയലിൽ ആവശ്യത്തിന് വിവരങ്ങൾ ഇല്ല. ദയവായി കൂടുതൽ വിവരങ്ങൾ ഉള്ള ഫയൽ അപ്‌ലോഡ് ചെയ്യുക.' 
            : 'The file content is too short. Please provide more detailed notes.');
          setIsGenerating(false);
          return;
        }
        result = await generateFullModuleFromText(text);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || extension === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const mammothResult = await mammoth.extractRawText({ arrayBuffer });
        const text = mammothResult.value;
        if (text.trim().length < 10) {
          setError(language === 'ml' 
            ? 'വേർഡ് ഫയലിൽ ആവശ്യത്തിന് വിവരങ്ങൾ ഇല്ല.' 
            : 'The Word file content is too short.');
          setIsGenerating(false);
          return;
        }
        result = await generateFullModuleFromText(text);
      } else if (file.type === 'application/pdf' || extension === 'pdf' || file.type.startsWith('image/')) {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        result = await generateFullModuleFromText(undefined, {
          data: base64Data,
          mimeType: file.type || (extension === 'pdf' ? 'application/pdf' : 'image/jpeg')
        });
      } else {
        // Fallback for other file types: try reading as text
        try {
          const text = await file.text();
          if (text.trim().length > 10) {
            result = await generateFullModuleFromText(text);
          } else {
            throw new Error('Content too short');
          }
        } catch (e) {
          // If text reading fails, try as base64/image
          const base64Data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          result = await generateFullModuleFromText(undefined, {
            data: base64Data,
            mimeType: file.type || 'application/octet-stream'
          });
        }
      }

      if (result) {
        setFormData({
          ...formData,
          title: result.title,
          description: result.description || { en: '', ml: '' },
          category: result.category,
          level: result.level,
          imageUrl: result.suggestedImageKeyword 
            ? `https://picsum.photos/seed/${encodeURIComponent(result.suggestedImageKeyword)}/800/600`
            : `https://picsum.photos/seed/${encodeURIComponent(result.title.en)}/800/600`,
          lessons: result.lessons.map((l: any) => ({ ...l, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) })),
          quiz: result.quiz.map((q: any) => ({ ...q, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }))
        });
        setIsAdding(true);
      } else {
        setError(language === 'ml' 
          ? 'മൊഡ്യൂൾ തയ്യാറാക്കാൻ സാധിച്ചില്ല. ഫയലിൽ ആവശ്യത്തിന് വിവരങ്ങൾ ഉണ്ടെന്ന് ഉറപ്പുവരുത്തുക. അല്ലെങ്കിൽ മറ്റൊരു ഫയൽ പരീക്ഷിക്കുക.' 
          : 'Failed to generate module. Please ensure the file has enough content for the AI to analyze, or try a different file.');
      }
    } catch (err) {
      console.error('File generation error:', err);
      setError('Failed to generate module from file. Please try again.');
    } finally {
      setIsGenerating(false);
      // Reset input
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (activeTab === 'results') {
      const unsubscribe = moduleService.subscribeToResults((data) => {
        setResults(data);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

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
      setFormData({ 
        category: 'Desktop', 
        level: 'basic', 
        title: { en: '', ml: '' }, 
        description: { en: '', ml: '' }, 
        lessons: [], 
        quiz: [],
        imageUrl: '' 
      });
      setError(null);
    } catch (err) {
      console.error('Error saving module:', err);
      setError('Error saving module. Check console for details.');
    }
  };

  const handleSeedData = async () => {
    if (modules.length > 0) {
      if (!window.confirm('Modules already exist. Do you want to add the initial modules anyway?')) {
        return;
      }
    }

    setIsGenerating(true);
    try {
      for (const m of MODULES) {
        await moduleService.addModule({
          ...m,
          order: modules.length + MODULES.indexOf(m)
        });
      }
      setError(null);
      alert('Initial modules added successfully!');
    } catch (err) {
      console.error('Error seeding data:', err);
      setError('Error seeding initial data.');
    } finally {
      setIsGenerating(false);
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
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-stone-500 hover:text-emerald-500 font-black uppercase tracking-widest transition-all group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>{language === 'ml' ? 'തിരികെ പോവുക' : 'Back to Dashboard'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-stone-950 p-1 rounded-2xl border border-stone-800 w-fit">
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'modules' ? 'bg-emerald-500 text-black' : 'text-stone-500 hover:text-white'}`}
        >
          <BookOpen className="w-4 h-4" />
          {language === 'ml' ? 'മൊഡ്യൂളുകൾ' : 'Modules'}
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'results' ? 'bg-emerald-500 text-black' : 'text-stone-500 hover:text-white'}`}
        >
          <Users className="w-4 h-4" />
          {language === 'ml' ? 'ഫലങ്ങൾ' : 'Results'}
        </button>
      </div>

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

      {activeTab === 'modules' ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-black tracking-tighter">
              {language === 'ml' ? 'മൊഡ്യൂളുകൾ നിയന്ത്രിക്കുക' : 'Manage Modules'}
            </h2>
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-stone-950 rounded-xl border border-stone-800 text-[10px] font-black text-stone-600 uppercase tracking-widest">
                <Info className="w-3 h-3" />
                <span>Project: {firebaseConfig.projectId}</span>
              </div>
              <button
                onClick={handleSeedData}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-3 bg-stone-800 text-stone-400 rounded-2xl font-black hover:text-emerald-500 transition-all border border-stone-700 disabled:opacity-50"
                title="Seed Initial Data"
              >
                <Database className="w-5 h-5" />
                <span className="hidden sm:inline">Seed Data</span>
              </button>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black rounded-2xl font-black hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" />
                <span>{language === 'ml' ? 'പുതിയ മൊഡ്യൂൾ' : 'New Module'}</span>
              </button>
            </div>
          </div>

          {(isAdding || editingId) && (
            <div className="bg-stone-800/50 border-2 border-emerald-500/30 rounded-3xl p-8 space-y-8">
              {/* Quick Upload Option */}
              {!editingId && (
                <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3 text-emerald-500">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-black uppercase tracking-widest text-sm">
                      {language === 'ml' ? 'ഫയലിൽ നിന്ന് ഓട്ടോമാറ്റിക് ആയി നിർമ്മിക്കുക' : 'Auto-Generate from File'}
                    </h3>
                  </div>
                  <p className="text-stone-400 text-xs">
                    {language === 'ml' 
                      ? 'നിങ്ങളുടെ ക്ലാസ്സ് നോട്ടുകൾ (PDF, Word, Text) അപ്‌ലോഡ് ചെയ്യുക. AI ഓട്ടോമാറ്റിക് ആയി മൊഡ്യൂൾ തയ്യാറാക്കും.' 
                      : 'Upload your class notes (PDF, Word, Text). AI will automatically prepare the module for you.'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-stone-800 text-[10px] text-stone-500 rounded-md border border-stone-700">.PDF</span>
                    <span className="px-2 py-1 bg-stone-800 text-[10px] text-stone-500 rounded-md border border-stone-700">.DOCX</span>
                    <span className="px-2 py-1 bg-stone-800 text-[10px] text-stone-500 rounded-md border border-stone-700">.TXT</span>
                    <span className="px-2 py-1 bg-stone-800 text-[10px] text-stone-500 rounded-md border border-stone-700">.RTF</span>
                  </div>
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black rounded-xl font-black hover:bg-white transition-all cursor-pointer shadow-lg active:scale-95">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    <span>{language === 'ml' ? 'ഫയൽ തിരഞ്ഞെടുക്കുക' : 'Select File'}</span>
                    <input type="file" className="hidden" accept=".txt,.doc,.docx,.pdf,.rtf,.odt,.note" onChange={handleFileUpload} disabled={isGenerating} />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-stone-500 tracking-widest">Title (English)</label>
                    <button
                      onClick={() => handleAutoGenerate('module')}
                      disabled={isGenerating}
                      className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Auto-Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.title?.en}
                    onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                    placeholder="Enter English title"
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
                  <label className="text-xs font-black uppercase text-stone-500 tracking-widest">Description (English)</label>
                  <textarea
                    value={formData.description?.en}
                    onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 h-20"
                    placeholder="Short description for dashboard"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-stone-500 tracking-widest">Description (Malayalam)</label>
                  <textarea
                    value={formData.description?.ml}
                    onChange={(e) => setFormData({ ...formData, description: { ...formData.description, ml: e.target.value } })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 h-20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-stone-500 tracking-widest">Category</label>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 appearance-none"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      <option value="Other">Other</option>
                    </select>
                    {formData.category === 'Other' && (
                      <input
                        type="text"
                        placeholder="Enter Category Name"
                        className="mt-2 w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-stone-500 tracking-widest">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="basic">Basic</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-stone-500 tracking-widest">Image URL (Optional)</label>
                    <button
                      onClick={handleGenerateImage}
                      disabled={isGenerating}
                      className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Generate with AI
                    </button>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={formData.imageUrl || ''}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full bg-stone-900 border border-stone-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500"
                        placeholder="e.g., https://picsum.photos/seed/desktop/800/600"
                      />
                      {formData.imageUrl && (
                        <p className="text-[10px] text-stone-500 font-medium truncate max-w-xs">
                          {formData.imageUrl.startsWith('data:') ? 'AI Generated Image (Base64)' : formData.imageUrl}
                        </p>
                      )}
                    </div>
                    {formData.imageUrl && (
                      <div className="w-24 h-24 rounded-xl border border-stone-700 overflow-hidden bg-stone-900 flex-shrink-0">
                        <img 
                          src={formData.imageUrl} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase text-stone-500 tracking-widest">Lessons</h4>
                {formData.lessons?.map((lesson, idx) => (
                  <div key={idx} className="p-4 bg-stone-900 rounded-xl border border-stone-700 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase text-stone-600 tracking-widest">Lesson {idx + 1}</span>
                      <button
                        onClick={() => handleAutoGenerate('lesson', idx)}
                        disabled={isGenerating}
                        className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                      >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Generate Content
                      </button>
                    </div>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Video URL</label>
                        <input
                          placeholder="e.g., https://youtube.com/..."
                          value={lesson.videoUrl || ''}
                          onChange={(e) => {
                            const newLessons = [...(formData.lessons || [])];
                            newLessons[idx] = { ...lesson, videoUrl: e.target.value };
                            setFormData({ ...formData, lessons: newLessons });
                          }}
                          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs focus:border-emerald-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest">Audio URL</label>
                        <input
                          placeholder="e.g., https://example.com/audio.mp3"
                          value={lesson.audioUrl || ''}
                          onChange={(e) => {
                            const newLessons = [...(formData.lessons || [])];
                            newLessons[idx] = { ...lesson, audioUrl: e.target.value };
                            setFormData({ ...formData, lessons: newLessons });
                          }}
                          className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-xs focus:border-emerald-500 outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const newLessons = formData.lessons?.filter((_, i) => i !== idx);
                        setFormData({ ...formData, lessons: newLessons });
                      }}
                      className="text-red-500 text-xs font-black uppercase flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove Lesson
                    </button>
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
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase text-stone-500 tracking-widest">Quiz Questions</h4>
                  <button
                    onClick={handleAutoGenerateQuiz}
                    disabled={isGenerating}
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-500 hover:text-white transition-colors disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Auto-Generate Quiz
                  </button>
                </div>
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
                    <div className="flex items-center justify-between">
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
                      <button
                        onClick={() => {
                          const newQuiz = formData.quiz?.filter((_, i) => i !== idx);
                          setFormData({ ...formData, quiz: newQuiz });
                        }}
                        className="text-red-500 text-xs font-black uppercase flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Question
                      </button>
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
              <div key={m.id} className="bg-stone-800/30 border border-stone-700 rounded-2xl p-6 flex items-center justify-between hover:border-emerald-500/30 transition-all">
                <div>
                  <h3 className="text-xl font-black">{m.title[language] || m.title.en}</h3>
                  <p className="text-stone-500 text-xs uppercase tracking-widest font-black mt-1">{m.category}</p>
                  <div className="flex gap-4 mt-2 text-[10px] font-black uppercase text-stone-600">
                    <span>{m.lessons.length} Lessons</span>
                    <span>{m.quiz.length} Questions</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingId(m.id); setFormData(m); }}
                    className="p-3 bg-stone-700 rounded-xl hover:bg-emerald-500 hover:text-black transition-all"
                    aria-label="Edit Module"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(m.id)}
                    className="p-3 bg-stone-700 rounded-xl hover:bg-red-500 transition-all"
                    aria-label="Delete Module"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6">
          <h2 className="text-3xl font-black tracking-tighter">
            {language === 'ml' ? 'കുട്ടികളുടെ ഫലങ്ങൾ' : 'Student Results'}
          </h2>
          <div className="grid gap-4">
            {results.length === 0 ? (
              <div className="p-12 text-center bg-stone-800/20 rounded-3xl border-2 border-dashed border-stone-800">
                <p className="text-stone-500 font-black uppercase tracking-widest">No results yet</p>
              </div>
            ) : (
              results.map((res) => (
                <div key={res.id} className="bg-stone-800/30 border border-stone-700 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-black text-emerald-500">{res.studentName}</h3>
                    <p className="text-stone-400 text-sm font-medium">{res.studentEmail}</p>
                    <div className="flex items-center gap-2 text-stone-500 text-xs font-black uppercase tracking-widest mt-2">
                      <BookOpen className="w-3 h-3" />
                      {res.moduleTitle}
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-3xl font-black text-white">{res.score}/{res.total}</div>
                      <div className="text-[10px] font-black uppercase text-stone-600 tracking-widest">Score</div>
                    </div>
                    <div className="h-12 w-px bg-stone-800 hidden md:block" />
                    <div className="flex items-center gap-2 text-stone-500 text-[10px] font-black uppercase tracking-widest">
                      <Calendar className="w-3 h-3" />
                      {new Date(res.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
