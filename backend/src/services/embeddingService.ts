import axios from 'axios';
import { getSetting } from '../db/database';

export async function getEmbedding(text: string): Promise<number[]> {
    const url = getSetting('embedding_url') || 'http://localhost:11434';
    const model = getSetting('embedding_model') || 'qwen3-embedding:4b';

    try {
        const response = await axios.post(`${url}/api/embeddings`, {
            model,
            prompt: text
        });

        return response.data.embedding; // Ollama API returns embedding field
    } catch (error) {
        console.error('Ollama embedding error:', error);
        throw error;
    }
}
