import { GoogleGenAI, Modality } from "@google/genai";
import { MindMapData } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface ExplanationResponse {
  centralTopic: string;
  english: string;
  arabic: string;
}

export interface TopicExplanationResponse {
  english: string;
  arabic: string;
}

const fallbackResponse: ExplanationResponse = {
  centralTopic: "Error",
  english: "Sorry, I couldn't generate an explanation for the mind map.",
  arabic: "عذراً، لم أتمكن من إنشاء شرح للخريطة الذهنية."
};

const fallbackImageResponse: ExplanationResponse = {
  ...fallbackResponse,
  english: "Sorry, I couldn't analyze the mind map image.",
  arabic: "عذراً، لم أتمكن من تحليل صورة الخريطة الذهنية."
};

const fallbackTopicResponse: TopicExplanationResponse = {
    english: "Sorry, I couldn't generate an explanation for this topic.",
    arabic: "عذراً، لم أتمكن من إنشاء شرح لهذا الموضوع."
};


export const generateMindMapExplanation = async (mindMapData: MindMapData): Promise<ExplanationResponse> => {
  const prompt = `
    You are an accessibility expert creating an exceptionally detailed audio description for a visually impaired user.
    Your work is of the utmost importance, as if a life depends on its clarity and completeness.
    Analyze the provided mind map data. Based on this data, provide an exhaustive, vivid, and highly descriptive walkthrough.
    Start with an introduction to the central topic. Then, for each main branch, describe it in detail and then meticulously explain each of its sub-nodes, one by one.
    Elaborate on the relationships and the hierarchy, using rich language to create a strong mental image.
    Leave no node unexplained. Be thorough and clear.
    
    You must provide two versions of this description: one in English and one in Arabic.

    Your response MUST be a single, valid JSON object containing three keys:
    1. "centralTopic": A string containing the central topic, which is '${mindMapData.centralTopic}'.
    2. "english": A string containing the full description in English.
    3. "arabic": A string containing the full description in Arabic.

    Do not include any other text, explanations, or markdown formatting outside of this JSON object.

    Mind Map Data: ${JSON.stringify(mindMapData)}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating mind map explanation:", error);
    return fallbackResponse;
  }
};

export const generateMindMapExplanationFromImage = async (base64Image: string, mimeType: string): Promise<ExplanationResponse> => {
  const prompt = `
    You are an accessibility expert creating an exceptionally detailed audio description for a visually impaired user.
    Your work is of the utmost importance, as if a life depends on its clarity and completeness.
    Analyze the provided mind map image.

    Your task is to:
    1. Identify the central topic of the mind map from the image.
    2. Generate an exhaustive, vivid, and highly descriptive walkthrough of the mind map. Start with an introduction to the central topic, then describe each main branch and its sub-nodes in detail. Elaborate on relationships and hierarchy. Leave no node unexplained.
    3. Create this description in BOTH English and Arabic. Auto-detect the original language in the image to ensure the content is correctly interpreted, but provide the final output in both specified languages.

    Your response MUST be a single, valid JSON object containing three keys:
    1. "centralTopic": A string containing the central topic you identified.
    2. "english": A string containing the full description in English.
    3. "arabic": A string containing the full description in Arabic.

    Do not include any other text, explanations, or markdown formatting outside of this JSON object.
  `;

  const imagePart = {
    inlineData: {
      data: base64Image,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: prompt,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
       config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating explanation from image:", error);
    return fallbackImageResponse;
  }
};

export const generateTopicExplanation = async (centralTopic: string): Promise<TopicExplanationResponse> => {
  const prompt = `
    You are an expert educator with a talent for making complex subjects easy to understand.
    Explain the topic of "${centralTopic}" in a clear, detailed, and accessible manner.
    Assume the audience has no prior knowledge of the subject. Your explanation should be comprehensive, engaging, and easy to follow.
    Provide the explanation in both English and Arabic.

    Your response MUST be a single, valid JSON object with two keys:
    1. "english": A string containing the full explanation in English.
    2. "arabic": A string containing the full explanation in Arabic.
    
    Do not include any other text, explanations, or markdown formatting outside of this JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating topic explanation:", error);
    return fallbackTopicResponse;
  }
};


export const generateSpeech = async (text: string): Promise<{ audio: string | null; error: string | null; }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
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
      return { audio: base64Audio, error: null };
    } else {
      return { audio: null, error: "The AI could not generate audio for the provided text. The description is available to read." };
    }
  } catch (error) {
    console.error("Error generating speech:", error);
    return { audio: null, error: "Speech generation failed due to a network or API error. Please check your connection and try again." };
  }
};

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length;
  const buffer = ctx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}
