import { Request, Response } from 'express';
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
Management: ${record.management || 'ไม่ระบุ'}`;
}

const SYSTEM_PROMPT_QA = `คุณคือผู้เชี่ยวชาญด้านเภสัชกรรม (Clinical Pharmacist)
หน้าที่ของคุณคือตอบคำถามทางการแพทย์ โดยใช้อ้างอิงจากข้อมูลใน Context ที่ให้มาเท่านั้น
ห้ามคิดข้อมูลหรือใช้ความรู้ภายนอกเด็ดขาด 
หากข้อมูลใน Context ไม่มีคำตอบสำหรับคำถาม ให้ตอบกลับว่า "ไม่พบข้อมูลในฐานข้อมูล" ทันที ห้ามแสดงความคิดเห็นอื่น
ตอบคำถามในรูปแบบที่เป็นมิตร อ่านง่าย และเป็นภาษาไทย
`;

export const ragQA = async (req: Request, res: Response) => {
    try {
        const { question, topK = 3 } = req.body;

        if (!question || typeof question !== 'string') {
            return res.status(400).json({ status: 'error', message: 'Missing question in request body' });
        }

        // 1. Vector Search
        const queryVector = await getEmbedding(question);

        // Low threshold for RAG to pull in potential context
        const searchResults = await searchVectors(queryVector, topK, 0.40);

        if (!searchResults || searchResults.length === 0) {
            return res.json({
                status: 'success',
                data: {
                    answer: 'ไม่พบข้อมูลในฐานข้อมูล (No context found)',
                    contexts: []
                }
            });
        }

        // 2. Build Context Document
        const contexts = searchResults.map((match: any) => ({
            id: match.id as string,
            score: match.score as number,
            content: convertRecordToContext(match.payload)
        }));

        const combinedContext = contexts
            .map((c: any, index: number) => `[เอกสารอ้างอิง ${index + 1}]\n${c.content}`)
            .join('\n\n');

        // 3. LLM Generation
        const fullPrompt = `${SYSTEM_PROMPT_QA}\n\nคำถาม:\n${question}`;

        const answer = await generateText(fullPrompt, combinedContext);

        return res.json({
            status: 'success',
            data: {
                answer,
                contexts
            }
        });

    } catch (error: any) {
        console.error('ragQA error:', error);
        return res.status(500).json({ status: 'error', message: error.message });
    }
};
