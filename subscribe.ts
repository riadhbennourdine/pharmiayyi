import { Request, Response } from 'express';
import clientPromise from './services/mongo';

interface Subscriber {
  email: string;
  subscribedAt: Date;
}

export async function handleSubscription(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Adresse e-mail invalide.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const subscribersCollection = db.collection<Subscriber>('subscribers');

    const existingSubscriber = await subscribersCollection.findOne({ email });

    if (existingSubscriber) {
      return res.status(400).json({ message: 'Cet e-mail est déjà abonné.' });
    }

    await subscribersCollection.insertOne({
      email,
      subscribedAt: new Date(),
    });

    console.log('Nouvel abonné:', email);

    res.status(200).json({ message: 'Merci pour votre abonnement !' });

  } catch (error) {
    console.error('Erreur lors de l\'abonnement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}

export async function handleUnsubscription(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Adresse e-mail invalide.' });
    }

    const client = await clientPromise;
    const db = client.db('pharmia');
    const subscribersCollection = db.collection<Subscriber>('subscribers');

    const result = await subscribersCollection.deleteOne({ email });

    if (result.deletedCount === 0) {
        // It's good practice to not reveal if an email exists or not in an unsubscribe flow
        console.log('Tentative de désabonnement pour un email non trouvé:', email);
    } else {
        console.log('Désabonnement:', email);
    }

    res.status(200).json({ message: 'Vous avez été désabonné avec succès.' });

  } catch (error) {
    console.error('Erreur lors du désabonnement:', error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
}
