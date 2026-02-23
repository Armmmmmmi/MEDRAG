import { Request, Response } from 'express';
import { getDb } from '../db/database';
import { getEmbedding } from '../services/embeddingService';
import { searchVectors } from '../services/qdrantService';
import { generateText } from '../services/generationService';

function convertRecordToContext(record: any): string {
    if (!record) return '';

    return `Drug A: ${record.drugA || 'ไม่ระบุ'}
Drug B: ${record.drugB || 'ไม่ระบุ'}
Significance: ${record.significance || 'ไม่ระบุ'}
Onset: ${record.onset || 'ไม่ระบุ'}
Severity: ${record.severity || 'ไม่ระบุ'}
Documentation: ${record.documentation || 'ไม่ระบุ'}
Effect: ${record.effect || 'ไม่ระบุ'}
Mechanism: ${record.mechanism || 'ไม่ระบุ'}
Management: ${record.management || 'ไม่ระบุ'}
Discussion: ${record.ddisscuss || 'ไม่ระบุ'}
Bibliography: ${record.dbiblio || 'ไม่ระบุ'}
Reference: ${record.reference || 'ไม่ระบุ'}
Source: ${record.source || 'ไม่ระบุ'}`;
}

const SYSTEM_PROMPT = `คุณคือผู้เชี่ยวชาญด้านเภสัชกรรม (Clinical Pharmacist)
หน้าที่ของคุณคือสรุปข้อมูลปฏิกิริยาระหว่างยา (Drug-Drug Interaction) ให้อ่านง่าย กระชับ และเป็นภาษาไทย
ห้ามคิดข้อมูลขึ้นเองเด็ดขาด ให้ใช้ข้อมูลจาก Context ที่ให้มาเท่านั้น
หากข้อมูลใดไม่มีใน Context ให้ระบุว่า "ไม่ระบุ"
ให้ตอบกลับในรูปแบบหัวข้อที่จัดเรียงชัดเจน คือ:
- ความรุนแรง (Severity)
- ผลที่เกิดขึ้น (Effect)
- กลไก (Mechanism)
- การจัดการ (Management)
`;

export const getSingleInteraction = async (req: Request, res: Response) => {
    try {
        const { drugA, drugB } = req.body;

        if (!drugA || !drugB) {
            return res.status(400).json({ status: 'error', message: 'Missing drugA or drugB in request body' });
        }

        const drugA_lower = drugA.toLowerCase().trim();
        const drugB_lower = drugB.toLowerCase().trim();

        // 1. Exact Match in SQLite
        const db = getDb();
        const exactMatch = db.prepare(`
      SELECT * FROM interaction_records 
      WHERE (LOWER(drugA) = ? AND LOWER(drugB) = ?) 
         OR (LOWER(drugA) = ? AND LOWER(drugB) = ?)
    `).get(drugA_lower, drugB_lower, drugB_lower, drugA_lower) as any;

        let contextStr = '';
        let similarityScore = 1.0; // Exact match = 1.0

        if (exactMatch) {
            contextStr = convertRecordToContext(exactMatch);
        } else {
            // 2. Vector Search in Qdrant if no exact match
            // Construct a query text from the two drugs
            const queryText = `${drugA_lower} and ${drugB_lower} interaction severity effect mechanism management`;

            const queryVector = await getEmbedding(queryText);

            // Threshold is 0.65 as per PRD
            const searchResults = await searchVectors(queryVector, 1, 0.65);

            if (searchResults && searchResults.length > 0) {
                const bestMatch = searchResults[0];
                similarityScore = bestMatch.score;
                contextStr = convertRecordToContext(bestMatch.payload);
            }
        }

        // 3. Fallback or LLM Generation
        let rawResponse = '';

        if (!contextStr) {
            rawResponse = 'ไม่พบข้อมูลในฐานข้อมูล (No interaction found)';
            similarityScore = 0.0;
        } else {
            // Prompt construction
            const fullPrompt = `${SYSTEM_PROMPT}\n\nคำถาม: ข้อมูลปฏิกิริยาระหว่างยา ${drugA} และ ${drugB} คืออะไร?`;
            rawResponse = await generateText(fullPrompt, contextStr);
        }

        return res.json({
            status: 'success',
            data: {
                rawResponse,
                retrievedContext: contextStr,
                similarityScore
            }
        });

    } catch (error: any) {
        console.error('getSingleInteraction error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
