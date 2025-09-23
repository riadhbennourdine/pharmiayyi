import clientPromise from './mongo';
import { getEmbedding } from './geminiService';
import { Collection, ObjectId } from 'mongodb';

// Define the structure for a chunk, which will be stored in the new collection
export interface MemoFicheChunk {
    _id?: ObjectId;
    sourceFicheId: ObjectId;
    sourceFicheTitle: string;
    section: string; // e.g., 'pathologyOverview', 'recommendations.mainTreatment[0]'
    content: string;
    embedding: number[];
    createdAt: Date;
}

// --- HELPER FUNCTIONS FOR CHUNKING ---

/**
 * Flattens a nested object into a single level.
 * e.g., { a: { b: 'c' } } => { 'a.b': 'c' }
 */
const flattenObject = (obj: any, parentKey = '', result: { [key: string]: any } = {}) => {
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const newKey = parentKey ? `${parentKey}.${key}` : key;
            // We treat arrays differently, so we don't recurse into them here.
            if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                flattenObject(obj[key], newKey, result);
            } else {
                result[newKey] = obj[key];
            }
        }
    }
    return result;
};

/**
 * Creates text chunks from a single memo fiche document.
 * This function is designed to be robust for different fiche structures.
 */
const createChunksFromFiche = (fiche: any): Omit<MemoFicheChunk, 'embedding' | '_id' | 'createdAt'>[] => {
    const chunks: Omit<MemoFicheChunk, 'embedding' | '_id' | 'createdAt'>[] = [];
    const sourceFicheId = fiche._id;
    const sourceFicheTitle = fiche.title;

    // Ignore fields that are not useful for semantic search or are not text-based.
    const ignoredFields = ['_id', 'coverImageUrl', 'youtubeUrl', 'kahootUrl', 'knowledgeBaseUrl', 'creationDate', 'quiz', 'flashcards', 'media', 'glossary', 'sourceText'];

    const flatFiche = flattenObject(fiche);

    for (const key in flatFiche) {
        if (ignoredFields.some(ignored => key.startsWith(ignored))) {
            continue;
        }

        const content = flatFiche[key];

        // Case 1: Content is a simple string
        if (typeof content === 'string' && content.trim().length > 20) { // Only chunk non-empty strings of reasonable length
            chunks.push({
                sourceFicheId,
                sourceFicheTitle,
                section: key,
                content: `Titre de la fiche: ${sourceFicheTitle}\nSection: ${key}\nContenu: ${content.trim()}`,
            });
        } 
        // Case 2: Content is an array
        else if (Array.isArray(content)) {
            content.forEach((item, index) => {
                let itemContent = '';
                if (typeof item === 'string') {
                    itemContent = item;
                } else if (typeof item === 'object' && item !== null) {
                    // For complex objects in arrays, serialize them into a readable string
                    itemContent = Object.entries(item)
                        .map(([objKey, objValue]) => `${objKey}: ${objValue}`)
                        .join('; ');
                }

                if (itemContent.trim().length > 20) {
                    chunks.push({
                        sourceFicheId,
                        sourceFicheTitle,
                        section: `${key}[${index}]`,
                        content: `Titre de la fiche: ${sourceFicheTitle}\nSection: ${key}[${index}]\nContenu: ${itemContent.trim()}`,
                    });
                }
            });
        }
    }

    return chunks;
};


// --- CORE INDEXING SERVICE ---

export const updateKnowledgeBase = async (): Promise<{ processed: number; chunks: number; }> => {
    console.log("Starting knowledge base update...");

    try {
        const client = await clientPromise;
        const db = client.db('pharmia');
        const fichesCollection = db.collection('memofiches_v2');
        const chunksCollection = db.collection<MemoFicheChunk>('memofiche_chunks');

        // IMPORTANT: A vector search index must be created on the `memofiche_chunks` collection for this to work.
        // This must be done in your MongoDB provider's UI (e.g., Atlas, Railway).
        // The index should be on the `embedding` field and have 768 dimensions for the 'embedding-001' model.
        console.log("Prerequisite: Ensure a vector search index exists on the 'memofiche_chunks' collection.");

        // Step 1: Clear existing chunks
        console.log("Deleting old chunks...");
        await chunksCollection.deleteMany({});

        // Step 2: Fetch all memo fiches
        console.log("Fetching all memo fiches...");
        const allFiches = await fichesCollection.find({}).toArray();
        console.log(`Found ${allFiches.length} fiches to process.`);

        let totalChunksCreated = 0;

        // Step 3: Process each fiche
        for (const fiche of allFiches) {
            const chunksWithoutEmbedding = createChunksFromFiche(fiche);

            if (chunksWithoutEmbedding.length === 0) {
                console.log(`No chunks created for fiche: ${fiche.title}`);
                continue;
            }
            
            // Step 4: Generate embeddings for all chunks of the current fiche in a single batch call
            const textsToEmbed = chunksWithoutEmbedding.map(c => c.content);
            console.log(`Generating ${textsToEmbed.length} embeddings for fiche: ${fiche.title}`);
            
            const embeddings = await getEmbedding(textsToEmbed);

            const chunksToInsert: MemoFicheChunk[] = chunksWithoutEmbedding.map((chunk, i) => ({
                ...chunk,
                embedding: embeddings[i],
                createdAt: new Date(),
            }));

            // Step 5: Insert new chunks into the database
            await chunksCollection.insertMany(chunksToInsert);
            totalChunksCreated += chunksToInsert.length;
            console.log(`Inserted ${chunksToInsert.length} chunks for fiche: ${fiche.title}`);

            // Add a delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
        }

        console.log(`Knowledge base update complete. Processed ${allFiches.length} fiches and created ${totalChunksCreated} chunks.`);
        return { processed: allFiches.length, chunks: totalChunksCreated };

    } catch (error) {
        console.error("Error during knowledge base update:", error);
        throw new Error("Failed to update knowledge base.");
    }
};

export const indexSingleMemoFiche = async (ficheId: ObjectId): Promise<{ processed: number; chunks: number; }> => {
    console.log(`Indexing for single fiche ${ficheId} is temporarily disabled.`);
    return { processed: 0, chunks: 0 };
};
