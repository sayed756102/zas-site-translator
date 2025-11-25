import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { TranslationForm } from "@/components/TranslationForm";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const Index = () => {
  const { language } = useLanguage();
  const t = translations.form[language];

  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      
      <main className="py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div id="translation-form" className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="gradient-text">{t.title}</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              {t.description}
            </p>
          </div>

          <TranslationForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
 
