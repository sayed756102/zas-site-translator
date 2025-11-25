import { Globe, Zap, Code, Shield, Languages, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

const featureIcons = [Globe, Zap, Code, Shield, Languages, Sparkles];

export const Features = () => {
  const { language } = useLanguage();
  const t = translations.features[language];

  return (
    <section className="py-20 px-4 bg-gradient-subtle">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{t.title}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t.description}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {t.items.map((feature, index) => {
            const Icon = featureIcons[index];
            return (
              <Card
                key={index}
                className="p-6 hover:shadow-glow transition-all duration-300 hover:-translate-y-2 bg-card border-border"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
  
