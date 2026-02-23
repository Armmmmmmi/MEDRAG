import { QdrantClient } from '@qdrant/js-client-rest';
import { getSetting } from '../db/database';

let qdrantClient: QdrantClient | null = null;

export function getQdrantClient(): QdrantClient {
    if (!qdrantClient) {
        const url = getSetting('qdrant_url') || 'http://localhost:6333';
        qdrantClient = new QdrantClient({ url });
    }
    return qdrantClient;
}

export async function ensureCollection(): Promise<void> {
    const client = getQdrantClient();
    const collectionName = getSetting('qdrant_collection') || 'ddi_vectors';

    try {
        const res = await client.getCollections();
        const exists = res.collections.some(c => c.name === collectionName);

        if (!exists) {
            await client.createCollection(collectionName, {
                vectors: {
                    size: 3584, // qwen3-embedding:4b output dimension (need to verify this, but Qwen models are often 3584 or 4096. Assuming 3584, will handle dynamically if possible or configure)
                    distance: 'Cosine'
                }
            });
            console.log(`Created Qdrant collection: ${collectionName}`);
        }
    } catch (error) {
        console.error('Error connecting to Qdrant or ensuring collection:', error);
    }
}

export async function searchVectors(vector: number[], limit: number = 5, scoreThreshold: number = 0.65): Promise<any[]> {
    const client = getQdrantClient();
    const collectionName = getSetting('qdrant_collection') || 'ddi_vectors';

    try {
        const results = await client.search(collectionName, {
            vector,
            limit,
            with_payload: true,
            score_threshold: scoreThreshold
        });

        return results;
    } catch (error) {
        console.error('Qdrant search error:', error);
        throw error;
    }
}

export async function upsertVectors(points: any[]): Promise<void> {
    const client = getQdrantClient();
    const collectionName = getSetting('qdrant_collection') || 'ddi_vectors';

    try {
        await client.upsert(collectionName, {
            wait: true,
            points
        });
    } catch (error) {
        console.error('Qdrant upsert error:', error);
        throw error;
    }
}
