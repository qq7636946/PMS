
import { GoogleGenAI, Type } from "@google/genai";
import { Task, Project, Status, Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-flash-preview';

// Helper to breakdown a vague task into subtasks
export const generateTaskBreakdown = async (taskTitle: string, projectContext: string): Promise<any[]> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `我有一個網頁設計/開發的任務：「${taskTitle}」。
      專案背景為：「${projectContext}」。
      請以「資深網頁專案經理」的角度，將此任務拆解為 3-5 個具體的執行子任務 (Subtasks)。
      請使用繁體中文回答。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "子任務名稱 (繁體中文)" },
              priority: { type: Type.STRING, enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH] }
            },
            required: ['title', 'priority']
          }
        }
      }
    });
    
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Breakdown Error:", error);
    return [];
  }
};

// Helper to analyze project risk
export const analyzeProjectRisks = async (project: Project): Promise<{ riskLevel: string; analysis: string }> => {
  try {
    const taskSummary = project.tasks.map(t => `- ${t.title} (${t.status}, ${t.priority})`).join('\n');
    const prompt = `
      請分析以下網頁設計專案的風險。
      專案名稱: ${project.name}
      目前階段: ${project.stage}
      描述: ${project.description}
      任務列表:
      ${taskSummary}
      備註: ${project.notes || '無'}
      
      請判斷整體風險等級 (Low, Medium, High)，並提供一句簡短的繁體中文分析建議 (針對目前階段: ${project.stage} 的特性，例如：設計階段注意確認客戶需求、前端階段注意RWD細節)。
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            analysis: { type: Type.STRING, description: "繁體中文的風險分析" }
          },
          required: ['riskLevel', 'analysis']
        }
      }
    });

    const text = response.text;
    if (!text) return { riskLevel: 'Low', analysis: '無法分析數據' };
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Risk Analysis Error:", error);
    return { riskLevel: 'Low', analysis: 'AI 服務暫時無法使用' };
  }
};

// Chat with Project Manager Assistant
export const chatWithProjectAssistant = async (history: {role: string, content: string}[], message: string, currentProject: Project | null) => {
    try {
        const systemInstruction = `你是融核實驗室，一位頂尖的網頁設計與軟體開發專案管理 AI 助手。
        目前日期: 2025-05-20。
        ${currentProject ? `目前專案: "${currentProject.name}"，階段: "${currentProject.stage}"，客戶: "${currentProject.clientName}"。` : '目前在儀表板總覽模式。'}
        
        請遵守以下規則：
        1. 始終使用「繁體中文」回答。
        2. 回答需簡潔、專業，並具備網頁設計 (UI/UX)、前端 (Frontend)、後端 (Backend) 的專業知識。
        3. 針對使用者的問題提供具體的行動建議，並考慮目前的專案階段 (例如在設計階段多建議 UI/UX 檢查)。`;

        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `使用者問題: ${message}`,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        return response.text || "抱歉，我無法處理該請求。";
    } catch (error) {
        console.error("Chat Error:", error);
        return "抱歉，連線至類神經網路時發生錯誤。";
    }
}
