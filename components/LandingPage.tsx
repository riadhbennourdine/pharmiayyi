import React from 'react';
import { TOPIC_CATEGORIES } from '../constants';
import { LogoIcon, CapsuleIcon, BookOpenIcon, DocumentTextIcon, CheckCircleIcon, SparklesIcon, QuestionMarkCircleIcon, CommunicationIcon } from './icons';

interface LandingPageProps {
  onStartLearning: () => void;
}

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


const LandingPage: React.FC<LandingPageProps> = ({ onStartLearning }) => {
    const learningThemes = TOPIC_CATEGORIES[0].topics.slice(0, 6); // Get first 6 topics for display

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
                        onClick={onStartLearning}
                        className="hidden sm:inline-block bg-teal-600 text-white font-bold px-6 py-2 rounded-lg hover:bg-teal-700 transition-transform duration-300 hover:scale-105"
                    >
                        Commencer
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
                        Mémofiches Conseils à l'Officine<br />avec <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-emerald-500 to-green-600">PharmIA</span>
                    </h1>
                    <p className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
                        Votre partenaire d'apprentissage intelligent pour exceller au comptoir grâce à des mémofiches interactives et des scénarios générés par l'IA.
                    </p>
                    <div className="mt-10">
                         <button
                            onClick={onStartLearning}
                            className="inline-block bg-teal-600 text-white font-bold px-8 py-4 rounded-lg hover:bg-teal-700 transition-transform duration-300 hover:scale-105 text-lg shadow-lg"
                        >
                            Commencer l'Entraînement
                        </button>
                    </div>
                </div>
            </section>

             {/* Learning Themes Section */}
            <section className="py-20">
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
            
            {/* Why PharmIA Section */}
            <section className="py-20">
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

            {/* CTA Section */}
            <section className="pb-24 pt-10 bg-white">
                 <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
                     <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">Prêt à booster vos compétences ?</h2>
                    <p className="max-w-xl mx-auto text-md text-slate-600 mb-8">
                         Explorez nos modules de micro-apprentissage adaptatif, conçus pour renforcer vos compétences sur les cas comptoir pratiques rencontrés au quotidien de l'officine.
                    </p>
                    <button
                        onClick={onStartLearning}
                        className="inline-block bg-teal-600 text-white font-bold px-8 py-4 rounded-lg hover:bg-teal-700 transition-transform duration-300 hover:scale-105 text-lg shadow-lg"
                    >
                        Accéder à la plateforme
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 border-t border-gray-200 bg-white">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
                    &copy; {new Date().getFullYear()} PharmIA. Micro-apprentissage adaptatif pour l'officine.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;