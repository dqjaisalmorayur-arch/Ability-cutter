import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Language } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const LANG_MAP: Record<Language, string> = {
  en: 'en-US',
  ml: 'ml-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  kn: 'kn-IN',
  te: 'te-IN'
};

const LANG_NAME: Record<Language, string> = {
  en: 'English',
  ml: 'Malayalam',
  hi: 'Hindi',
  ta: 'Tamil',
  kn: 'Kannada',
  te: 'Telugu'
};

let currentAudio: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
}

export async function speakText(text: string, language: Language) {
  if (!text) return;
  
  stopSpeaking();

  try {
    const prompt = `Speak this ${LANG_NAME[language]} text clearly: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      currentAudio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      await currentAudio.play();
    }
  } catch (error) {
    console.error("TTS Error:", error);
    // Fallback to browser TTS
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[language] || 'en-US';
    window.speechSynthesis.speak(utterance);
  }
}

export async function generateModuleContent(sourceText: string) {
  if (!sourceText) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate and structure this educational content for a learning platform. 
      Input: ${sourceText}
      
      Provide a title and content in both English and Malayalam. 
      The content should be clear, educational, and suitable for students with disabilities.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.OBJECT,
              properties: {
                en: { type: Type.STRING },
                ml: { type: Type.STRING }
              },
              required: ["en", "ml"]
            },
            content: {
              type: Type.OBJECT,
              properties: {
                en: { type: Type.STRING },
                ml: { type: Type.STRING }
              },
              required: ["en", "ml"]
            }
          },
          required: ["title", "content"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Generation Error:", error);
    return null;
  }
}

export async function generateQuizQuestions(topic: string) {
  if (!topic) return null;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3 multiple choice quiz questions about this topic: ${topic}.
      Provide them in both English and Malayalam.
      Each question must have 4 options and a correct index (0-3).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: {
                type: Type.OBJECT,
                properties: {
                  en: { type: Type.STRING },
                  ml: { type: Type.STRING }
                },
                required: ["en", "ml"]
              },
              options: {
                type: Type.OBJECT,
                properties: {
                  en: { type: Type.ARRAY, items: { type: Type.STRING } },
                  ml: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["en", "ml"]
              },
              correctIndex: { type: Type.NUMBER }
            },
            required: ["text", "options", "correctIndex"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Quiz Generation Error:", error);
    return null;
  }
}

export async function generateImage(prompt: string) {
  if (!prompt) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `Generate a professional, clean, and modern educational illustration for a learning module titled: "${prompt}". The style should be high-quality digital art, minimalistic, and suitable for a dark-themed learning platform. Avoid text in the image.`,
          },
        ],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Image Generation Error:", error);
    return null;
  }
}

export async function generateFullModuleFromText(sourceText?: string, fileData?: { data: string, mimeType: string }) {
  if (!sourceText && !fileData) return null;

  try {
    const parts: any[] = [];
    
    parts.push({ text: "You are an expert educational content creator. Your task is to analyze the provided content and create a structured educational module." });

    if (sourceText) {
      parts.push({ text: `SOURCE CONTENT:\n${sourceText}` });
    }
    
    if (fileData) {
      parts.push({ text: "Analyze the attached file content to create the module." });
      parts.push({ inlineData: fileData });
    }

    parts.push({ text: `
      INSTRUCTIONS:
      1. Create a complete educational module based on the source content.
      2. Provide a title in both English and Malayalam.
      3. Provide a short description (1-2 sentences) in both English and Malayalam.
      4. Categorize it into a suitable category (e.g., Desktop, Taskbar, Start Menu, Notepad, Calculator, MS Word, Excel, PowerPoint, Internet, or a new relevant category).
      5. Set level as 'basic' or 'advanced'.
      6. Suggest a single English keyword for a relevant image (e.g., "computer keyboard", "internet browser").
      7. Create 2-4 detailed lessons. Each lesson must have a title and content in both English and Malayalam.
      8. Create 3-5 multiple choice questions for a quiz. Each question must have text (EN/ML), 4 options (EN/ML), and the correct index (0-3).
      
      OUTPUT FORMAT:
      You MUST respond with a valid JSON object following this structure:
      {
        "title": { "en": "...", "ml": "..." },
        "description": { "en": "...", "ml": "..." },
        "category": "...",
        "level": "basic" | "advanced",
        "suggestedImageKeyword": "...",
        "lessons": [
          { "title": { "en": "...", "ml": "..." }, "content": { "en": "...", "ml": "..." } }
        ],
        "quiz": [
          { 
            "text": { "en": "...", "ml": "..." }, 
            "options": { "en": ["...", "...", "...", "..."], "ml": ["...", "...", "...", "..."] }, 
            "correctIndex": 0
          }
        ]
      }
      
      Ensure all Malayalam translations are natural and easy to understand.
    `});

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.OBJECT,
              properties: {
                en: { type: Type.STRING },
                ml: { type: Type.STRING }
              },
              required: ["en", "ml"]
            },
            description: {
              type: Type.OBJECT,
              properties: {
                en: { type: Type.STRING },
                ml: { type: Type.STRING }
              },
              required: ["en", "ml"]
            },
            category: { type: Type.STRING },
            level: { type: Type.STRING },
            suggestedImageKeyword: { type: Type.STRING },
            lessons: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.OBJECT,
                    properties: {
                      en: { type: Type.STRING },
                      ml: { type: Type.STRING }
                    },
                    required: ["en", "ml"]
                  },
                  content: {
                    type: Type.OBJECT,
                    properties: {
                      en: { type: Type.STRING },
                      ml: { type: Type.STRING }
                    },
                    required: ["en", "ml"]
                  }
                },
                required: ["title", "content"]
              }
            },
            quiz: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: {
                    type: Type.OBJECT,
                    properties: {
                      en: { type: Type.STRING },
                      ml: { type: Type.STRING }
                    },
                    required: ["en", "ml"]
                  },
                  options: {
                    type: Type.OBJECT,
                    properties: {
                      en: { type: Type.ARRAY, items: { type: Type.STRING } },
                      ml: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["en", "ml"]
                  },
                  correctIndex: { type: Type.NUMBER }
                },
                required: ["text", "options", "correctIndex"]
              }
            }
          },
          required: ["title", "category", "level", "lessons", "quiz"]
        }
      }
    });

    if (response.text) {
      const cleanedText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
      try {
        return JSON.parse(cleanedText);
      } catch (e) {
        console.error("JSON Parse Error:", e, cleanedText);
        // Try to extract JSON if it's wrapped in markdown or has extra text
        const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (innerError) {
            console.error("Inner JSON Parse Error:", innerError);
          }
        }
        
        // If it still fails, try to fix common JSON issues like trailing commas
        try {
          const fixedJson = cleanedText
            .replace(/,\s*([\]\}])/g, '$1') // Remove trailing commas
            .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // Ensure keys are quoted
          return JSON.parse(fixedJson);
        } catch (finalError) {
          console.error("Final JSON Parse Error:", finalError);
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Full Module Generation Error:", error);
    return null;
  }
}
