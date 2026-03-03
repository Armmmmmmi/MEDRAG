import axios from 'axios';
import { getSetting } from '../db/database';

export async function generateText(prompt: string, context?: string): Promise<string> {
    const url = getSetting('generation_url') || 'http://localhost:11434';
    const model = getSetting('generation_model') || 'MedAIBase/MedGemma1.5:4b';

    // Format prompt based on whether context is provided
    let fullPrompt = prompt;
    if (context) {
        fullPrompt = `ใช้ข้อมูลจาก Context ด้านล่างนี้ในการตอบคำถามเท่านั้น หากไม่มีข้อมูลใน Context ให้ตอบว่า "ไม่พบข้อมูลในฐานข้อมูล"\n\nContext:\n${context}\n\nคำถาม:\n${prompt}`;
    }

    try {
        const response = await axios.post(`${url}/api/generate`, {
            model,
            prompt: fullPrompt,
            stream: false
        }, {
            timeout: 1800000 // 30 mins timeout for slow LLM responses
        });

        return response.data.response;
    } catch (error) {
        console.error('Ollama generation error:', error);
        throw error;
    }
}
