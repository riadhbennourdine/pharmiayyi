import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TOPIC_CATEGORIES } from '../constants';
import { LogoIcon, CapsuleIcon, BookOpenIcon, DocumentTextIcon, CheckCircleIcon, SparklesIcon, QuestionMarkCircleIcon, CommunicationIcon } from './icons';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="bg-white rounded-xl shadow-md p-6 text-center flex flex-col items-center h-full border border-slate-200/80">
        <div className="bg-teal-100 text-teal-600 rounded-full p-4 mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">{title}</h3>
        <p className="text-slate-600 text-base flex-grow">{children}</p>
    </div>
);

const ThemeCard: React.FC<{ title: string }> = ({ title }) => (
    <div className="bg-white border border-gray-200/75 rounded-xl p-5 text-center flex flex-col items-center justify-center space-y-3 transition-all duration-300 hover:border-teal-400 hover:shadow-lg hover:-translate-y-1 h-full">
        <div className="text-teal-600">
            <CapsuleIcon className="w-10 h-10"/>
        </div>
        <span className="font-semibold text-slate-800 text-sm">{title}</span>
    </div>
);

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const learningThemes = TOPIC_CATEGORIES[0].topics.slice(0, 6);

    const trainers = [
        { name: "Riadh Barhoumi", imageUrl: "https://pharmaconseilbmb.com/photos/site/formateur/1.png", title: "Pharmacien Coach & Formateur", phone: "+216 52 847 241", email: "contact@pharmaconseilbmb.com" },
        { name: "Emna Mili", imageUrl: "https://pharmaconseilbmb.com/photos/site/formateur/2.png", title: "Pharmacienne Formatrice", phone: "+216 56 599 000", email: "emnamili0106@gmail.com" },
        { name: "Senda Yahia", imageUrl: "https://pharmaconseilbmb.com/photos/site/formateur/3.png", title: "Pharmacienne Formatrice", phone: "+216 58 678 441", email: "yahiasenda92@gmail.com" },
        { name: "Ghassen Khalaf", imageUrl: "https://pharmaconseilbmb.com/photos/site/formateur/4.png", title: "Pharmacien Formateur", phone: "+216 27 775 315", email: "" },
        { name: "Kmar Ben Abdessalem", imageUrl: "https://pharmaconseilbmb.com/photos/site/formateur/5.png", title: "Pharmacienne Formatrice", phone: "", email: "" },
    ];

    const handleStartLearning = () => {
        navigate('/login');
    }

    return (
        <div className="w-full bg-slate-50 font-sans text-slate-800">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <LogoIcon className="h-8 w-8 text-teal-600 mr-3" />
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        Pharm<span className="text-teal-600">IA</span>
                        </h1>
                    </div>
                    <button
                        onClick={handleStartLearning}
                        className="hidden sm:inline-block bg-teal-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-teal-700 transition-transform duration-300 hover:scale-105"
                    >
                        Essai Gratuit
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
                        Devenez un expert du conseil à l'officine
                    </h1>
                     <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
                        Maîtrisez le comptoir grâce à nos mémofiches intelligentes et interactives. Apprentissage rapide, efficace et adapté à votre quotidien.
                    </p>
                    <div className="mt-10 flex flex-col items-center gap-4">
                         <button
                            onClick={handleStartLearning}
                            className="inline-block bg-teal-600 text-white font-bold px-8 py-4 rounded-lg hover:bg-teal-700 transition-transform duration-300 hover:scale-105 text-lg shadow-lg"
                        >
                            Commencez votre essai gratuit de 14 jours
                        </button>
                        <p className="text-sm text-slate-500">Sans engagement. Sans carte de crédit requise.</p>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-slate-100">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">Un Apprentissage Simple en 3 Étapes</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <FeatureCard icon={<BookOpenIcon className="w-10 h-10"/>} title="1. Choisissez un Cas">
                            Sélectionnez un sujet parmi une vaste bibliothèque de thèmes pertinents pour la pratique quotidienne en officine.
                        </FeatureCard>
                        <FeatureCard icon={<DocumentTextIcon className="w-10 h-10"/>} title="2. Analysez la Mémofiche">
                            Étudiez un scénario patient réaliste, les questions clés à poser, les recommandations et les signaux d'alerte, le tout généré par l'IA.
                        </FeatureCard>
                        <FeatureCard icon={<CheckCircleIcon className="w-10 h-10"/>} title="3. Testez vos Connaissances">
                            Validez votre compréhension avec un quiz interactif et recevez des explications détaillées pour chaque réponse.
                        </FeatureCard>
                    </div>
                </div>
            </section>

            {/* Video Presentation Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10">Découvrez PharmIA en Action</h2>
                    <div className="relative max-w-4xl mx-auto shadow-2xl rounded-xl overflow-hidden" style={{ paddingBottom: '56.25%', height: 0 }}>
                        <iframe
                            src="https://www.youtube.com/embed/sR3C9j3Tcqo?modestbranding=1&showinfo=0&rel=0"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="Présentation PharmIA"
                            className="absolute top-0 left-0 w-full h-full"
                        ></iframe>
                    </div>
                </div>
            </section>

            {/* Learning Themes Section */}
            <section className="py-20 bg-slate-100">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">Nos Thèmes d'Apprentissage</h2>
                         <p className="mt-3 max-w-2xl mx-auto text-md text-slate-600">
                            Entraînez-vous sur un large éventail de cas de comptoir, des plus courants aux plus complexes.
                        </p>
                    </div>
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                            {learningThemes.map(theme => (
                                <ThemeCard key={theme} title={theme.split(' (')[0]} />
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Trainers Section */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Nos Formateurs Experts</h2>
                        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600">
                            Une équipe de professionnels passionnés à votre service.
                        </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                        {trainers.map((trainer, index) => (
                            <div key={index} className="group relative flex flex-col items-center text-center bg-white p-6 rounded-xl shadow-md border border-gray-200/80 overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 w-72">
                                <img src={trainer.imageUrl} alt={trainer.name} className="w-28 h-28 rounded-full object-cover mb-4 border-4 border-white ring-2 ring-teal-500" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-1">{trainer.name}</h3>
                                <p className="text-teal-700 font-medium text-sm">{trainer.title}</p>

                                <div className="absolute inset-0 bg-teal-600 bg-opacity-95 flex flex-col items-center justify-center p-4 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white">
                                    <h3 className="text-xl font-bold mb-3">{trainer.name}</h3>
                                    <div className="space-y-2 text-sm">
                                        {trainer.phone && (
                                            <a href={`tel:${trainer.phone}`} className="flex items-center gap-2 hover:underline">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.106l-1.412-.353a1.125 1.125 0 0 1-.924-.24l-.46-.309A1.125 1.125 0 0 0 15 12.75V15m0 0l-2.25 2.25M15 15l2.25-2.25M15 15h3.75m-3.75 0H12m-2.25-4.5H12m-2.25 0H9.75m-2.25 0H7.5m-2.25 0H5.25M2.25 6.75h-.008v.008H2.25V6.75Zm.008 0H2.25V6.75h.008Z" /></svg>
                                                {trainer.phone}
                                            </a>
                                        )}
                                        {trainer.email && (
                                            <a href={`mailto:${trainer.email}`} className="flex items-center gap-2 hover:underline">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H4.5a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5H4.5A2.25 2.25 0 0 0 2.25 6.75m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.903l-11.25 6.468a2.25 2.25 0 0 1-2.102 0L2.25 8.993A2.25 2.25 0 0 1 1.18 7.03M2.25 6.75h-.008v.008H2.25V6.75Z" /></svg>
                                                {trainer.email}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why PharmIA Section */}
            <section className="py-20 bg-slate-100">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                   <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold">Pourquoi choisir PharmIA ?</h2>
                         <p className="mt-3 max-w-2xl mx-auto text-md text-slate-600">
                           Nous combinons l'expertise pharmaceutique avec la puissance de l'intelligence artificielle pour une formation unique.
                        </p>
                    </div>
                   <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <FeatureCard icon={<SparklesIcon className="w-10 h-10"/>} title="Scénarios Illimités">
                            Générez des études de cas uniques à la demande pour ne jamais cesser d'apprendre. Chaque session est une nouvelle expérience.
                        </FeatureCard>
                        <FeatureCard icon={<QuestionMarkCircleIcon className="w-10 h-10"/>} title="Quiz Interactifs">
                            Renforcez vos acquis avec des quiz sur mesure qui ciblent les points essentiels de chaque cas de comptoir.
                        </FeatureCard>
                        <FeatureCard icon={<CommunicationIcon className="w-10 h-10"/>} title="Assistant Pédagogique">
                            Approfondissez votre analyse en posant des questions à notre assistant IA, disponible pour vous guider à chaque étape.
                        </FeatureCard>
                   </div>
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="py-20 bg-white">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                     <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Prêt à booster vos compétences ?</h2>
                    <p className="max-w-xl mx-auto text-md text-slate-600 mb-8">
                         Rejoignez des centaines de pharmaciens et préparateurs qui se forment avec PharmIA.
                    </p>
                    <button
                        onClick={handleStartLearning}
                        className="inline-block bg-teal-600 text-white font-bold px-8 py-4 rounded-lg hover:bg-teal-700 transition-transform duration-300 hover:scale-105 text-lg shadow-lg"
                    >
                        Démarrer mon essai de 14 jours
                    </button>
                     <p className="mt-4 text-sm text-slate-500">Accès complet. Sans carte de crédit requise.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-800 text-slate-300 py-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
                    <p>&copy; {new Date().getFullYear()} PharmIA. Tous droits réservés.</p>
                    <p className="mt-2">Micro-apprentissage adaptatif pour l'officine.</p>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;