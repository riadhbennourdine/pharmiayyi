import React, { useState, useRef } from 'react';
import { PharmIaLogo } from './icons'; // Importer le nouveau logo

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
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#374151', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', maxWidth: '600px', margin: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
    <header style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <PharmIaLogo width={120} height={32} color="#0d9488" />
      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0d9488' }}>Newsletter</span>
    </header>
    <main style={{ padding: '24px 32px' }}>
      <h2 style={{ color: '#111827', fontSize: '22px', fontWeight: 'bold' }}>Bonjour {recipientName},</h2>
      <p style={{ lineHeight: '1.6', color: '#4b5563', marginTop: '16px' }}>{content}</p>
      {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
        <div style={{ marginTop: '24px', borderRadius: '8px', overflow: 'hidden' }}>
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
    <footer style={{ backgroundColor: '#f3f4f6', padding: '20px 32px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
      <p>Pharmiayyi | 123 Rue de la Pharmacie, 75001 Paris</p>
      <p style={{ marginTop: '8px' }}><a href={`/#/unsubscribe?email=${recipientName}`} style={{ color: '#0d9488', textDecoration: 'none' }}>Se désinscrire</a> | <a href="#" style={{ color: '#0d9488', textDecoration: 'none' }}>Voir dans le navigateur</a></p>
    </footer>
  </div>
);

// Template 2: Promotion avec CTA
const PromotionTemplate: React.FC<TemplateProps> = ({ recipientName, content, youtubeUrl }) => (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#374151', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', maxWidth: '600px', margin: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
    <header style={{ padding: '24px', backgroundColor: '#0d9488', color: 'white', textAlign: 'center' }}>
        <h1 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold' }}>🎉 Offre Spéciale ! 🎉</h1>
    </header>
    <main style={{ padding: '32px', textAlign: 'center' }}>
      <h2 style={{ color: '#111827', fontSize: '22px', fontWeight: 'bold' }}>Bonjour {recipientName},</h2>
      <p style={{ lineHeight: '1.6', color: '#4b5563', fontSize: '18px', marginTop: '16px' }}>{content}</p>
      <a href="#" style={{ backgroundColor: '#f59e0b', color: 'white', padding: '14px 28px', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'inline-block', marginTop: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        Profiter de l&#39;offre
      </a>
      {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
        <div style={{ marginTop: '24px', borderRadius: '8px', overflow: 'hidden' }}>
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
    <footer style={{ backgroundColor: '#f3f4f6', padding: '20px 32px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
      <p>Pharmiayyi | 123 Rue de la Pharmacie, 75001 Paris</p>
      <p style={{ marginTop: '8px' }}><a href={`/#/unsubscribe?email=${recipientName}`} style={{ color: '#0d9488', textDecoration: 'none' }}>Se désinscrire</a> | <a href="#" style={{ color: '#0d9488', textDecoration: 'none' }}>Voir dans le navigateur</a></p>
    </footer>
  </div>
);

// Template 3: Nouveau Contenu
const NewContentTemplate: React.FC<TemplateProps> = ({ recipientName, content, youtubeUrl }) => (
    <div style={{ fontFamily: 'Arial, sans-serif', color: '#374151', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', maxWidth: '600px', margin: 'auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
    <header style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <PharmIaLogo width={120} height={32} color="#0d9488" />
      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#0d9488' }}>Nouveau Contenu</span>
    </header>
    <main style={{ padding: '24px 32px' }}>
      <h2 style={{ color: '#111827', fontSize: '22px', fontWeight: 'bold' }}>Bonjour {recipientName},</h2>
      <p style={{ lineHeight: '1.6', color: '#4b5563', marginTop: '16px' }}>Nous avons publi&#233; de nouvelles ressources qui pourraient vous int&#233;resser :</p>
      <div style={{ marginTop: '24px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px' }}>
        <p style={{ flex: '1' }}>{content}</p>
      </div>
      {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
        <div style={{ marginTop: '24px', borderRadius: '8px', overflow: 'hidden' }}>
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
       <div style={{ textAlign: 'center', marginTop: '24px' }}>
         <a href="#" style={{ backgroundColor: '#0d9488', color: 'white', padding: '12px 24px', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'inline-block', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          D&#233;couvrir
        </a>
      </div>
    </main>
    <footer style={{ backgroundColor: '#f3f4f6', padding: '20px 32px', textAlign: 'center', fontSize: '12px', color: '#6b7280' }}>
      <p>Pharmiayyi | 123 Rue de la Pharmacie, 75001 Paris</p>
      <p style={{ marginTop: '8px' }}><a href={`/#/unsubscribe?email=${recipientName}`} style={{ color: '#0d9488', textDecoration: 'none' }}>Se d&#233;sinscrire</a> | <a href="#" style={{ color: '#0d9488', textDecoration: 'none' }}>Voir dans le navigateur</a></p>
    </footer>
  </div>
);


// D&#233;finir les templates disponibles
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
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [sendStatus, setSendStatus] = useState('');

  const insertTag = (tag: string) => {
    if (contentRef.current) {
      const { selectionStart, selectionEnd, value } = contentRef.current;
      const newContent =
        value.substring(0, selectionStart) + `{{${tag}}}` + value.substring(selectionEnd);
      setContent(newContent);
      // Optional: focus and move cursor after the inserted tag
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          const newCursorPosition = selectionStart + tag.length + 4; // +4 for {{ and }}
          contentRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        }
      }, 0);
    }
  };

  const handleSend = async () => {
    if (!previewRef.current) {
      setSendStatus('Erreur: Impossible de r&#233;cup&#233;rer le contenu de la pr&#233;visualisation.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setSendStatus('Erreur: Vous n&#39;&#234;tes pas authentifi&#233;.');
      return;
    }

    const htmlContent = previewRef.current.innerHTML;

    setSendStatus('Envoi en cours...');

    try {
      const response = await fetch('/api/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, htmlContent }),
      });

      const data = await response.json();

      if (response.ok) {
        setSendStatus(data.message);
      } else {
        setSendStatus(`Erreur: ${data.message || 'Une erreur est survenue.'}`);
      }
    } catch (error) {
      setSendStatus('Impossible de se connecter au serveur.');
    }
  };

  const PreviewComponent = selectedTemplate.component;

  return (
    <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-3">Cr&#233;ation de Newsletter</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colonne de gauche : formulaire de cr&#233;ation */}
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
              Sujet de l&#39;email
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
            <div className="mt-1 mb-2 flex flex-wrap gap-2">
              <button onClick={() => insertTag('NOM_DESTINATAIRE')} className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">Nom du destinataire</button>
              <button onClick={() => insertTag('NOM_EXPEDITEUR')} className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">Nom de l&#39;exp&#233;diteur</button>
              <button onClick={() => insertTag('LIEN_DESINSCRIPTION')} className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300">Lien de d&#233;sinscription</button>
            </div>
            <textarea
              ref={contentRef}
              id="content"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              placeholder="&#201;crivez votre contenu ici. Vous pouvez utiliser des balises comme {{NOM_DESTINATAIRE}}."
            />
          </div>

          <div className="mb-4">
            <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700">
              URL de la vid&#233;o YouTube (Optionnel)
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
            Envoyer la Newsletter
          </button>
          {sendStatus && <p className="mt-4 text-sm text-gray-600">{sendStatus}</p>}
        </div>

        {/* Colonne de droite : pr&#233;visualisation */}
        <div>
          <h4 className="text-lg font-bold text-gray-800 mb-2">Pr&#233;visualisation</h4>
          <div className="border rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-100">
              <p className="text-sm text-gray-600">De: Votre Nom &lt;newsletter@example.com&gt;</p>
              <p className="text-sm text-gray-600">Sujet: {subject}</p>
            </div>
            <div ref={previewRef} className="p-4">
              <PreviewComponent recipientName="{{NOM_DESTINATAIRE}}" content={content} youtubeUrl={youtubeUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
