import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { type LanguageCode } from "./LanguageSelector";
import { MultiLanguageSelector } from "./MultiLanguageSelector";
import { SplitViewEditor } from "./SplitViewEditor";
import { CodeEditor } from "./CodeEditor";

interface HighlightedSegment {
  text: string;
  isTranslatable: boolean;
  startIndex: number;
  endIndex: number;
}

interface FullscreenTranslationModeProps {
  initialCode: string;
  highlightedSegments: HighlightedSegment[];
  onClose: () => void;
  onSegmentClick?: (index: number) => void;
  selectedSegmentIndex?: number | null;
}

export const FullscreenTranslationMode = ({
  initialCode,
  highlightedSegments,
  onClose,
  onSegmentClick,
  selectedSegmentIndex
}: FullscreenTranslationModeProps) => {
  const { language } = useLanguage();
  const t = translations.form[language];
  const { toast } = useToast();

  const [translationMode, setTranslationMode] = useState<'single' | 'multi' | null>(null);
  const [sourceLang, setSourceLang] = useState<LanguageCode>('en');
  const [targetLangs, setTargetLangs] = useState<LanguageCode[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState<Partial<Record<LanguageCode, string>>>({});
  const [showSplitView, setShowSplitView] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });

  const editorScrollRef = useRef<HTMLDivElement>(null);

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
    const translatableSegments = highlightedSegments.filter(seg => seg.isTranslatable);
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
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top Bar */}
      <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-4">
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
            onClick={onClose}
            className="hover:bg-destructive/10 hover:text-destructive"
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
                onSegmentClick={onSegmentClick}
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
