import React, { useState, useRef, useEffect } from 'react';


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

// --- EMAIL TEMPLATES REFACTORED FOR COMPATIBILITY ---

// Template 1: Simple avec image (Table-based layout)
const SimpleTemplate: React.FC<TemplateProps> = ({ recipientName, content, youtubeUrl }) => (
  <table cellPadding="0" cellSpacing="0" border="0" width="100%" style={{ backgroundColor: '#f3f4f6' }}>
    <tr>
      <td align="center" style={{ padding: '20px' }}>
        <table cellPadding="0" cellSpacing="0" border="0" width="600" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
          {/* Header */}
          <tr>
            <td style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
              <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                <tr>
                  <td><img src="https://pharmaconseilbmb.com/photos/site/logo-pharmia.png" alt="PharmIA Logo" width="120" /></td>
                </tr>
              </table>
            </td>
          </tr>
          {/* Main Content */}
          <tr>
            <td style={{ padding: '24px 32px', fontFamily: 'Arial, sans-serif', color: '#111827' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 16px 0' }}>Bonjour {recipientName},</h2>
              <p style={{ lineHeight: '1.6', color: '#4b5563', margin: '0' }}>{content}</p>
              {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
                <table cellPadding="0" cellSpacing="0" border="0" width="100%" style={{ marginTop: '24px' }}>
                  <tr>
                    <td align="center">
                      <a href={youtubeUrl} style={{ display: 'block', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={`https://img.youtube.com/vi/${new URL(youtubeUrl).searchParams.get('v')}/0.jpg`} alt="YouTube video thumbnail" width="100%" style={{ display: 'block', border: '0', maxWidth: '100%' }} />
                      </a>
                    </td>
                  </tr>
                </table>
              )}
            </td>
          </tr>
          {/* Footer */}
          <tr>
            <td style={{ backgroundColor: '#f3f4f6', padding: '20px 32px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
              <p style={{ margin: '0 0 8px 0' }}>Pharmiayyi | 123 Rue de la Pharmacie, 75001 Paris</p>
              <p style={{ margin: '0' }}><a href={`/#/unsubscribe?email=${recipientName}`} style={{ color: '#0d9488', textDecoration: 'none' }}>Se désinscrire</a> | <a href="#" style={{ color: '#0d9488', textDecoration: 'none' }}>Voir dans le navigateur</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
);

// Template 2: Promotion avec CTA (Table-based layout)
const PromotionTemplate: React.FC<TemplateProps> = ({ recipientName, content, youtubeUrl }) => (
    <table cellPadding="0" cellSpacing="0" border="0" width="100%" style={{ backgroundColor: '#f3f4f6' }}>
        <tr>
            <td align="center" style={{ padding: '20px' }}>
                <table cellPadding="0" cellSpacing="0" border="0" width="600" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    {/* Header */}
                    <tr>
                        <td align="center" style={{ padding: '24px', backgroundColor: '#0d9488', color: 'white', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
                            <h1 style={{ margin: '0', fontSize: '28px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif' }}>🎉 Offre Spéciale ! 🎉</h1>
                        </td>
                    </tr>
                    {/* Main Content */}
                    <tr>
                        <td align="center" style={{ padding: '32px', fontFamily: 'Arial, sans-serif', color: '#111827' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 16px 0' }}>Bonjour {recipientName},</h2>
                            <p style={{ lineHeight: '1.6', color: '#4b5563', fontSize: '18px', margin: '0 0 24px 0' }}>{content}</p>
                            {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
                                <table cellPadding="0" cellSpacing="0" border="0" width="100%" style={{ marginTop: '24px' }}>
                                  <tr>
                                    <td align="center">
                                      <a href={youtubeUrl} style={{ display: 'block', borderRadius: '8px', overflow: 'hidden' }}>
                                        <img src={`https://img.youtube.com/vi/${new URL(youtubeUrl).searchParams.get('v')}/0.jpg`} alt="YouTube video thumbnail" width="100%" style={{ display: 'block', border: '0', maxWidth: '100%' }} />
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                            )}
                        </td>
                    </tr>
                    {/* Footer */}
                    <tr>
                        <td style={{ backgroundColor: '#f3f4f6', padding: '20px 32px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                            <p style={{ margin: '0 0 8px 0' }}>Pharmiayyi | 123 Rue de la Pharmacie, 75001 Paris</p>
                            <p style={{ margin: '0' }}><a href={`/#/unsubscribe?email=${recipientName}`} style={{ color: '#0d9488', textDecoration: 'none' }}>Se désinscrire</a> | <a href="#" style={{ color: '#0d9488', textDecoration: 'none' }}>Voir dans le navigateur</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
);

// Template 3: Nouveau Contenu (Table-based layout)
const NewContentTemplate: React.FC<TemplateProps> = ({ recipientName, content, youtubeUrl }) => (
    <table cellPadding="0" cellSpacing="0" border="0" width="100%" style={{ backgroundColor: '#f3f4f6' }}>
        <tr>
            <td align="center" style={{ padding: '20px' }}>
                <table cellPadding="0" cellSpacing="0" border="0" width="600" style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    {/* Header */}
                    <tr>
                        <td style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                            <table cellPadding="0" cellSpacing="0" border="0" width="100%">
                                <tr>
                                    <td><img src="https://pharmaconseilbmb.com/photos/site/logo-pharmia.png" alt="PharmIA Logo" width="120" /></td>
                                    <td align="right" style={{ fontFamily: 'Arial, sans-serif', fontSize: '18px', fontWeight: 'bold', color: '#0d9488' }}>Nouveau Contenu</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    {/* Main Content */}
                    <tr>
                        <td style={{ padding: '24px 32px', fontFamily: 'Arial, sans-serif', color: '#111827' }}>
                            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 16px 0' }}>Bonjour {recipientName},</h2>
                            <p style={{ lineHeight: '1.6', color: '#4b5563', margin: '0 0 24px 0' }}>Nous avons publi&#233; de nouvelles ressources qui pourraient vous int&#233;resser :</p>
                            <table cellPadding="0" cellSpacing="0" border="0" width="100%" style={{ backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                <tr>
                                    <td style={{ padding: '20px' }}>
                                        <p style={{ margin: '0' }}>{content}</p>
                                    </td>
                                </tr>
                            </table>
                            {youtubeUrl && getYoutubeEmbedUrl(youtubeUrl) && (
                                <table cellPadding="0" cellSpacing="0" border="0" width="100%" style={{ marginTop: '24px' }}>
                                  <tr>
                                    <td align="center">
                                      <a href={youtubeUrl} style={{ display: 'block', borderRadius: '8px', overflow: 'hidden' }}>
                                        <img src={`https://img.youtube.com/vi/${new URL(youtubeUrl).searchParams.get('v')}/0.jpg`} alt="YouTube video thumbnail" width="100%" style={{ display: 'block', border: '0', maxWidth: '100%' }} />
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                            )}
                            <div style={{ textAlign: 'center', marginTop: '24px' }}>
                                <a href="#" style={{ backgroundColor: '#0d9488', color: 'white', padding: '12px 24px', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', display: 'inline-block' }}>
                                    D&#233;couvrir
                                </a>
                            </div>
                        </td>
                    </tr>
                    {/* Footer */}
                    <tr>
                        <td style={{ backgroundColor: '#f3f4f6', padding: '20px 32px', textAlign: 'center', fontSize: '12px', color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                            <p style={{ margin: '0 0 8px 0' }}>Pharmiayyi | 123 Rue de la Pharmacie, 75001 Paris</p>
                            <p style={{ margin: '0' }}><a href={`/#/unsubscribe?email=${recipientName}`} style={{ color: '#0d9488', textDecoration: 'none' }}>Se d&#233;sinscrire</a> | <a href="#" style={{ color: '#0d9488', textDecoration: 'none' }}>Voir dans le navigateur</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
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
  const [allGroups, setAllGroups] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/subscribers/groups', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch groups');
        const data = await response.json();
        setAllGroups(data);
      } catch (err: any) {
        console.error(err);
      }
    };
    fetchGroups();
  }, []);

  const handleGroupToggle = (group: string) => {
    setSelectedGroups(prev => 
        prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

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
        body: JSON.stringify({ subject, htmlContent, groups: selectedGroups }),
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

  const formatContentForHtml = (text: string) => {
    return text.split('\n').join('<br />');
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
            <label className="block text-sm font-medium text-gray-700">
                Envoyer aux groupes
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
                {allGroups.map(group => (
                    <div key={group} className="flex items-center">
                        <input
                            type="checkbox"
                            id={`group-select-${group}`}
                            checked={selectedGroups.includes(group)}
                            onChange={() => handleGroupToggle(group)}
                            className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                        <label htmlFor={`group-select-${group}`} className="ml-2 text-sm text-gray-700">{group}</label>
                    </div>
                ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">Si aucun groupe n&#39;est s&#233;lectionn&#233;, la newsletter sera envoy&#233;e &#224; tous les abonn&#233;s.</p>
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
              <PreviewComponent recipientName="{{NOM_DESTINATAIRE}}" content={formatContentForHtml(content)} youtubeUrl={youtubeUrl} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
