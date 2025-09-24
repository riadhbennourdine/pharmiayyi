
import React, { useState } from 'react';

// Définir les types pour les templates
interface Template {
  id: string;
  name: string;
  component: React.FC<TemplateProps>;
}

interface TemplateProps {
  recipientName: string;
  content: string;
  youtubeUrl?: string;
}

const getYoutubeEmbedUrl = (url: string) => {
  if (!url) return '';
  try {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    if (urlObj.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${urlObj.pathname.slice(1)}`;
    }
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch (e) {
    return '';
  }
  return '';
};

// Template 1: Simple avec image
const SimpleTemplate: React.FC<TemplateProps> = ({ recipientName, content, youtubeUrl }) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', maxWidth: '600px', margin: 'auto' }}>
    <header style={{ backgroundColor: '#0d9488', padding: '20px', color: 'white', textAlign: 'center' }}>
      <h1 style={{ margin: '0', fontSize: '24px' }}>Pharmiayyi</h1>
    </header>
    <main style={{ padding: '30px' }}>
      <h2 style={{ color: '#0d9488', fontSize: '20px' }}>Bonjour {recipientName},</h2>
      <p style={{ lineHeight: '1.6' }}>{content}</p>
      {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
        <div style={{ marginTop: '20px' }}>
          <iframe 
            width="100%" 
            height="315" 
            src={getYoutubeEmbedUrl(youtubeUrl)} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      )}
      <img src="https://via.placeholder.com/540x200" alt="Placeholder" style={{ maxWidth: '100%', marginTop: '20px' }} />
    </main>
    <footer style={{ backgroundColor: '#f8f8f8', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
      <p>Pharmiayyi | 123 Rue de la Pharmacie, 75001 Paris</p>
      <p><a href="#" style={{ color: '#0d9488' }}>Se désinscrire</a> | <a href="#" style={{ color: '#0d9488' }}>Voir dans le navigateur</a></p>
    </footer>
  </div>
);

// Template 2: Promotion avec CTA
const PromotionTemplate: React.FC<TemplateProps> = ({ recipientName, content, youtubeUrl }) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', maxWidth: '600px', margin: 'auto' }}>
    <header style={{ backgroundColor: '#0d9488', padding: '20px', color: 'white', textAlign: 'center' }}>
      <h1 style={{ margin: '0', fontSize: '24px' }}>🎉 Offre Spéciale ! 🎉</h1>
    </header>
    <main style={{ padding: '30px', textAlign: 'center' }}>
      <h2 style={{ color: '#0d9488', fontSize: '20px' }}>Bonjour {recipientName},</h2>
      <p style={{ lineHeight: '1.6', fontSize: '18px' }}>{content}</p>
      <a href="#" style={{ backgroundColor: '#f59e0b', color: 'white', padding: '15px 30px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', display: 'inline-block', marginTop: '20px' }}>
        Profiter de l'offre
      </a>
      {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
        <div style={{ marginTop: '20px' }}>
          <iframe 
            width="100%" 
            height="315" 
            src={getYoutubeEmbedUrl(youtubeUrl)} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      )}
    </main>
    <footer style={{ backgroundColor: '#f8f8f8', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
      <p>Pharmiayyi | 123 Rue de la Pharmacie, 75001 Paris</p>
      <p><a href="#" style={{ color: '#0d9488' }}>Se désinscrire</a> | <a href="#" style={{ color: '#0d9488' }}>Voir dans le navigateur</a></p>
    </footer>
  </div>
);

// Template 3: Nouveau Contenu
const NewContentTemplate: React.FC<TemplateProps> = ({ recipientName, content, youtubeUrl }) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', maxWidth: '600px', margin: 'auto' }}>
    <header style={{ backgroundColor: '#0d9488', padding: '20px', color: 'white', textAlign: 'center' }}>
      <h1 style={{ margin: '0', fontSize: '24px' }}>Nouveau contenu disponible !</h1>
    </header>
    <main style={{ padding: '30px' }}>
      <h2 style={{ color: '#0d9488', fontSize: '20px' }}>Bonjour {recipientName},</h2>
      <p style={{ lineHeight: '1.6' }}>Nous avons publié de nouvelles ressources qui pourraient vous intéresser :</p>
      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <img src="https://via.placeholder.com/150x150" alt="Nouveau contenu" style={{ maxWidth: '150px' }} />
        <p style={{ flex: '1' }}>{content}</p>
      </div>
      {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
        <div style={{ marginTop: '20px' }}>
          <iframe 
            width="100%" 
            height="315" 
            src={getYoutubeEmbedUrl(youtubeUrl)} 
            title="YouTube video player" 
            frameBorder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowFullScreen
          ></iframe>
        </div>
      )}
       <div style={{ textAlign: 'center', marginTop: '20px' }}>
         <a href="#" style={{ backgroundColor: '#0d9488', color: 'white', padding: '10px 20px', textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold', display: 'inline-block' }}>
          Découvrir
        </a>
      </div>
    </main>
    <footer style={{ backgroundColor: '#f8f8f8', padding: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
      <p>Pharmiayyi | 123 Rue de la Pharmacie, 75001 Paris</p>
      <p><a href="#" style={{ color: '#0d9488' }}>Se désinscrire</a> | <a href="#" style={{ color: '#0d9488' }}>Voir dans le navigateur</a></p>
    </footer>
  </div>
);


// Définir les templates disponibles
const templates: Template[] = [
  { id: 'simple', name: 'Template Simple', component: SimpleTemplate },
  { id: 'promotion', name: 'Template Promotion', component: PromotionTemplate },
  { id: 'new-content', name: 'Template Nouveau Contenu', component: NewContentTemplate },
];

const Newsletter: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template>(templates[0]);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [recipientName, setRecipientName] = useState('Nom du Destinataire'); // Pour la prévisualisation

  const handleSend = () => {
    // Logique d'envoi simulée
    console.log('Envoi de la newsletter :');
    console.log('Sujet :', subject);
    console.log('Template :', selectedTemplate.name);
    console.log('Contenu :', content);
    console.log('URL YouTube :', youtubeUrl);
    // Dans un cas réel, on appellerait une API ici
  };

  const PreviewComponent = selectedTemplate.component;

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-3">Création de Newsletter</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colonne de gauche : formulaire de création */}
        <div>
          <div className="mb-4">
            <label htmlFor="template" className="block text-sm font-medium text-gray-700">
              Choisir un template
            </label>
            <select
              id="template"
              value={selectedTemplate.id}
              onChange={(e) => setSelectedTemplate(templates.find(t => t.id === e.target.value) || templates[0])}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
              Sujet de l'email
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700">
              Contenu de la newsletter
            </label>
            <textarea
              id="content"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              placeholder="Écrivez votre contenu ici. Vous pouvez utiliser des balises comme {{NOM_DESTINATAIRE}}."
            />
          </div>

          <div className="mb-4">
            <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700">
              URL de la vidéo YouTube (Optionnel)
            </label>
            <input
              type="text"
              id="youtubeUrl"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <button
            onClick={handleSend}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Envoyer la Newsletter (Simulation)
          </button>
        </div>

        {/* Colonne de droite : prévisualisation */}
        <div>
          <h4 className="text-lg font-bold text-gray-800 mb-2">Prévisualisation</h4>
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-100">
              <p className="text-sm text-gray-600">De: Votre Nom &lt;newsletter@example.com&gt;</p>
              <p className="text-sm text-gray-600">Sujet: {subject}</p>
            </div>
            <div className="p-4">
              <PreviewComponent recipientName={recipientName} content={content} youtubeUrl={youtubeUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
