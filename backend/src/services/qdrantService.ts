import { QdrantClient } from '@qdrant/js-client-rest';
import { getSetting } from '../db/database';
import { getEmbedding } from './embeddingService';

export function getQdrantClient(): QdrantClient {
    const url = getSetting('qdrant_url') || 'http://localhost:6333';
    return new QdrantClient({ url });
}

export async function ensureCollection(): Promise<void> {
    const client = getQdrantClient();
    const collectionName = getSetting('qdrant_collection') || 'ddi_vectors';

    try {
        const res = await client.getCollections();
        const exists = res.collections.some(c => c.name === collectionName);

        if (!exists) {
            console.log('Detecting vector size from embedding model...');
            // Fetch a small embedding to determine the size dynamically
            const dummyVector = await getEmbedding('test');
            const dimSize = dummyVector.length;
            console.log(`Detected vector size: ${dimSize}`);

            await client.createCollection(collectionName, {
                vectors: {
                    size: dimSize,
                    distance: 'Cosine'
                }
            });
            console.log(`Created Qdrant collection: ${collectionName} with size ${dimSize}`);
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
