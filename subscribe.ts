import { ServerResponse, IncomingMessage } from 'http';

// Simuler une base de données d'abonnés en mémoire
const subscribers: string[] = [];

export default function handleSubscription(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { email } = JSON.parse(body);

        if (!email || !/\S+@\S+\.\S+/.test(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Adresse e-mail invalide.' }));
          return;
        }

        if (subscribers.includes(email)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Cet e-mail est déjà abonné.' }));
          return;
        }

        subscribers.push(email);
        console.log('N nouvel abonné:', email);
        console.log('Toute la liste:', subscribers);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Merci pour votre abonnement !' }));

      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Erreur interne du serveur.' }));
      }
    });
  } else {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Méthode non autorisée.' }));
  }
}
