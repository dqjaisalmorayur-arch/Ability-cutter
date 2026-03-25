import { GoogleGenAI, Modality } from "@google/genai";
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

export async function speakText(text: string, language: Language) {
  if (!text) return;

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
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      await audio.play();
    }
  } catch (error) {
    console.error("TTS Error:", error);
    // Fallback to browser TTS
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANG_MAP[language] || 'en-US';
    window.speechSynthesis.speak(utterance);
  }
}
