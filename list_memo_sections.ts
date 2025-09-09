import { MongoClient } from 'mongodb';

const uri = "mongodb://mongo:YoEfFXGVQwTTQlnwwPYRKwdIrgEqXrNp@centerbeam.proxy.rlwy.net:33803";

async function listMemoContentSections() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('pharmia');
    const collection = db.collection('memofiches'); // L'ancienne collection

    const documents = await collection.find({}).toArray();

    const uniqueSectionIdentifiers = new Set<string>();

    documents.forEach(doc => {
      if (doc.memoContent && Array.isArray(doc.memoContent)) {
        doc.memoContent.forEach((section: any) => {
          if (section.id) {
            uniqueSectionIdentifiers.add(`ID: ${section.id}`);
          }
          if (section.title) {
            uniqueSectionIdentifiers.add(`TITLE: ${section.title}`);
          }
          // Si la section a des enfants (children)
          if (section.children && Array.isArray(section.children)) {
            section.children.forEach((child: any) => {
              if (child.id) {
                uniqueSectionIdentifiers.add(`CHILD_ID: ${child.id}`);
              }
              if (child.title) {
                uniqueSectionIdentifiers.add(`CHILD_TITLE: ${child.title}`);
              }
            });
          }
        });
      }
    });

    console.log('Unique MemoContent Section Identifiers:');
    uniqueSectionIdentifiers.forEach(identifier => console.log(identifier));

  } catch (error) {
    console.error('Error listing memoContent sections:', error);
  } finally {
    await client.close();
  }
}

listMemoContentSections();
