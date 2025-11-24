import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type LanguageCode } from "./LanguageSelector";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SyncedCodeEditors } from "./SyncedCodeEditors";
import { MultiLanguageSelector } from "./MultiLanguageSelector";
import { SplitViewEditor } from "./SplitViewEditor";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";


export const TranslationForm = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = translations.form[language];
  const tEditor = translations.editor[language];
  const [input, setInput] = useState("");
  const [sourceLang, setSourceLang] = useState<LanguageCode>('en');
  const [targetLangs, setTargetLangs] = useState<LanguageCode[]>([]);
  const [translationMode, setTranslationMode] = useState<'single' | 'multi' | null>(null);
  const [translatedContent, setTranslatedContent] = useState<Partial<Record<LanguageCode, string>>>({});
  const [showSplitView, setShowSplitView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (targetLangs.length === 0) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "الرجاء اختيار لغة واحدة على الأقل" : "Please select at least one language",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTranslationProgress({ current: 0, total: targetLangs.length });
    
    try {
      const { data, error } = await supabase.functions.invoke('translate-code', {
        body: {
          code: input,
          sourceLang,
          targetLang: translationMode === 'multi' ? targetLangs : targetLangs[0],
        },
      });

      if (error) throw error;

      if (translationMode === 'multi' && data.translations) {
        const newTranslations: Partial<Record<LanguageCode, string>> = {};
        data.translations.forEach((result: any, index: number) => {
          if (result.success) {
            newTranslations[targetLangs[index]] = result.translatedCode;
            setTranslationProgress(prev => ({ ...prev, current: index + 1 }));
          }
        });
        setTranslatedContent(newTranslations);
      } else if (data.success) {
        setTranslatedContent({ [targetLangs[0]]: data.translatedCode });
      } else {
        throw new Error(data.error || 'Translation failed');
      }

      setShowSplitView(true);
      setTranslationProgress({ current: 0, total: 0 });
      
      toast({
        title: language === 'ar' ? "تمت الترجمة!" : "Translation Complete!",
        description: language === 'ar' 
          ? `تمت الترجمة إلى ${targetLangs.length} لغة بواسطة ${data.provider || 'AI'}` 
          : `Translated to ${targetLangs.length} language(s) via ${data.provider || 'AI'}`,
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: language === 'ar' ? "خطأ في الترجمة" : "Translation Error",
        description: error instanceof Error ? error.message : language === 'ar' 
          ? "حدث خطأ أثناء الترجمة. يرجى المحاولة مرة أخرى." 
          : "An error occurred during translation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card className="p-6 shadow-card hover:shadow-glow transition-all duration-300">
        <SyncedCodeEditors
          inputValue={input}
          outputValue={showSplitView ? "" : ""}
          onInputChange={(value) => {
            setInput(value);
            setShowSplitView(false);
          }}
          inputPlaceholder={t.htmlPlaceholder}
          outputPlaceholder={tEditor.outputPlaceholder}
        />

        {!showSplitView && (
          <>
            {/* Translation Mode Selection */}
            <div className="flex gap-3 mt-6">
              <Button
                variant={translationMode === 'single' ? 'default' : 'outline'}
                size="lg"
                onClick={() => {
                  setTranslationMode('single');
                  setTargetLangs([]);
                }}
              >
                {language === 'ar' ? 'ترجمة أحادية' : 'Single Translation'}
              </Button>
              <Button
                variant={translationMode === 'multi' ? 'default' : 'outline'}
                size="lg"
                onClick={() => {
                  setTranslationMode('multi');
                  setTargetLangs([]);
                }}
              >
                {language === 'ar' ? 'ترجمة متعددة' : 'Multi Translation'}
              </Button>
            </div>

            {/* Language Selection */}
            {translationMode && (
              <>
                <div className="mt-6">
                  <MultiLanguageSelector
                    mode={translationMode}
                    sourceLang={sourceLang}
                    targetLangs={targetLangs}
                    onSourceLangChange={setSourceLang}
                    onTargetLangsChange={setTargetLangs}
                  />
                </div>

                {targetLangs.length > 0 && (
                  <Button
                    onClick={handleTranslate}
                    disabled={isLoading}
                    variant="hero"
                    size="lg"
                    className="w-full mt-6"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {language === 'ar' 
                          ? `جاري الترجمة... (${translationProgress.current}/${translationProgress.total})` 
                          : `Translating... (${translationProgress.current}/${translationProgress.total})`
                        }
                      </>
                    ) : (
                      <>
                        {t.translate}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </>
        )}

        {/* Split View Results */}
        {showSplitView && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">
                {language === 'ar' ? 'نتائج الترجمة' : 'Translation Results'}
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowSplitView(false);
                  setTranslatedContent({});
                }}
              >
                {language === 'ar' ? 'ترجمة جديدة' : 'New Translation'}
              </Button>
            </div>
            <SplitViewEditor
              originalCode={input}
              translatedContent={translatedContent}
              targetLangs={targetLangs}
            />
          </div>
          )}
        </Card>
      </div>
  );
};
