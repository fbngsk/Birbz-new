import { GoogleGenAI } from "@google/genai";
import { IdentificationResult, VacationBirdResult } from "../types";

let ai: GoogleGenAI | null = null;

try {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API Key is missing. Add VITE_GEMINI_API_KEY to your .env file.");
  }
} catch (e) {
  console.warn("Gemini API Key setup failed:", e);
}

const SYSTEM_PROMPT = "Du bist ein Experte für Ornithologie in Deutschland. Deine Aufgabe ist es, Vögel präzise zu identifizieren. Antworte AUSSCHLIESSLICH mit dem exakten deutschen Vogelnamen (z.B. 'Amsel', 'Kohlmeise', 'Buchfink'). Keine Sätze, keine Lateinischen Namen, keine Erklärungen.";

const GLOBAL_BIRD_PROMPT = "Du bist ein Experte für weltweite Ornithologie. Identifiziere den Vogel auf diesem Bild. Antworte AUSSCHLIESSLICH mit einem validen JSON-Objekt im Format: {\"name\": \"Deutscher Name\", \"sciName\": \"Wissenschaftlicher Name\"}. Beispiel: {\"name\": \"Sekretär\", \"sciName\": \"Sagittarius serpentarius\"}. Wenn kein Vogel erkennbar ist, antworte mit {\"name\": \"Unbekannt\", \"sciName\": \"\"}. Kein Markdown, kein Text davor oder danach.";

export const identifyBirdFromDescription = async (description: string): Promise<string> => {
    if (!ai) return "KI nicht verfügbar";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Identifiziere den Vogel basierend auf dieser Beschreibung: "${description}". ${SYSTEM_PROMPT}. Wenn du dir nicht sicher bist, antworte mit 'Unbekannt'.`
        });
        return response.text?.trim() || "Unbekannt";
    } catch (error) {
        return "Fehler bei der Analyse";
    }
};

export const identifyBirdFromImage = async (base64Image: string): Promise<string | null> => {
    if (!ai) {
        console.warn("No AI instance found");
        return null;
    }

    try {
        // Clean base64 string if it contains header
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [
                    { text: "Welcher Vogel ist auf diesem Bild zu sehen? " + SYSTEM_PROMPT + " Wenn du dir nicht sicher bist oder kein Vogel zu erkennen ist, antworte mit 'Unbekannt'." },
                    { 
                        inlineData: { 
                            mimeType: 'image/jpeg', 
                            data: cleanBase64 
                        } 
                    }
                ]
            }
        });

        const result = response.text?.trim();
        console.log("Gemini Image ID Result:", result);

        if (!result || result.toLowerCase().includes('unbekannt')) return null;
        
        // Clean up potential formatting issues (e.g. "Das ist eine Amsel" -> "Amsel")
        return result.replace(/\.$/, ''); 
    } catch (error) {
        console.error("Image Analysis Failed:", error);
        return null;
    }
};

export const identifyBirdFromAudio = async (base64Audio: string): Promise<IdentificationResult[]> => {
    if (!ai) {
        console.warn("No AI instance found");
        return [];
    }

    try {
        // Clean base64 string if it contains header
        const cleanBase64 = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [
                    { text: `Analysiere diese Audioaufnahme auf Vogelstimmen. Es könnten mehrere Vögel gleichzeitig singen.
                    
                    Antworte AUSSCHLIESSLICH mit einem validen JSON-Array. 
                    Format: [{"name": "Deutscher Vogelname", "confidence": "hoch" | "mittel" | "niedrig"}]
                    
                    Beispiel: [{"name": "Amsel", "confidence": "hoch"}, {"name": "Kohlmeise", "confidence": "mittel"}]
                    
                    Wenn KEIN Vogel zu hören ist, antworte mit einem leeren Array: [].
                    Kein Markdown, kein Text davor oder danach.` 
                    },
                    { 
                        inlineData: { 
                            mimeType: 'audio/webm', 
                            data: cleanBase64 
                        } 
                    }
                ]
            }
        });
        
        const text = response.text?.trim();
        console.log("Gemini Audio ID Raw:", text);
        
        if (!text) return [];

        // Remove Markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const results: IdentificationResult[] = JSON.parse(jsonStr);
            return results;
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            return [];
        }

    } catch (error) {
        console.error("Audio Analysis Failed:", error);
        return [];
    }
};

export const identifyBirdGlobal = async (base64Image: string): Promise<VacationBirdResult | null> => {
    if (!ai) {
        console.warn("No AI instance found");
        return null;
    }

    try {
        const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                role: 'user',
                parts: [
                    { text: GLOBAL_BIRD_PROMPT },
                    { 
                        inlineData: { 
                            mimeType: 'image/jpeg', 
                            data: cleanBase64 
                        } 
                    }
                ]
            }
        });

        const text = response.text?.trim();
        console.log("Gemini Global Bird ID Result:", text);

        if (!text) return null;

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const result: VacationBirdResult = JSON.parse(jsonStr);
            if (result.name === 'Unbekannt' || !result.name) return null;
            return result;
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            return null;
        }
    } catch (error) {
        console.error("Global Bird Analysis Failed:", error);
        return null;
    }
};
