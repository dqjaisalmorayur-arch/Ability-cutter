import React, { useState, useEffect, useMemo } from 'react';
import { Module, Language, Lesson, Question, QuizResult, UserProgress } from '../types';
import { moduleService } from '../services/moduleService';
import { generateModuleContent, generateQuizQuestions, generateFullModuleFromText } from '../services/geminiService';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, Edit2, Users, BookOpen, Calendar, ChevronLeft, Sparkles, Loader2, FileText, Upload, Database, Info, Music, Play, Pause, CheckCircle, Search } from 'lucide-react';
import * as mammoth from 'mammoth';
import { MODULES } from '../constants';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AdminPanelProps {
  modules: Module[];
  language: Language;
  onBack: () => void;
}

export default function AdminPanel({ modules, language, onBack }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'modules' | 'results' | 'students'>('modules');
  const [results, setResults] = useState<QuizResult[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [allProgress, setAllProgress] = useState<UserProgress[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSection, setEditSection] = useState<'details' | 'lessons' | 'quiz'>('details');
  const [quickEditingId, setQuickEditingId] = useState<string | null>(null);
  const [quickEditData, setQuickEditData] = useState<{ en: string; ml: string }>({ en: '', ml: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [formData, setFormData] = useState<Partial<Module>>({
    category: 'Desktop',
    level: 'basic',
    title: { en: '', ml: '' },
    description: { en: '', ml: '' },
    lessons: [],
    quiz: [],
    audioUrl: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  const loadingMessages = language === 'ml' 
    ? [
        'വിവരങ്ങൾ വിശകരണം ചെയ്യുന്നു...',
        'ഏതാണ്ട് തയ്യാറായിക്കഴിഞ്ഞു...',
        'ഇൻറർനെറ്റ് വേഗത കുറവാണെങ്കിലും ഞങ്ങൾ ശ്രമിക്കുന്നു...'
      ]
    : [
        'Analyzing module content...',
        'Almost there...',
        'Working hard even on slow connections...'
      ];

  const [uploadingAudio, setUploadingAudio] = useState<number | null>(null);
  const [isUploadingModuleAudio, setIsUploadingModuleAudio] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isGenerating, loadingMessages.length]);

  const handleModuleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError(language === 'ml' ? 'ദയവായി ഒരു ഓഡിയോ ഫയൽ അപ്‌ലോഡ് ചെയ്യുക (mp3, wav, etc.)' : 'Please upload an audio file (mp3, wav, etc.)');
      return;
    }

    setIsUploadingModuleAudio(true);
    setError(null);

    try {
      const storageRef = ref(storage, `modules/audio/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      setFormData({ ...formData, audioUrl: downloadURL });
    } catch (err) {
      console.error('Module audio upload error:', err);
      setError(language === 'ml' ? 'ഓഡിയോ ഫയൽ അപ്‌ലോഡ് ചെയ്യാൻ സാധിച്ചില്ല.' : 'Failed to upload audio file.');
    } finally {
      setIsUploadingModuleAudio(false);
      e.target.value = '';
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>, lessonIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      setError('Please upload an audio file (mp3, wav, etc.)');
      return;
    }

    setUploadingAudio(lessonIndex);
    setError(null);

    try {
      const storageRef = ref(storage, `lessons/audio/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const newLessons = [...(formData.lessons || [])];
      newLessons[lessonIndex] = {
        ...newLessons[lessonIndex],
        audioUrl: downloadURL
      };
      setFormData({ ...formData, lessons: newLessons });
    } catch (err) {
      console.error('Audio upload error:', err);
      setError('Failed to upload audio file. Please try again.');
    } finally {
      setUploadingAudio(null);
      e.target.value = '';
    }
  };

  const handleAutoGenerate = async (field: 'module' | 'module-desc' | 'lesson' | 'lesson-content', index?: number) => {
    let sourceText = '';
    if (field === 'module' || field === 'module-desc') {
      sourceText = formData.title?.en || formData.title?.ml || '';
    } else if ((field === 'lesson' || field === 'lesson-content') && typeof index === 'number') {
      sourceText = formData.lessons?.[index]?.title?.en || formData.lessons?.[index]?.title?.ml || formData.title?.en || '';
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
            description: formData.description?.en ? formData.description : result.content
          });
        } else if (field === 'module-desc') {
          setFormData({
            ...formData,
            description: result.content
          });
        } else if (field === 'lesson' && typeof index === 'number') {
          const newLessons = [...(formData.lessons || [])];
          newLessons[index] = {
            ...newLessons[index],
            title: result.title,
            content: result.content
          };
          setFormData({ ...formData, lessons: newLessons });
        } else if (field === 'lesson-content' && typeof index === 'number') {
          const newLessons = [...(formData.lessons || [])];
          newLessons[index] = {
            ...newLessons[index],
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

  const handleMagicFill = async () => {
    const sourceText = formData.title?.en || formData.title?.ml || '';
    if (!sourceText) {
      setError('Please enter a title first');
      return;
    }

    setIsGenerating(true);
    try {
      // Generate full module content if it's mostly empty
      const result = await generateFullModuleFromText(sourceText);
      if (result) {
        setFormData({
          ...formData,
          title: {
            en: formData.title?.en || result.title.en,
            ml: formData.title?.ml || result.title.ml
          },
          description: {
            en: formData.description?.en || result.description.en,
            ml: formData.description?.ml || result.description.ml
          },
          category: formData.category === 'Desktop' ? result.category : formData.category,
          level: formData.level === 'basic' ? result.level : formData.level,
          lessons: formData.lessons && formData.lessons.length > 0 ? formData.lessons : result.lessons.map((l: any) => ({ ...l, id: `ai-lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` })),
          quiz: formData.quiz && formData.quiz.length > 0 ? formData.quiz : result.quiz.map((q: any) => ({ ...q, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }))
        });
      }
    } catch (err) {
      console.error('Magic fill error:', err);
      setError('Failed to auto-fill content.');
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
          reader.readAsText(file); // Default to UTF-8, handles BOMs
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
      }

      if (result) {
        setFormData({
          ...formData,
          title: result.title,
          description: result.description || { en: '', ml: '' },
          category: result.category,
          level: result.level,
          lessons: result.lessons.map((l: any) => ({ ...l, id: `ai-lesson-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` })),
          quiz: result.quiz.map((q: any) => ({ ...q, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }))
        });
        setIsAdding(true);
      }
    } catch (err: any) {
      console.error('File generation error:', err);
      const msg = err?.message || (language === 'ml' ? 'അജ്ഞാതമായ പിശക്' : 'Unknown error');
      setError(language === 'ml' 
        ? `മൊഡ്യൂൾ തയ്യാറാക്കാൻ സാധിച്ചില്ല: ${msg}` 
        : `Failed to generate module: ${msg}`);
    } finally {
      setIsGenerating(false);
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (activeTab === 'results') {
      const unsubscribe = moduleService.subscribeToResults((data) => {
        setResults(data);
      });
      return () => unsubscribe();
    } else if (activeTab === 'students') {
      const unsubscribeUsers = moduleService.subscribeToUsers((data) => {
        setUsers(data);
      });
      const unsubscribeProgress = moduleService.subscribeToAllProgress((data) => {
        setAllProgress(data);
      });
      return () => {
        unsubscribeUsers();
        unsubscribeProgress();
      };
    }
  }, [activeTab]);

  const handleSave = async () => {
    if (!formData.title?.en || !formData.title?.ml) {
      setError('Please fill in both English and Malayalam titles');
      return;
    }

    if (!formData.description?.en || !formData.description?.ml) {
      setError('Please fill in both English and Malayalam descriptions');
      return;
    }

    try {
      // Remove 'id' and ensure no undefined values are sent to Firestore
      const { id, ...dataToSave } = formData;
      
      // Helper to remove undefined values recursively
      const sanitize = (obj: any): any => {
        if (Array.isArray(obj)) {
          return obj.map(v => sanitize(v));
        } else if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
          const newObj: any = {};
          Object.keys(obj).forEach(key => {
            if (obj[key] !== undefined) {
              newObj[key] = sanitize(obj[key]);
            }
          });
          return newObj;
        }
        return obj;
      };

      const finalData = sanitize({
        ...dataToSave,
        title: dataToSave.title || { en: '', ml: '' },
        description: dataToSave.description || { en: '', ml: '' },
        category: dataToSave.category || 'Desktop',
        level: dataToSave.level || 'basic',
        lessons: (dataToSave.lessons || []).filter((l: any, index: number, self: any[]) =>
          index === self.findIndex((t) => (
            (t.title.en === l.title.en || t.title.ml === l.title.ml) && t.content.en === l.content.en
          ))
        ),
        quiz: dataToSave.quiz || []
      });

      if (editingId) {
        await moduleService.updateModule(editingId, finalData);
      } else {
        await moduleService.addModule({
          ...finalData as Omit<Module, 'id'>,
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
        audioUrl: ''
      });
      setError(null);
      setSuccess(editingId ? 'Module updated successfully!' : 'Module added successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error saving module:', err);
      let errorMessage = 'Error saving module.';
      if (err instanceof Error) {
        try {
          // Check if it's a JSON error from handleFirestoreError
          const parsed = JSON.parse(err.message);
          if (parsed.error) errorMessage = `Firebase Error: ${parsed.error}`;
        } catch {
          errorMessage = `Error: ${err.message}`;
        }
      }
      setError(errorMessage);
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        if (isAdding || editingId) {
          e.preventDefault();
          handleSave();
        }
      }
      if (e.key === 'Escape') {
        if (isAdding || editingId) {
          setIsAdding(false);
          setEditingId(null);
        } else {
          onBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdding, editingId, formData]);

  const uniqueModules = useMemo(() => {
    let filtered = modules.filter((m, index, self) =>
      index === self.findIndex((t) => (
        (t.title.en === m.title.en || t.title.ml === m.title.ml) && t.category === m.category
      ))
    );

    if (categoryFilter !== 'All') {
      filtered = filtered.filter(m => m.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        m.title.en.toLowerCase().includes(query) || 
        m.title.ml.toLowerCase().includes(query) ||
        m.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [modules, categoryFilter, searchQuery]);

  const categories = useMemo(() => {
    const cats = new Set(modules.map(m => m.category));
    return ['All', ...Array.from(cats)].sort();
  }, [modules]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar */}
      <aside className="space-y-6 lg:sticky lg:top-8">
        {/* Header with Back Button */}
        <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm space-y-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-ability-blue font-bold uppercase tracking-widest transition-all group text-xs"
            aria-label={language === 'ml' ? 'ഡാഷ്ബോർഡിലേക്ക് തിരികെ പോവുക' : 'Back to Dashboard'}
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{language === 'ml' ? 'തിരികെ പോവുക' : 'Back'}</span>
          </button>

          <div className="h-px bg-black/5" />

          {/* Tabs */}
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('modules')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'modules' ? 'bg-ability-blue text-white shadow-md' : 'text-zinc-400 hover:bg-ability-blue/5 hover:text-ink'}`}
              aria-label={language === 'ml' ? 'മൊഡ്യൂളുകൾ ടാബ്' : 'Modules Tab'}
            >
              <BookOpen className="w-4 h-4" />
              {language === 'ml' ? 'മൊഡ്യൂളുകൾ' : 'Modules'}
            </button>
            <button
              onClick={() => setActiveTab('results')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'results' ? 'bg-ability-blue text-white shadow-md' : 'text-zinc-400 hover:bg-ability-blue/5 hover:text-ink'}`}
              aria-label={language === 'ml' ? 'ഫലങ്ങൾ ടാബ്' : 'Results Tab'}
            >
              <FileText className="w-4 h-4" />
              {language === 'ml' ? 'ഫലങ്ങൾ' : 'Results'}
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-ability-blue text-white shadow-md' : 'text-zinc-400 hover:bg-ability-blue/5 hover:text-ink'}`}
              aria-label={language === 'ml' ? 'കുട്ടികൾ ടാബ്' : 'Students Tab'}
            >
              <Users className="w-4 h-4" />
              {language === 'ml' ? 'കുട്ടികൾ' : 'Students'}
            </button>
          </nav>
        </div>

        {/* Filters Section */}
        {activeTab === 'modules' && !isAdding && !editingId && (
          <div className="bg-white border border-black/5 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Filters</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'ml' ? 'തിരയുക...' : 'Search...'}
                    className="w-full pl-10 pr-4 py-2.5 bg-paper border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ability-blue/20"
                  />
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest ml-1">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${categoryFilter === cat ? 'bg-ability-blue text-white border-ability-blue shadow-sm' : 'bg-paper text-zinc-400 border-black/5 hover:border-ability-blue/30'}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Status Card */}
        <div className="bg-ink text-white rounded-3xl p-6 shadow-xl space-y-4">
          <h3 className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">System Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-xl font-bold">{modules.length}</div>
              <div className="text-[8px] font-bold uppercase text-zinc-500 tracking-widest">Modules</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold">{users.length}</div>
              <div className="text-[8px] font-bold uppercase text-zinc-500 tracking-widest">Students</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold">{results.length}</div>
              <div className="text-[8px] font-bold uppercase text-zinc-500 tracking-widest">Results</div>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-bold text-green-400">Online</div>
              <div className="text-[8px] font-bold uppercase text-zinc-500 tracking-widest">Status</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="space-y-8">

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center justify-between shadow-sm mb-6" role="alert">
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error"><X className="w-4 h-4" /></button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 text-green-600 p-4 rounded-xl flex items-center justify-between shadow-sm mb-6 animate-in fade-in slide-in-from-top-4" role="status">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="font-medium">{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} aria-label="Dismiss success"><X className="w-4 h-4" /></button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black/5 p-8 rounded-[2rem] max-w-md w-full space-y-6 shadow-2xl">
            <h3 className="text-2xl font-sans font-bold text-ink">Delete Module?</h3>
            <p className="text-zinc-500">This action cannot be undone. All lessons and quizzes in this module will be lost.</p>
            <div className="flex gap-4">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 bg-paper rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition-colors" aria-label="Cancel deletion">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors" aria-label="Confirm deletion">Delete</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'modules' ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-sans font-bold text-ink">
              {language === 'ml' ? 'മൊഡ്യൂളുകൾ നിയന്ത്രിക്കുക' : 'Manage Modules'}
            </h2>
            <div className="flex items-center gap-4">
              <button
                onClick={handleSeedData}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-3 bg-white text-zinc-400 rounded-2xl font-bold hover:text-ability-blue transition-all border border-black/5 shadow-sm disabled:opacity-50"
                title="Seed Initial Data"
                aria-label="Seed Initial Data"
              >
                <Database className="w-5 h-5" />
                <span className="hidden sm:inline">Seed Data</span>
              </button>
              <button
                onClick={async () => {
                  setIsGenerating(true);
                  try {
                    const modulesToFix = modules.filter(m => !m.description?.en || !m.description?.ml);
                    for (const m of modulesToFix) {
                      const result = await generateModuleContent(m.title.en);
                      if (result) {
                        await moduleService.updateModule(m.id, {
                          description: result.description || result.content // Fallback to content if description is missing
                        });
                      }
                    }
                    alert(`Fixed descriptions for ${modulesToFix.length} modules!`);
                  } catch (err) {
                    console.error('Error fixing descriptions:', err);
                    setError('Failed to fix module descriptions.');
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-3 bg-white text-zinc-400 rounded-2xl font-bold hover:text-ability-blue transition-all border border-black/5 shadow-sm disabled:opacity-50"
                title="Fix Missing Descriptions"
                aria-label="Fix Missing Descriptions"
              >
                <FileText className="w-5 h-5" />
                <span className="hidden sm:inline">Fix Descriptions</span>
              </button>
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 px-6 py-3 bg-ink text-white rounded-2xl font-bold hover:bg-ability-blue transition-all shadow-lg hover:scale-105"
                aria-label={language === 'ml' ? 'പുതിയ മൊഡ്യൂൾ ചേർക്കുക' : 'Add New Module'}
              >
                <Plus className="w-5 h-5" />
                <span>{language === 'ml' ? 'പുതിയ മൊഡ്യൂൾ' : 'New Module'}</span>
              </button>
            </div>
          </div>

          {(isAdding || editingId) && (
            <div className="bg-white border border-black/5 rounded-3xl p-8 space-y-8 shadow-xl">
              {/* Section Tabs */}
              <div className="flex gap-2 border-b border-black/5 pb-4">
                <button
                  onClick={() => setEditSection('details')}
                  className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${editSection === 'details' ? 'bg-ability-blue text-white shadow-md' : 'text-zinc-400 hover:text-ink'}`}
                >
                  Details
                </button>
                <button
                  onClick={() => setEditSection('lessons')}
                  className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${editSection === 'lessons' ? 'bg-ability-blue text-white shadow-md' : 'text-zinc-400 hover:text-ink'}`}
                >
                  Lessons ({formData.lessons?.length || 0})
                </button>
                <button
                  onClick={() => setEditSection('quiz')}
                  className={`px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${editSection === 'quiz' ? 'bg-ability-blue text-white shadow-md' : 'text-zinc-400 hover:text-ink'}`}
                >
                  Quiz ({formData.quiz?.length || 0})
                </button>
              </div>

              {/* Quick Upload Option */}
              {!editingId && editSection === 'details' && (
                <div className="p-6 bg-ability-blue/5 border border-ability-blue/10 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3 text-ability-blue">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold uppercase tracking-widest text-sm">
                      {language === 'ml' ? 'ഫയലിൽ നിന്ന് ഓട്ടോമാറ്റിക് ആയി നിർമ്മിക്കുക' : 'Auto-Generate from File'}
                    </h3>
                  </div>
                  <p className="text-zinc-500 text-xs">
                    {language === 'ml' 
                      ? 'നിങ്ങളുടെ ക്ലാസ്സ് നോട്ടുകൾ (PDF, Word, Text) അപ്‌ലോഡ് ചെയ്യുക. AI ഓട്ടോമാറ്റിക് ആയി മൊഡ്യൂൾ തയ്യാറാക്കും.' 
                      : 'Upload your class notes (PDF, Word, Text). AI will automatically prepare the module for you.'}
                  </p>
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-ability-blue text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-all cursor-pointer shadow-lg shadow-ability-blue/20">
                    <Upload className="w-4 h-4" />
                    {language === 'ml' ? 'ഫയൽ തിരഞ്ഞെടുക്കുക' : 'Choose File'}
                    <input type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
                  </label>
                </div>
              )}

              {/* Module Details Section */}
              {editSection === 'details' && (
                <div className="space-y-8">
                <div className="flex items-center justify-between border-b border-black/5 pb-4">
                  <h3 className="text-2xl font-sans font-bold text-ink">
                    {language === 'ml' ? 'മൊഡ്യൂൾ വിവരങ്ങൾ' : 'Module Details'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                      {language === 'ml' ? 'AI സഹായം' : 'AI Assistant'}
                    </span>
                    <button
                      onClick={() => handleAutoGenerate('module-desc')}
                      disabled={isGenerating}
                      className="p-2 bg-ability-blue/5 text-ability-blue rounded-lg hover:bg-ability-blue hover:text-white transition-all disabled:opacity-50"
                      title="Auto-generate description"
                    >
                      <Sparkles className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Titles and Descriptions */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Title & Description (English)</label>
                        <div className="bg-paper border border-black/5 rounded-2xl p-4 space-y-3">
                          <input
                            type="text"
                            value={formData.title?.en}
                            onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-lg placeholder:text-zinc-300"
                            placeholder="English Title..."
                          />
                          <div className="h-px bg-black/5" />
                          <textarea
                            value={formData.description?.en}
                            onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm resize-none h-20 placeholder:text-zinc-300"
                            placeholder="English Description..."
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Title & Description (Malayalam)</label>
                        <div className="bg-paper border border-black/5 rounded-2xl p-4 space-y-3">
                          <input
                            type="text"
                            value={formData.title?.ml}
                            onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ml: e.target.value } })}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 font-bold text-lg placeholder:text-zinc-300"
                            placeholder="മലയാളം ടൈറ്റിൽ..."
                          />
                          <div className="h-px bg-black/5" />
                          <textarea
                            value={formData.description?.ml}
                            onChange={(e) => setFormData({ ...formData, description: { ...formData.description, ml: e.target.value } })}
                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm resize-none h-20 placeholder:text-zinc-300"
                            placeholder="മലയാളം വിവരണം..."
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Category</label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full bg-paper border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:border-ability-blue/30 appearance-none cursor-pointer text-sm font-medium"
                        >
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Level</label>
                        <select
                          value={formData.level}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                          className="w-full bg-paper border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:border-ability-blue/30 cursor-pointer text-sm font-medium"
                        >
                          <option value="basic">Basic</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Module Info */}
                  <div className="space-y-4">
                    <div className="p-6 bg-paper rounded-3xl border border-black/5 space-y-4">
                      <div className="flex items-center gap-3 text-ability-blue">
                        <Info className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-sm">Module Info</h3>
                      </div>
                      <p className="text-xs text-zinc-500 leading-relaxed">
                        {language === 'ml' 
                          ? 'ഈ മൊഡ്യൂൾ വിദ്യാർത്ഥികൾക്ക് ലളിതമായി മനസ്സിലാക്കാവുന്ന രീതിയിൽ തയ്യാറാക്കുക. ടൈറ്റിലും ഡിസ്ക്രിപ്ഷനും കൃത്യമായി നൽകുന്നത് പഠനം എളുപ്പമാക്കും.' 
                          : 'Create this module in a way that is easy for students to understand. Providing accurate titles and descriptions will make learning easier.'}
                      </p>
                    </div>

                    {/* Audio Class Option */}
                    <div className="p-6 bg-ability-blue/5 border border-ability-blue/10 rounded-3xl space-y-4">
                      <div className="flex items-center gap-3 text-ability-blue">
                        <Music className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-sm">
                          {language === 'ml' ? 'ഓഡിയോ ക്ലാസ് (Audio Class)' : 'Audio Class Option'}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-500">
                        {language === 'ml' 
                          ? 'ഈ മൊഡ്യൂളിനായി ഒരു പ്രധാന ഓഡിയോ ഫയൽ അപ്‌ലോഡ് ചെയ്യുക.' 
                          : 'Upload a main audio file for this module.'}
                      </p>
                      <div className="flex gap-2">
                        <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed transition-all cursor-pointer ${formData.audioUrl ? 'border-ability-blue/30 bg-ability-blue/5 text-ability-blue' : 'border-black/5 bg-white text-zinc-400 hover:border-ability-blue/30'}`}>
                          {isUploadingModuleAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {formData.audioUrl ? (language === 'ml' ? 'ഓഡിയോ മാറ്റുക' : 'Change Audio') : (language === 'ml' ? 'ഓഡിയോ അപ്‌ലോഡ്' : 'Upload Audio')}
                          </span>
                          <input type="file" className="hidden" accept="audio/*" onChange={handleModuleAudioUpload} disabled={isUploadingModuleAudio} />
                        </label>
                        {formData.audioUrl && (
                          <button
                            onClick={() => new Audio(formData.audioUrl).play()}
                            className="p-3 bg-ability-blue text-white rounded-xl hover:opacity-90 transition-all"
                            title="Play Audio"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Lessons Section */}
              {editSection === 'lessons' && (
                <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <h3 className="text-xl font-sans font-bold text-ink">Lessons</h3>
                  <button
                    onClick={() => setFormData({ ...formData, lessons: [...(formData.lessons || []), { id: Date.now().toString(), title: { en: '', ml: '' }, content: { en: '', ml: '' } }] })}
                    className="flex items-center gap-2 px-4 py-2 bg-paper text-ability-blue rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-ability-blue hover:text-white transition-all border border-black/5"
                    aria-label="Add Lesson"
                  >
                    <Plus className="w-4 h-4" />
                    Add Lesson
                  </button>
                </div>
                
                <div className="space-y-6">
                  {formData.lessons?.map((lesson, idx) => (
                    <div key={idx} className="p-6 bg-paper border border-black/5 rounded-2xl space-y-6 relative group">
                      <button
                        onClick={() => {
                          const newLessons = formData.lessons?.filter((_, i) => i !== idx);
                          setFormData({ ...formData, lessons: newLessons });
                        }}
                        className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 transition-colors"
                        title="Remove Lesson"
                        aria-label="Remove Lesson"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-ability-blue/10 text-ability-blue rounded-lg flex items-center justify-center font-bold text-sm">
                          {idx + 1}
                        </div>
                        <h4 className="font-bold text-ink">Lesson Details</h4>
                        <div className="ml-auto flex items-center gap-4">
                          <button
                            onClick={() => handleAutoGenerate('lesson', idx)}
                            disabled={isGenerating}
                            className="flex items-center gap-1 text-[10px] font-bold uppercase text-ability-blue hover:opacity-70 transition-colors disabled:opacity-50"
                            aria-label="Generate Full Lesson with AI"
                          >
                            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Full Lesson
                          </button>
                          <button
                            onClick={() => handleAutoGenerate('lesson-content', idx)}
                            disabled={isGenerating}
                            className="flex items-center gap-1 text-[10px] font-bold uppercase text-zinc-400 hover:text-ability-blue transition-colors disabled:opacity-50"
                            aria-label="Generate Content Only"
                          >
                            <FileText className="w-3 h-3" />
                            Content Only
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label htmlFor={`lesson-title-en-${idx}`} className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Title (EN)</label>
                          <input
                            id={`lesson-title-en-${idx}`}
                            value={lesson.title.en}
                            onChange={(e) => {
                              const newLessons = [...(formData.lessons || [])];
                              newLessons[idx] = { ...lesson, title: { ...lesson.title, en: e.target.value } };
                              setFormData({ ...formData, lessons: newLessons });
                            }}
                            className="w-full bg-white border border-black/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-ability-blue/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`lesson-title-ml-${idx}`} className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Title (ML)</label>
                          <input
                            id={`lesson-title-ml-${idx}`}
                            value={lesson.title.ml}
                            onChange={(e) => {
                              const newLessons = [...(formData.lessons || [])];
                              newLessons[idx] = { ...lesson, title: { ...lesson.title, ml: e.target.value } };
                              setFormData({ ...formData, lessons: newLessons });
                            }}
                            className="w-full bg-white border border-black/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-ability-blue/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label htmlFor={`lesson-content-en-${idx}`} className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Content (EN)</label>
                          <textarea
                            id={`lesson-content-en-${idx}`}
                            value={lesson.content.en}
                            onChange={(e) => {
                              const newLessons = [...(formData.lessons || [])];
                              newLessons[idx] = { ...lesson, content: { ...lesson.content, en: e.target.value } };
                              setFormData({ ...formData, lessons: newLessons });
                            }}
                            className="w-full bg-white border border-black/5 rounded-xl px-4 py-2 text-sm h-32 focus:outline-none focus:border-ability-blue/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`lesson-content-ml-${idx}`} className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Content (ML)</label>
                          <textarea
                            id={`lesson-content-ml-${idx}`}
                            value={lesson.content.ml}
                            onChange={(e) => {
                              const newLessons = [...(formData.lessons || [])];
                              newLessons[idx] = { ...lesson, content: { ...lesson.content, ml: e.target.value } };
                              setFormData({ ...formData, lessons: newLessons });
                            }}
                            className="w-full bg-white border border-black/5 rounded-xl px-4 py-2 text-sm h-32 focus:outline-none focus:border-ability-blue/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor={`lesson-video-${idx}`} className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                            <Play className="w-3 h-3" /> Video URL
                          </label>
                          <input
                            id={`lesson-video-${idx}`}
                            placeholder="YouTube URL"
                            value={lesson.videoUrl || ''}
                            onChange={(e) => {
                              const newLessons = [...(formData.lessons || [])];
                              newLessons[idx] = { ...lesson, videoUrl: e.target.value };
                              setFormData({ ...formData, lessons: newLessons });
                            }}
                            className="w-full bg-white border border-black/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-ability-blue/30"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest flex items-center justify-between">
                            <span className="flex items-center gap-2"><Music className="w-3 h-3" /> Audio File</span>
                            {lesson.audioUrl && <span className="text-ability-blue flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Ready</span>}
                          </label>
                          <div className="flex gap-2">
                            <label className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl border-2 border-dashed transition-all cursor-pointer ${lesson.audioUrl ? 'border-ability-blue/30 bg-ability-blue/5 text-ability-blue' : 'border-black/5 bg-white text-zinc-400 hover:border-ability-blue/30'}`}>
                              {uploadingAudio === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                              <span className="text-[10px] font-bold uppercase tracking-widest">{lesson.audioUrl ? 'Change Audio' : 'Upload Audio'}</span>
                              <input type="file" className="hidden" accept="audio/*" onChange={(e) => handleAudioUpload(e, idx)} disabled={uploadingAudio !== null} />
                            </label>
                            {lesson.audioUrl && (
                              <button
                                onClick={() => new Audio(lesson.audioUrl).play()}
                                className="p-2 bg-ability-blue text-white rounded-xl hover:opacity-90 transition-all"
                                aria-label="Play Audio"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              {/* Quiz Section */}
              {editSection === 'quiz' && (
                <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                  <h3 className="text-xl font-sans font-bold text-ink">Quiz Questions</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAutoGenerateQuiz}
                      disabled={isGenerating}
                      className="flex items-center gap-2 px-4 py-2 bg-ability-blue/5 text-ability-blue rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-ability-blue/10 transition-all border border-ability-blue/10"
                      aria-label="Generate Quiz with AI"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generate Quiz
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, quiz: [...(formData.quiz || []), { id: Date.now().toString(), text: { en: '', ml: '' }, options: { en: ['', '', '', ''], ml: ['', '', '', ''] }, correctIndex: 0 }] })}
                      className="flex items-center gap-2 px-4 py-2 bg-paper text-ability-blue rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-ability-blue hover:text-white transition-all border border-black/5"
                      aria-label="Add Question"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {formData.quiz?.map((q, idx) => (
                    <div key={idx} className="p-6 bg-paper border border-black/5 rounded-2xl space-y-6 relative group">
                      <button
                        onClick={() => {
                          const newQuiz = formData.quiz?.filter((_, i) => i !== idx);
                          setFormData({ ...formData, quiz: newQuiz });
                        }}
                        className="absolute top-4 right-4 p-2 text-zinc-300 hover:text-red-500 transition-colors"
                        aria-label="Remove Question"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-ability-blue/10 text-ability-blue rounded-lg flex items-center justify-center font-bold text-sm">
                          Q{idx + 1}
                        </div>
                        <h4 className="font-bold text-ink">Question Details</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label htmlFor={`quiz-q-en-${idx}`} className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Question (EN)</label>
                          <input
                            id={`quiz-q-en-${idx}`}
                            value={q.text.en}
                            onChange={(e) => {
                              const newQuiz = [...(formData.quiz || [])];
                              newQuiz[idx] = { ...q, text: { ...q.text, en: e.target.value } };
                              setFormData({ ...formData, quiz: newQuiz });
                            }}
                            className="w-full bg-white border border-black/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-ability-blue/30"
                          />
                        </div>
                        <div className="space-y-1">
                          <label htmlFor={`quiz-q-ml-${idx}`} className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Question (ML)</label>
                          <input
                            id={`quiz-q-ml-${idx}`}
                            value={q.text.ml}
                            onChange={(e) => {
                              const newQuiz = [...(formData.quiz || [])];
                              newQuiz[idx] = { ...q, text: { ...q.text, ml: e.target.value } };
                              setFormData({ ...formData, quiz: newQuiz });
                            }}
                            className="w-full bg-white border border-black/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-ability-blue/30"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Options (EN)</label>
                          {[0, 1, 2, 3].map(optIdx => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                id={`quiz-opt-en-${idx}-${optIdx}-radio`}
                                type="radio"
                                checked={q.correctIndex === optIdx}
                                onChange={() => {
                                  const newQuiz = [...(formData.quiz || [])];
                                  newQuiz[idx] = { ...q, correctIndex: optIdx };
                                  setFormData({ ...formData, quiz: newQuiz });
                                }}
                                className="w-4 h-4 text-ability-blue focus:ring-ability-blue"
                                aria-label={`Mark option ${optIdx + 1} as correct`}
                              />
                              <label htmlFor={`quiz-opt-en-${idx}-${optIdx}`} className="sr-only">Option {optIdx + 1} (EN)</label>
                              <input
                                id={`quiz-opt-en-${idx}-${optIdx}`}
                                placeholder={`Option ${optIdx + 1}`}
                                value={q.options.en?.[optIdx] || ''}
                                onChange={(e) => {
                                  const newQuiz = [...(formData.quiz || [])];
                                  const newOptions = [...(q.options.en || ['', '', '', ''])];
                                  newOptions[optIdx] = e.target.value;
                                  newQuiz[idx] = { ...q, options: { ...q.options, en: newOptions } };
                                  setFormData({ ...formData, quiz: newQuiz });
                                }}
                                className="flex-1 bg-white border border-black/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-ability-blue/30"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Options (ML)</label>
                          {[0, 1, 2, 3].map(optIdx => (
                            <div key={optIdx} className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded-full border-2 ${q.correctIndex === optIdx ? 'border-ability-blue bg-ability-blue' : 'border-black/5'}`} />
                              <label htmlFor={`quiz-opt-ml-${idx}-${optIdx}`} className="sr-only">Option {optIdx + 1} (ML)</label>
                              <input
                                id={`quiz-opt-ml-${idx}-${optIdx}`}
                                placeholder={`ഓപ്ഷൻ ${optIdx + 1}`}
                                value={q.options.ml?.[optIdx] || ''}
                                onChange={(e) => {
                                  const newQuiz = [...(formData.quiz || [])];
                                  const newOptions = [...(q.options.ml || ['', '', '', ''])];
                                  newOptions[optIdx] = e.target.value;
                                  newQuiz[idx] = { ...q, options: { ...q.options, ml: newOptions } };
                                  setFormData({ ...formData, quiz: newQuiz });
                                }}
                                className="flex-1 bg-white border border-black/5 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-ability-blue/30"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

              <div className="flex gap-4 pt-8 border-t border-black/5">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-ink text-white font-bold py-4 rounded-xl hover:bg-ability-blue transition-all shadow-lg flex items-center justify-center gap-2"
                  aria-label={editingId ? 'Update Module' : 'Save Module'}
                >
                  <Save className="w-5 h-5" />
                  {editingId ? 'Update Module' : 'Save Module'}
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                    setError(null);
                  }}
                  className="px-8 bg-paper text-zinc-500 font-bold py-4 rounded-xl hover:bg-zinc-100 transition-all border border-black/5"
                  aria-label="Cancel"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uniqueModules.map((m) => (
              <div key={m.id} className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col justify-between hover:border-ability-blue/30 transition-all shadow-sm group">
                <div className="space-y-4">
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-ability-blue/5 border border-ability-blue/10 flex items-center justify-center relative group/img">
                    <BookOpen className="w-12 h-12 text-ability-blue/20 group-hover:scale-110 transition-transform duration-500" />
                    {isGenerating && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-10">
                        <Loader2 className="w-6 h-6 text-ability-blue animate-spin" />
                        <p className="text-[8px] font-bold uppercase tracking-tighter text-ability-blue animate-pulse text-center px-2">
                          {loadingMessages[loadingMessageIndex]}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-ability-blue bg-ability-blue/5 px-2 py-0.5 rounded-md">
                        {m.category}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${m.level === 'basic' ? 'bg-green-50 text-green-600' : 'bg-purple-50 text-purple-600'}`}>
                        {m.level}
                      </span>
                    </div>
                    <h3 className="text-xl font-sans font-bold text-ink line-clamp-1">{m.title[language] || m.title.en}</h3>
                    
                    {quickEditingId === m.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={quickEditData.en}
                          onChange={(e) => setQuickEditData({ ...quickEditData, en: e.target.value })}
                          className="w-full bg-paper border border-black/5 rounded-xl p-2 text-xs h-16 focus:outline-none focus:border-ability-blue/30"
                          placeholder="English Description..."
                        />
                        <textarea
                          value={quickEditData.ml}
                          onChange={(e) => setQuickEditData({ ...quickEditData, ml: e.target.value })}
                          className="w-full bg-paper border border-black/5 rounded-xl p-2 text-xs h-16 focus:outline-none focus:border-ability-blue/30"
                          placeholder="മലയാളം വിവരണം..."
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={async () => {
                              try {
                                await moduleService.updateModule(m.id, { description: quickEditData });
                                setQuickEditingId(null);
                                setSuccess('Description updated!');
                                setTimeout(() => setSuccess(null), 2000);
                              } catch (err) {
                                setError('Failed to update description');
                              }
                            }}
                            className="flex-1 bg-ability-blue text-white text-[10px] font-bold uppercase py-1.5 rounded-lg"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setQuickEditingId(null)}
                            className="flex-1 bg-paper text-zinc-400 text-[10px] font-bold uppercase py-1.5 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 line-clamp-2 mt-1 min-h-[2.5rem]">
                        {m.description[language] || m.description.en}
                        <button
                          onClick={() => {
                            setQuickEditingId(m.id);
                            setQuickEditData({
                              en: m.description?.en || '',
                              ml: m.description?.ml || ''
                            });
                          }}
                          className="ml-2 text-ability-blue hover:underline font-bold"
                        >
                          Edit
                        </button>
                      </p>
                    )}

                    <div className="flex gap-4 mt-3 text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {m.lessons.length} Lessons</span>
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> {m.quiz.length} Questions</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-black/5">
                  <button
                    onClick={() => { setEditingId(m.id); setFormData(m); setIsAdding(true); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-paper text-ink rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-ability-blue hover:text-white transition-all border border-black/5"
                    aria-label={`Edit Module ${m.title.en}`}
                  >
                    <Edit2 className="w-4 h-4" /> Edit
                  </button>
                  <button
                    onClick={() => setConfirmDelete(m.id)}
                    className="p-2.5 bg-paper text-zinc-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-black/5"
                    aria-label={`Delete Module ${m.title.en}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : activeTab === 'results' ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-sans font-bold text-ink">
              {language === 'ml' ? 'കുട്ടികളുടെ ഫലങ്ങൾ' : 'Student Results'}
            </h2>
            <div className="px-4 py-2 bg-ability-blue/5 border border-ability-blue/10 rounded-xl text-ability-blue text-xs font-bold uppercase tracking-widest">
              Total Results: {results.length}
            </div>
          </div>

          <div className="grid gap-4">
            {results.length === 0 ? (
              <div className="p-16 text-center bg-paper rounded-[2rem] border-2 border-dashed border-black/5">
                <Info className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No results recorded yet</p>
              </div>
            ) : (
              results.map((res) => (
                <div key={res.id} className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-ability-blue/10 rounded-xl flex items-center justify-center text-ability-blue">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-ink">{res.studentName}</h3>
                      <p className="text-zinc-400 text-sm font-medium">{res.studentEmail}</p>
                    </div>
                  </div>

                  <div className="flex-1 md:px-12">
                    <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">
                      <BookOpen className="w-3 h-3" /> {res.moduleTitle}
                    </div>
                    <div className="w-full h-1.5 bg-paper rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${res.score / res.total >= 0.8 ? 'bg-green-500' : res.score / res.total >= 0.5 ? 'bg-ability-blue' : 'bg-amber-500'}`}
                        style={{ width: `${(res.score / res.total) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="text-3xl font-bold text-ink">{res.score}<span className="text-zinc-300 text-xl">/{res.total}</span></div>
                      <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Final Score</div>
                    </div>
                    <div className="h-10 w-px bg-black/5 hidden md:block" />
                    <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-bold uppercase tracking-widest">
                      <Calendar className="w-4 h-4" />
                      {new Date(res.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-sans font-bold text-ink">
              {language === 'ml' ? 'രജിസ്റ്റർ ചെയ്ത കുട്ടികൾ' : 'Registered Students'}
            </h2>
            <div className="px-4 py-2 bg-ability-blue/5 border border-ability-blue/10 rounded-xl text-ability-blue text-xs font-bold uppercase tracking-widest">
              Total Students: {users.length}
            </div>
          </div>

          <div className="grid gap-4">
            {users.length === 0 ? (
              <div className="p-16 text-center bg-paper rounded-[2rem] border-2 border-dashed border-black/5">
                <Users className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No students registered yet</p>
              </div>
            ) : (
              users.map((user) => {
                const userProgress = allProgress.filter(p => p.userId === user.uid);
                const completedModules = userProgress.filter(p => p.quizCompleted).length;
                const inProgressModules = userProgress.filter(p => !p.quizCompleted && p.completedLessons.length > 0).length;

                return (
                  <div key={user.uid} className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4 min-w-[240px]">
                      <div className="w-14 h-14 bg-paper rounded-2xl flex items-center justify-center text-ability-blue border border-black/5 shadow-sm">
                        <Users className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-ink tracking-tight">{user.fullName}</h3>
                        <p className="text-zinc-400 text-sm font-medium">{user.email}</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${user.role === 'admin' ? 'bg-amber-50 text-amber-600' : 'bg-ability-blue/5 text-ability-blue'}`}>
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-8">
                      <div className="text-center md:text-left">
                        <div className="text-2xl font-bold text-ink">{completedModules}</div>
                        <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">Completed</div>
                      </div>

                      <div className="text-center md:text-left">
                        <div className="text-2xl font-bold text-ability-blue">{inProgressModules}</div>
                        <div className="text-[10px] font-bold uppercase text-zinc-400 tracking-widest">In Progress</div>
                      </div>
                      
                      <div className="col-span-2 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase text-zinc-400 tracking-widest">
                          <span>Overall Progress</span>
                          <span className="text-ink">{modules.length > 0 ? Math.round((completedModules / modules.length) * 100) : 0}%</span>
                        </div>
                        <div className="w-full h-2 bg-paper rounded-full overflow-hidden border border-black/5">
                          <div 
                            className="h-full bg-ability-blue transition-all duration-1000 shadow-[0_0_10px_rgba(0,86,179,0.2)]" 
                            style={{ width: `${modules.length > 0 ? (completedModules / modules.length) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                        ID: {user.uid?.slice(-8)}
                      </div>
                      <button 
                        className="text-[10px] font-bold text-ability-blue uppercase tracking-widest hover:underline"
                        aria-label={`View details for student ${user.fullName}`}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  </div>
);
}
