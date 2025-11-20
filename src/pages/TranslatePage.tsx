import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { type LanguageCode } from "@/components/LanguageSelector";
import { MultiLanguageSelector } from "@/components/MultiLanguageSelector";
import { SplitViewEditor } from "@/components/SplitViewEditor";
import { CodeEditor } from "@/components/CodeEditor";

interface HighlightedSegment {
  text: string;
  isTranslatable: boolean;
  startIndex: number;
  endIndex: number;
}

const TranslatePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useLanguage();
  const t = translations.form[language];
  const { toast } = useToast();

  // Get data from navigation state
  const { initialCode = "", highlightedSegments = [] } = location.state || {};

  const [translationMode, setTranslationMode] = useState<'single' | 'multi' | null>(null);
  const [sourceLang, setSourceLang] = useState<LanguageCode>('en');
  const [targetLangs, setTargetLangs] = useState<LanguageCode[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<Partial<Record<LanguageCode, string>>>({});
  const [showSplitView, setShowSplitView] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);

  const editorScrollRef = useRef<HTMLDivElement>(null);

  // Redirect if no data provided
  useEffect(() => {
    if (!initialCode) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "لا يوجد كود للترجمة" : "No code to translate",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [initialCode, navigate, language, toast]);

  const handleTranslate = async () => {
    if (translationMode === 'single' && targetLangs.length === 0) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "الرجاء اختيار لغة الهدف" : "Please select target language",
        variant: "destructive",
      });
      return;
    }

    if (translationMode === 'multi' && targetLangs.length === 0) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "الرجاء اختيار لغة واحدة على الأقل" : "Please select at least one language",
        variant: "destructive",
      });
      return;
    }

    if (sourceLang === targetLangs[0] && targetLangs.length === 1) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' 
          ? "لغة المصدر والهدف يجب أن تكون مختلفة" 
          : "Source and target languages must be different",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    const translatableSegments = highlightedSegments.filter((seg: HighlightedSegment) => seg.isTranslatable);
    setTranslationProgress({ current: 0, total: translatableSegments.length * targetLangs.length });
    
    // TODO: Add your translation API here
    // Simulate translation for now
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock translated content
    const mockTranslations: Partial<Record<LanguageCode, string>> = {};
    targetLangs.forEach(lang => {
      mockTranslations[lang] = `/* Translated to ${lang} */\n${initialCode}`;
    });
    
    setTranslatedContent(mockTranslations);
    setShowSplitView(true);
    setIsTranslating(false);
    setTranslationProgress({ current: 0, total: 0 });
    
    toast({
      title: language === 'ar' ? "تمت الترجمة!" : "Translation Complete!",
      description: language === 'ar' 
        ? `تمت الترجمة إلى ${targetLangs.length} لغة` 
        : `Translated to ${targetLangs.length} language(s)`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-50 h-16 border-b border-border bg-card/95 backdrop-blur-sm flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          {/* Translation Mode Selection */}
          {!showSplitView && (
            <div className="flex gap-2">
              <Button
                variant={translationMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setTranslationMode('single');
                  setTargetLangs([]);
                }}
              >
                {language === 'ar' ? 'ترجمة أحادية' : 'Single Translation'}
              </Button>
              <Button
                variant={translationMode === 'multi' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setTranslationMode('multi');
                  setTargetLangs([]);
                }}
              >
                {language === 'ar' ? 'ترجمة متعددة' : 'Multi Translation'}
              </Button>
            </div>
          )}

          {/* Language Selection */}
          {translationMode && !showSplitView && (
            <div className="flex items-center gap-3">
              <div className="h-8 w-px bg-border" />
              <MultiLanguageSelector
                mode={translationMode}
                sourceLang={sourceLang}
                targetLangs={targetLangs}
                onSourceLangChange={setSourceLang}
                onTargetLangsChange={setTargetLangs}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Translate Button */}
          {translationMode && targetLangs.length > 0 && !showSplitView && (
            <Button
              onClick={handleTranslate}
              disabled={isTranslating}
              variant="hero"
              size="sm"
              className="gap-2"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {language === 'ar' 
                    ? `جاري الترجمة... (${translationProgress.current}/${translationProgress.total})` 
                    : `Translating... (${translationProgress.current}/${translationProgress.total})`
                  }
                </>
              ) : (
                <>
                  {t.translate}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-destructive/10 hover:text-destructive"
            title={language === 'ar' ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-hidden">
        {showSplitView ? (
          <SplitViewEditor
            originalCode={initialCode}
            translatedContent={translatedContent}
            targetLangs={targetLangs}
          />
        ) : (
          <div className="h-full overflow-auto" ref={editorScrollRef}>
            <div className="max-w-7xl mx-auto p-6">
              <CodeEditor
                value={initialCode}
                segments={highlightedSegments}
                onSegmentClick={(index) => {
                  setSelectedSegmentIndex(selectedSegmentIndex === index ? null : index);
                }}
                selectedSegmentIndex={selectedSegmentIndex}
                scrollRef={editorScrollRef}
                className="min-h-[calc(100vh-8rem)]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranslatePage;
