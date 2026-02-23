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
Discussion: ${record.ddisscuss || 'ไม่ระบุ'}`;
}

const EXTRACT_PROMPT = `สกัดชื่อยาภาษาอังกฤษ (Generic name หรือ Trade name) จากข้อความต่อไปนี้ หากพบให้ตอบกลับเป็นรายชื่อยา โดยคั่นแต่ละชื่อด้วยเครื่องหมายจุลภาค (,) เท่านั้น ห้ามตอบอย่างอื่นนอกจากรายชื่อยา\n\nข้อความ: `;

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

export const getMultiInteraction = async (req: Request, res: Response) => {
    try {
        const { text } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ status: 'error', message: 'Missing text in request body' });
        }

        // 1. Extract drug names
        let normalizedDrugs: string[] = [];
        try {
            const extractedStr = await generateText(EXTRACT_PROMPT + text);
            normalizedDrugs = extractedStr
                .split(',')
                .map(d => d.trim().replace(/[^a-zA-Z0-9- ]/g, ''))
                .filter(d => d.length > 2);
        } catch (e) {
            console.error('LLM Extraction failed, falling back to regex');
        }

        // Fallback if LLM extraction fails or returns weird
        if (normalizedDrugs.length < 2) {
            // Basic regex to pull english words that look like drugs
            const match = text.match(/[a-zA-Z0-9-]{3,}/g);
            if (match) {
                normalizedDrugs = [...new Set(match.map(d => d.trim()))];
            }
        }

        // Final dedupe and lowercasing for internal checks, but keep display case
        normalizedDrugs = [...new Set(normalizedDrugs)].slice(0, 15); // Limit max 15 drugs to prevent overload

        if (normalizedDrugs.length < 2) {
            return res.json({
                status: 'success',
                data: {
                    normalizedDrugs,
                    results: []
                }
            });
        }

        // 2. nC2 pair generation
        const pairs: [string, string][] = [];
        for (let i = 0; i < normalizedDrugs.length; i++) {
            for (let j = i + 1; j < normalizedDrugs.length; j++) {
                pairs.push([normalizedDrugs[i], normalizedDrugs[j]]);
            }
        }

        // 3. Process pairs
        const db = getDb();
        const results = [];

        for (const [drugA, drugB] of pairs) {
            const aLower = drugA.toLowerCase();
            const bLower = drugB.toLowerCase();

            let contextStr = '';
            let similarityScore = 1.0;
            let candidate = false; // Is this pair a candidate for generation? >= 0.70 threshold

            const exactMatch = db.prepare(`
        SELECT * FROM interaction_records 
        WHERE (LOWER(drugA) = ? AND LOWER(drugB) = ?) 
           OR (LOWER(drugA) = ? AND LOWER(drugB) = ?)
      `).get(aLower, bLower, bLower, aLower) as any;

            if (exactMatch) {
                contextStr = convertRecordToContext(exactMatch);
                candidate = true;
            } else {
                const queryText = `${aLower} and ${bLower} interaction severity effect mechanism management`;
                const queryVector = await getEmbedding(queryText);

                // Use threshold 0.70 for multi-drug as per PRD
                const searchResults = await searchVectors(queryVector, 1, 0.70);

                if (searchResults && searchResults.length > 0) {
                    const bestMatch = searchResults[0];
                    similarityScore = bestMatch.score;
                    contextStr = convertRecordToContext(bestMatch.payload);
                    candidate = true;
                } else {
                    similarityScore = 0.0;
                }
            }

            let rawResponse = 'ไม่พบข้อมูลในฐานข้อมูล (No interaction found)';

            if (candidate && contextStr) {
                try {
                    // Add delay to prevent overloading Ollama
                    await new Promise(r => setTimeout(r, 1000));

                    const fullPrompt = `${SYSTEM_PROMPT}\n\nคำถาม: ข้อมูลปฏิกิริยาระหว่างยา ${drugA} และ ${drugB} คืออะไร?`;
                    rawResponse = await generateText(fullPrompt, contextStr);
                } catch (e: any) {
                    rawResponse = `เกิดข้อผิดพลาดในการประมวลผล LLM: ${e.message}`;
                }
            }

            results.push({
                pair: [drugA, drugB],
                rawResponse,
                retrievedContext: contextStr,
                similarityScore
            });
        }

        return res.json({
            status: 'success',
            data: {
                normalizedDrugs,
                results
            }
        });

    } catch (error: any) {
        console.error('getMultiInteraction error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
