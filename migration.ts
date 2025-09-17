import { MongoClient, Db } from 'mongodb';

// L'interface de la nouvelle structure
interface MemoFiche {
  _id: any;
  title: string;
  theme: string;
  system: string;
  patientSituation: string;
  keyQuestions: string[];
  pathologyOverview: string;
  redFlags: string[];
  recommendations: {
    mainTreatment: string[];
    associatedProducts: string[];
    lifestyleAdvice: string[];
    dietaryAdvice: string[];
  };
  keyPoints: string[];
  references: string[];
  flashcards: { question: string; answer: string; }[];
  glossary: { term: string; definition: string; }[];
  media: {
    type: 'video' | 'podcast' | 'infographic' | string; // string pour la flexibilité
    title: string;
    url: string;
  }[];
  quiz: any[]; // Gardé comme any pour l'instant
  coverImageUrl?: string;
  creationDate: string;
  level?: string;
  shortDescription?: string;
  kahootUrl?: string;
}

// Fonction générique pour trouver une section par ID ou titre (avec mots-clés)
const findSection = (memoContent: any[], keywords: string[]): any | undefined => {
    if (!Array.isArray(memoContent)) return undefined;
    for (const keyword of keywords) {
        const found = memoContent.find(c => 
            (c.id && c.id.toLowerCase().includes(keyword.toLowerCase())) || 
            (c.title && c.title.toLowerCase().includes(keyword.toLowerCase()))
        );
        if (found) return found;
    }
    return undefined;
};

// Fonction pour extraire le contenu d'une section
const getSectionContent = (memoContent: any[], keywords: string[]): string => {
  const section = findSection(memoContent, keywords);
  return section && typeof section.content === 'string' ? section.content.trim() : '';
};

// Fonction pour extraire les listes d'une section
const getSectionListContent = (memoContent: any[], keywords: string[]): string[] => {
    const section = findSection(memoContent, keywords);
    if (!section || typeof section.content !== 'string') return [];
    // Diviser par retour à la ligne, nettoyer, et filtrer les lignes vides
    return section.content.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
};

// Fonction pour extraire les références
const getReferencesContent = (memoContent: any[]): string[] => {
    const section = findSection(memoContent, ['references bibliographiques', 'references']);
    if (!section || typeof section.content !== 'string') return [];
    return section.content.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
};

// Fonction pour extraire les traitements principaux
const getMainTreatmentContent = (memoContent: any[]): string[] => {
    const treatments: string[] = [];
    const section = findSection(memoContent, ['conseils specifiques sur les traitements', 'conseils traitements']);
    
    if (section && Array.isArray(section.children)) {
        section.children.forEach((child: any) => {
            if (child.content && typeof child.content === 'string') {
                treatments.push(child.content.trim());
            }
        });
    } else if (section && typeof section.content === 'string') {
        // Fallback if content is directly in the main section
        treatments.push(section.content.trim());
    }
    return treatments.filter(t => t.length > 0);
};

// Fonction pour extraire les produits associés (peut être vide si non trouvé)
const getAssociatedProductsContent = (memoContent: any[]): string[] => {
    const associatedProducts: string[] = [];
    const section = findSection(memoContent, ['produits associes', 'produits conseils']);
    if (section && typeof section.content === 'string') {
        associatedProducts.push(section.content.trim());
    }
    return associatedProducts.filter(p => p.length > 0);
};


const migrate = async () => {
  const uri = "mongodb://mongo:YoEfFXGVQwTTQlnwwPYRKwdIrgEqXrNp@centerbeam.proxy.rlwy.net:33803";
  if (!uri) {
    console.error('MONGO_URL is not defined in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db: Db = client.db('pharmia');
    const oldCollection = db.collection('memofiches');
    const newCollection = db.collection('memofiches_v2');

    // Supprimer l'ancienne collection memofiches_v2 si elle existe
    try {
        await newCollection.drop();
        console.log('Collection memofiches_v2 dropped successfully.');
    } catch (e: any) {
        if (e.code === 26) { // 26 is the error code for "ns not found" (collection does not exist)
            console.log('Collection memofiches_v2 did not exist, no need to drop.');
        } else {
            throw e; // Re-throw other errors
        }
    }

    const documents = await oldCollection.find({}).toArray();

    console.log(`Found ${documents.length} documents to migrate.`);

    for (const doc of documents) {
      const newDoc: MemoFiche = {
        _id: doc._id,
        title: doc.title || '',
        theme: doc.theme?.Nom || 'Non défini',
        system: doc.systeme_organe?.Nom || 'Non défini',
        
        patientSituation: getSectionContent(doc.memoContent, ['cas comptoir', 'casio']),
        keyQuestions: getSectionListContent(doc.memoContent, ['questions cles', 'questions a poser']),
        pathologyOverview: getSectionContent(doc.memoContent, ['comprendre la maladie', 'comprendre le reflux', 'comprendre la constipation', 'comprendre la candidose', 'comprendre la rhinite', 'comprendre l\'onychomycose', 'comprendre la protection solaire', 'comprendre les coups de soleil', 'comprendre la photosensibilisation', 'comprendre le bilan corporel', 'comprendre les dysménorrhées']),
        redFlags: getSectionListContent(doc.memoContent, ['quand orienter', 'signaux d\'alerte']),
        
        recommendations: {
          mainTreatment: getMainTreatmentContent(doc.memoContent),
          associatedProducts: getAssociatedProductsContent(doc.memoContent),
          lifestyleAdvice: getSectionListContent(doc.memoContent, ['hygiene de vie', 'conseils hygiene']),
          dietaryAdvice: getSectionListContent(doc.memoContent, ['recommandations alimentaires', 'conseils alimentaires']),
        },
        
        keyPoints: doc.flashSummary ? doc.flashSummary.split('. ').map((s: string) => s.trim()).filter((s: string) => s.length > 0) : [],
        
        references: getReferencesContent(doc.memoContent),
        
        flashcards: doc.flashcards || [],
        glossary: doc.glossaryTerms || [],
        
        media: (doc.externalResources || []).map((r: any) => ({
          type: r.type || 'video',
          title: r.title || '',
          url: r.url || ''
        })),
        
        quiz: doc.quiz || [],
        
        coverImageUrl: doc.imageUrl,
        creationDate: doc.createdAt,
        
        level: doc.level,
        shortDescription: doc.shortDescription,
        kahootUrl: doc.kahootUrl,
      };

      await newCollection.insertOne(newDoc);
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('An error occurred during migration:', error);
  } finally {
    await client.close();
  }
};

migrate();
