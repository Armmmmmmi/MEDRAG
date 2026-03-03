import { parse } from 'csv-parse';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import { getEmbedding } from './embeddingService';
import { upsertVectors } from './qdrantService';
import fs from 'fs';

export async function processCsvImport(filePath: string, skipEmbedding: boolean = false): Promise<number> {
    const db = getDb();
    let count = 0;

    // Assuming file has a header row to skip, if not we adjust.
    // The PRD states 12 fixed columns:
    // 1. Drug A, 2. Drug B, 3. Significance, 4. Onset, 5. Severity, 6. Documentation,
    // 7. Effect, 8. Mechanism, 9. Management, 10. Discussion, 11. Biblio, 12. Reference

    const records: any[] = [];

    const parser = fs.createReadStream(filePath).pipe(
        parse({
            delimiter: ',',
            from_line: 2, // Skip header row
            relax_quotes: true,
            relax_column_count: true
        })
    );

    for await (const row of parser) {
        if (row.length >= 12) {
            records.push({
                id: uuidv4(),
                drugA: row[0].trim(),
                drugB: row[1].trim(),
                significance: row[2].trim(),
                onset: row[3].trim(),
                severity: row[4].trim(),
                documentation: row[5].trim(),
                effect: row[6].trim(),
                mechanism: row[7].trim(),
                management: row[8].trim(),
                ddisscuss: row[9].trim(),
                dbiblio: row[10].trim(),
                reference: row[11].trim(),
                source: row[12] ? row[12].trim() : 'CSV Import' // Optional 13th column if they want source
            });
        }
    }

    // Insert to SQLite and Qdrant in batches
    const BATCH_SIZE = 10; // Small batch size because embeddings are slow locally

    const insertStmt = db.prepare(`
    INSERT INTO interaction_records (
      id, drugA, drugB, significance, onset, severity, documentation, 
      effect, mechanism, management, ddisscuss, dbiblio, reference, source
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        // SQLite transaction
        const transaction = db.transaction((rows) => {
            for (const row of rows) {
                insertStmt.run(
                    row.id, row.drugA, row.drugB, row.significance, row.onset, row.severity,
                    row.documentation, row.effect, row.mechanism, row.management,
                    row.ddisscuss, row.dbiblio, row.reference, row.source
                );
            }
        });

        transaction(batch);

        // Generate embeddings and push to Qdrant if not skipping
        if (!skipEmbedding) {
            const vectorPoints = [];
            for (const record of batch) {
                const queryText = `${record.drugA.toLowerCase()} and ${record.drugB.toLowerCase()} interaction severity effect mechanism management`;
                const vector = await getEmbedding(queryText);
                vectorPoints.push({
                    id: record.id,
                    vector,
                    payload: record
                });
            }

            await upsertVectors(vectorPoints);
        }

        count += batch.length;
        console.log(`Processed ${count} / ${records.length} records... (skipEmbedding: ${skipEmbedding})`);
    }

    // Clean up
    try {
        fs.unlinkSync(filePath);
    } catch (e) { /* ignore */ }

    return count;
}

export async function reindexAll(): Promise<number> {
    const db = getDb();
    let count = 0;

    const records = db.prepare("SELECT * FROM interaction_records").all() as any[];

    const BATCH_SIZE = 10;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const vectorPoints = [];
        for (const record of batch) {
            const queryText = `${record.drugA.toLowerCase()} and ${record.drugB.toLowerCase()} interaction severity effect mechanism management`;
            const vector = await getEmbedding(queryText);
            vectorPoints.push({
                id: record.id,
                vector,
                payload: record
            });
        }

        await upsertVectors(vectorPoints);

        count += batch.length;
        console.log(`Re-indexed ${count} / ${records.length} records...`);
    }

    return count;
}
