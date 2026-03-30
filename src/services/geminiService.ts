import { GoogleGenAI, Modality, Type } from "@google/genai";
import { Language } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is missing. AI features will be disabled.");
      // Return a dummy object or handle it gracefully
    }
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });
  }
  return aiInstance;
}

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
  // TTS removed as per user request
}

export async function speakText(text: string, language: Language) {
  // TTS removed as per user request
}

export async function searchImage(query: string) {
  if (!query) return null;

  try {
    const response = await getAI().models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: `Find a professional, high-quality educational image for: "${query}".`,
          },
        ],
      },
      config: {
        tools: [
          {
            googleSearch: {
              searchTypes: {
                imageSearch: {},
              }
            },
          },
        ],
      },
    });

    // Extract image from grounding metadata or parts
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      for (const chunk of chunks) {
        if (chunk.web?.uri && (chunk.web.uri.endsWith('.jpg') || chunk.web.uri.endsWith('.png') || chunk.web.uri.includes('img'))) {
          return chunk.web.uri;
        }
      }
    }

    // Fallback to generated image if search fails or returns no direct links
    return await generateImage(query);
  } catch (error) {
    console.error("Image Search Error:", error);
    return await generateImage(query);
  }
}

export async function generateModuleContent(sourceText: string) {
  if (!sourceText) return null;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate and structure this educational content for a learning platform specifically designed for visually impaired children. 
      Input: ${sourceText}
      
      Provide a title and content in both English and Malayalam. 
      The content should be highly descriptive, clear, and educational. 
      Since the audience is visually impaired, focus on explaining concepts in a way that is easy to visualize through sound or touch. 
      Avoid visual-only references without explanation.`,
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
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3 multiple choice quiz questions about this topic: ${topic}.
      The questions are for visually impaired children, so make them clear and easy to understand when read aloud by a screen reader.
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
    const response = await getAI().models.generateContent({
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

export async function generateTitleFromImage(fileData: { data: string, mimeType: string }) {
  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { text: "Analyze this image and suggest a professional educational module title and a highly descriptive short description for it. The audience is visually impaired children, so the description should be vivid and explain the core concept clearly in a way that helps them understand what the module is about. Provide the response in both English and Malayalam." },
          { inlineData: fileData }
        ]
      },
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
            category: { type: Type.STRING }
          },
          required: ["title", "description", "category"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Image Analysis Error:", error);
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
      2. The target audience is visually impaired children. Ensure all content is highly descriptive, accessible, and avoids visual-only references.
      3. Provide a title in both English and Malayalam.
      4. Provide a highly descriptive short description (1-2 sentences) in both English and Malayalam that explains the concept clearly for a visually impaired student.
      5. Categorize it into a suitable category (e.g., Desktop, Taskbar, Start Menu, Notepad, Calculator, MS Word, Excel, PowerPoint, Internet, or a new relevant category).
      6. Set level as 'basic' or 'advanced'.
      7. Suggest a single English keyword for a relevant image (e.g., "computer keyboard", "internet browser").
      8. Create 2-4 detailed lessons. Each lesson must have a title and content in both English and Malayalam. The content should be vivid and descriptive.
      9. Create 3-5 multiple choice questions for a quiz. Each question must have text (EN/ML), 4 options (EN/ML), and the correct index (0-3).
      
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
      
      Ensure all Malayalam translations are natural, easy to understand, and descriptive for the visually impaired.
    `});

    const response = await getAI().models.generateContent({
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

export async function generateInteractiveExercise(lessonContent: string, language: Language) {
  if (!lessonContent) return null;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate an interactive exercise based on the following lesson content. 
      The exercise should be a "fill-in-the-blanks" or "matching-pairs" type, suitable for visually impaired children using screen readers.
      Provide the exercise in ${LANG_NAME[language]}.
      
      Lesson Content:
      ${lessonContent}
      
      Return a JSON object with the following structure:
      {
        "type": "fill-in-the-blanks" | "matching-pairs",
        "question": "The instruction for the exercise",
        "items": [
          // For fill-in-the-blanks: { "text": "The sky is ___", "answer": "blue", "options": ["red", "blue", "green"] }
          // For matching-pairs: { "left": "Apple", "right": "Fruit" }
        ]
      }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            question: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  answer: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  left: { type: Type.STRING },
                  right: { type: Type.STRING }
                }
              }
            }
          },
          required: ["type", "question", "items"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Exercise Generation Error:", error);
    return null;
  }
}

export async function validateAnswer(userAnswer: string, correctAnswer: string): Promise<boolean> {
  if (!userAnswer || !correctAnswer) return false;
  
  const normUser = userAnswer.toLowerCase().trim();
  const normCorrect = correctAnswer.toLowerCase().trim();
  
  if (normUser === normCorrect) return true;

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Compare these two answers for an educational quiz. 
      Answer 1 (User): "${userAnswer}"
      Answer 2 (Correct): "${correctAnswer}"
      
      Are they semantically the same? They might be in different languages (English vs Malayalam) or have slight variations in phrasing. 
      If Answer 1 is a correct translation or a very close synonym of Answer 2, return true. Otherwise return false.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN }
          },
          required: ["isCorrect"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return result.isCorrect;
    }
    return false;
  } catch (error) {
    console.error("Answer Validation Error:", error);
    return false;
  }
}
