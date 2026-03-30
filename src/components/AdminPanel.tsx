import React, { useState, useEffect } from 'react';
import { Module, Language, Lesson, Question, QuizResult, UserProgress } from '../types';
import { moduleService } from '../services/moduleService';
import { generateModuleContent, generateQuizQuestions, generateFullModuleFromText, generateImage, generateTitleFromImage } from '../services/geminiService';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, Edit2, Users, BookOpen, Calendar, ChevronLeft, Sparkles, Loader2, FileText, Upload, Database, Info, Music, Play, Pause, CheckCircle, Image as ImageIcon } from 'lucide-react';
// import * as mammoth from 'mammoth';
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
  const [uploadingAudio, setUploadingAudio] = useState<number | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (jpg, png, etc.)');
      return;
    }

    setUploadingImage(true);
    setError(null);

    try {
      const storageRef = ref(storage, `modules/images/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Convert image to base64 for AI analysis
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Analyze image with AI to suggest title/description
      const analysis = await generateTitleFromImage({ data: base64Data, mimeType: file.type });
      
      if (analysis) {
        setFormData({
          ...formData,
          imageUrl: downloadURL,
          title: analysis.title,
          description: analysis.description,
          category: analysis.category || formData.category
        });
      } else {
        setFormData({ ...formData, imageUrl: downloadURL });
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setError('Failed to upload image file. Please try again.');
    } finally {
      setUploadingImage(null);
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
        const text = "Mammoth disabled for testing"; // mammothResult.value;
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
      const finalData = { ...formData };
      if (!finalData.imageUrl) {
        finalData.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(formData.title?.en || 'module')}/800/600`;
      }

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
          className="flex items-center gap-2 text-zinc-400 hover:text-ability-blue font-bold uppercase tracking-widest transition-all group"
          aria-label={language === 'ml' ? 'ഡാഷ്ബോർഡിലേക്ക് തിരികെ പോവുക' : 'Back to Dashboard'}
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>{language === 'ml' ? 'തിരികെ പോവുക' : 'Back to Dashboard'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-black/5 w-fit shadow-sm">
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'modules' ? 'bg-ability-blue text-white shadow-md' : 'text-zinc-400 hover:text-ink'}`}
          aria-label={language === 'ml' ? 'മൊഡ്യൂളുകൾ ടാബ്' : 'Modules Tab'}
          aria-pressed={activeTab === 'modules'}
        >
          <BookOpen className="w-4 h-4" />
          {language === 'ml' ? 'മൊഡ്യൂളുകൾ' : 'Modules'}
        </button>
        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'results' ? 'bg-ability-blue text-white shadow-md' : 'text-zinc-400 hover:text-ink'}`}
          aria-label={language === 'ml' ? 'ഫലങ്ങൾ ടാബ്' : 'Results Tab'}
          aria-pressed={activeTab === 'results'}
        >
          <FileText className="w-4 h-4" />
          {language === 'ml' ? 'ഫലങ്ങൾ' : 'Results'}
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${activeTab === 'students' ? 'bg-ability-blue text-white shadow-md' : 'text-zinc-400 hover:text-ink'}`}
          aria-label={language === 'ml' ? 'കുട്ടികൾ ടാബ്' : 'Students Tab'}
          aria-pressed={activeTab === 'students'}
        >
          <Users className="w-4 h-4" />
          {language === 'ml' ? 'കുട്ടികൾ' : 'Students'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center justify-between shadow-sm" role="alert">
          <span className="font-medium">{error}</span>
          <button onClick={() => setError(null)} aria-label="Dismiss error"><X className="w-4 h-4" /></button>
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
                    const modulesToFix = modules.filter(m => !m.imageUrl);
                    for (const m of modulesToFix) {
                      await moduleService.updateModule(m.id, {
                        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(m.title.en)}/800/600`
                      });
                    }
                    alert(`Fixed images for ${modulesToFix.length} modules!`);
                  } catch (err) {
                    console.error('Error fixing images:', err);
                    setError('Failed to fix module images.');
                  } finally {
                    setIsGenerating(false);
                  }
                }}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-3 bg-white text-zinc-400 rounded-2xl font-bold hover:text-ability-blue transition-all border border-black/5 shadow-sm disabled:opacity-50"
                title="Fix Missing Images"
                aria-label="Fix Missing Images"
              >
                <Sparkles className="w-5 h-5" />
                <span className="hidden sm:inline">Fix Images</span>
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
              {/* Quick Upload Option */}
              {!editingId && (
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
                  <label className="inline-flex items-center gap-2 px-6 py-3 bg-ability-blue text-white rounded-xl font-bold hover:opacity-90 transition-all cursor-pointer shadow-md active:scale-95">
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    <span>{language === 'ml' ? 'ഫയൽ തിരഞ്ഞെടുക്കുക' : 'Select File'}</span>
                    <input type="file" className="hidden" accept=".txt,.doc,.docx,.pdf,.rtf,.odt,.note" onChange={handleFileUpload} disabled={isGenerating} />
                  </label>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="title-en" className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Title (English)</label>
                    <button
                      onClick={() => handleAutoGenerate('module')}
                      disabled={isGenerating}
                      className="flex items-center gap-1 text-[10px] font-bold uppercase text-ability-blue hover:opacity-70 transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Auto-Generate
                    </button>
                  </div>
                  <input
                    id="title-en"
                    type="text"
                    value={formData.title?.en}
                    onChange={(e) => setFormData({ ...formData, title: { ...formData.title, en: e.target.value } })}
                    className="w-full bg-paper border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:border-ability-blue/30"
                    placeholder="Enter English title"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="title-ml" className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Title (Malayalam)</label>
                  <input
                    id="title-ml"
                    type="text"
                    value={formData.title?.ml}
                    onChange={(e) => setFormData({ ...formData, title: { ...formData.title, ml: e.target.value } })}
                    className="w-full bg-paper border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:border-ability-blue/30"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="desc-en" className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Description (English)</label>
                  <textarea
                    id="desc-en"
                    value={formData.description?.en}
                    onChange={(e) => setFormData({ ...formData, description: { ...formData.description, en: e.target.value } })}
                    className="w-full bg-paper border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:border-ability-blue/30 h-20"
                    placeholder="Short description for dashboard"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="desc-ml" className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Description (Malayalam)</label>
                  <textarea
                    id="desc-ml"
                    value={formData.description?.ml}
                    onChange={(e) => setFormData({ ...formData, description: { ...formData.description, ml: e.target.value } })}
                    className="w-full bg-paper border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:border-ability-blue/30 h-20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="category" className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Category</label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-paper border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:border-ability-blue/30 appearance-none"
                  >
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="level" className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Level</label>
                  <select
                    id="level"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-full bg-paper border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:border-ability-blue/30"
                  >
                    <option value="basic">Basic</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Module Image</label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleGenerateImage}
                        disabled={isGenerating || uploadingImage}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase text-ability-blue hover:opacity-70 transition-colors disabled:opacity-50"
                        aria-label="Generate Image with AI"
                      >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        Generate with AI
                      </button>
                      <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-ability-blue hover:opacity-70 transition-colors cursor-pointer disabled:opacity-50" aria-label="Upload Custom Photo">
                        {uploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                        Upload Custom Photo
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage || isGenerating} />
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-2">
                      <label htmlFor="image-url" className="sr-only">Image URL</label>
                      <input
                        id="image-url"
                        type="text"
                        value={formData.imageUrl || ''}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                        className="w-full bg-paper border border-black/5 rounded-xl px-4 py-3 focus:outline-none focus:border-ability-blue/30"
                        placeholder="Image URL or upload a file"
                      />
                      <p className="text-[10px] text-zinc-400 italic">
                        {language === 'ml' 
                          ? 'ഫോട്ടോ അപ്‌ലോഡ് ചെയ്താൽ ടൈറ്റിലും ഡിസ്ക്രിപ്ഷനും AI ഓട്ടോമാറ്റിക്കായി തയ്യാറാക്കും.' 
                          : 'Uploading a photo will automatically suggest a title and description using AI.'}
                      </p>
                    </div>
                    {formData.imageUrl && (
                      <div className="w-32 h-32 rounded-2xl border border-black/5 overflow-hidden bg-paper flex-shrink-0 shadow-md group relative">
                        <img 
                          src={formData.imageUrl} 
                          alt={`Preview of ${formData.title?.en || 'module'}`} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <ImageIcon className="text-white w-6 h-6" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Lessons Section */}
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
                        <button
                          onClick={() => handleAutoGenerate('lesson', idx)}
                          disabled={isGenerating}
                          className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase text-ability-blue hover:opacity-70 transition-colors disabled:opacity-50"
                          aria-label="Generate Lesson Content with AI"
                        >
                          {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                          Generate Content
                        </button>
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

              {/* Quiz Section */}
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
            {modules.map((m) => (
              <div key={m.id} className="bg-white border border-black/5 rounded-2xl p-6 flex flex-col justify-between hover:border-ability-blue/30 transition-all shadow-sm group">
                <div className="space-y-4">
                  <div className="w-full aspect-video rounded-xl overflow-hidden bg-paper border border-black/5">
                    <img 
                      src={m.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(m.title.en)}/800/600`} 
                      alt={`Cover image for module ${m.title.en}`} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
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
  );
}
