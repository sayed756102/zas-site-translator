import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type LanguageCode } from "./LanguageSelector";
import { Loader2, ArrowRight, Code2, Search, HandMetal, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SyncedCodeEditors } from "./SyncedCodeEditors";
import { MultiLanguageSelector } from "./MultiLanguageSelector";
import { SplitViewEditor } from "./SplitViewEditor";
import { supabase } from "@/integrations/supabase/client";

import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

interface HighlightedSegment {
  text: string;
  isTranslatable: boolean;
  startIndex: number;
  endIndex: number;
}

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
  const [highlightedSegments, setHighlightedSegments] = useState<HighlightedSegment[]>([]);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const analyzeCode = () => {
    if (!input.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "الرجاء إدخال الكود أولاً" : "Please enter code first",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    setTimeout(() => {
      const segments: HighlightedSegment[] = [];
      const code = input;
      
      // Regex patterns to find translatable strings
      const stringPatterns = [
        /"([^"\\]*(\\.[^"\\]*)*)"/g,  // Double quoted strings
        /'([^'\\]*(\\.[^'\\]*)*)'/g,  // Single quoted strings
        /`([^`\\]*(\\.[^`\\]*)*)`/g,  // Template literals
        />([^<>]+)</g,                // HTML text content
      ];

      const matches: Array<{ text: string; start: number; end: number }> = [];
      
      stringPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(code)) !== null) {
          const fullMatch = match[0];
          const innerText = match[1] || fullMatch.slice(1, -1);
          
          // Skip if it's just code-like content (variables, functions, etc)
          if (innerText && !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(innerText.trim()) && 
              innerText.trim().length > 0 && 
              !/^[\d\s\.\,\;\:\(\)\[\]\{\}]+$/.test(innerText)) {
            matches.push({
              text: fullMatch,
              start: match.index,
              end: match.index + fullMatch.length
            });
          }
        }
      });

      // Sort matches by position
      matches.sort((a, b) => a.start - b.start);

      let currentPos = 0;
      let wordCount = 0;
      
      matches.forEach(match => {
        // Add non-translatable segment before this match
        if (match.start > currentPos) {
          const beforeText = code.substring(currentPos, match.start);
          // Split non-translatable text into words too for consistency
          splitIntoWords(beforeText, currentPos, false).forEach(seg => segments.push(seg));
        }
        
        // Split translatable segment into individual words
        const translatableWords = splitIntoWords(match.text, match.start, true);
        translatableWords.forEach(seg => {
          segments.push(seg);
          if (seg.isTranslatable) wordCount++;
        });
        
        currentPos = match.end;
      });

      // Add remaining non-translatable content
      if (currentPos < code.length) {
        const remainingText = code.substring(currentPos);
        splitIntoWords(remainingText, currentPos, false).forEach(seg => segments.push(seg));
      }

      setHighlightedSegments(segments);
      setIsAnalyzing(false);
      
      toast({
        title: language === 'ar' ? "تم الفحص!" : "Analysis Complete!",
        description: language === 'ar' 
          ? `تم العثور على ${wordCount} كلمة قابلة للترجمة` 
          : `Found ${wordCount} translatable words`,
      });
    }, 500);
  };

  // Helper function to split text into words while preserving position
  const splitIntoWords = (text: string, startOffset: number, isTranslatable: boolean): HighlightedSegment[] => {
    const segments: HighlightedSegment[] = [];
    // Match words (including non-ASCII characters for RTL languages) and non-word characters separately
    const regex = /[\p{L}\p{N}]+|[^\p{L}\p{N}]+/gu;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const word = match[0];
      const wordStart = startOffset + match.index;
      const wordEnd = wordStart + word.length;
      
      // Words are translatable only if the parent segment was translatable AND it's actually a word (not spaces/punctuation)
      const isActualWord = /[\p{L}\p{N}]/u.test(word);
      
      segments.push({
        text: word,
        isTranslatable: isTranslatable && isActualWord,
        startIndex: wordStart,
        endIndex: wordEnd
      });
    }
    
    return segments;
  };

  const enableManualMode = () => {
    if (!input.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "الرجاء إدخال الكود أولاً" : "Please enter code first",
        variant: "destructive",
      });
      return;
    }

    setIsManualMode(true);
    
    // Split all text into individual words for manual selection
    const segments = splitIntoWords(input, 0, false);

    setHighlightedSegments(segments);
    
    toast({
      title: language === 'ar' ? "الوضع اليدوي مفعّل" : "Manual Mode Enabled",
      description: language === 'ar' 
        ? "اضغط على أي كلمة لإضافتها أو إلغائها من الترجمة" 
        : "Click any word to add or remove from translation",
    });
  };

  const toggleSegmentTranslation = (index: number) => {
    setHighlightedSegments(prev => 
      prev.map((seg, i) => 
        i === index ? { ...seg, isTranslatable: !seg.isTranslatable } : seg
      )
    );
    setSelectedSegmentIndex(null);
  };

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

  const handleFullscreen = () => {
    if (!input.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "الرجاء إدخال الكود أولاً" : "Please enter code first",
        variant: "destructive",
      });
      return;
    }

    navigate('/translate', {
      state: {
        initialCode: input,
        highlightedSegments: highlightedSegments
      }
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <Card className="p-6 shadow-card hover:shadow-glow transition-all duration-300 relative">
        {/* Fullscreen Button - Always Visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFullscreen}
          className="absolute top-4 right-4 z-10 hover:bg-primary/10"
          title={language === 'ar' ? 'وضع ملء الشاشة' : 'Fullscreen Mode'}
        >
          <Maximize2 className="h-5 w-5" />
        </Button>

          <SyncedCodeEditors
          inputValue={input}
          outputValue={showSplitView ? "" : ""}
          onInputChange={(value) => {
            setInput(value);
            setHighlightedSegments([]);
            setShowSplitView(false);
          }}
          inputSegments={highlightedSegments.length > 0 && !showSplitView ? highlightedSegments : undefined}
          onSegmentClick={(index) => {
            setSelectedSegmentIndex(selectedSegmentIndex === index ? null : index);
          }}
          selectedSegmentIndex={selectedSegmentIndex}
          inputPlaceholder={t.htmlPlaceholder}
          outputPlaceholder={tEditor.outputPlaceholder}
        />

        {selectedSegmentIndex !== null && highlightedSegments[selectedSegmentIndex] && (
          <div className="mt-4 p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {tEditor.selectedSegment}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSegmentTranslation(selectedSegmentIndex)}
              >
                {highlightedSegments[selectedSegmentIndex].isTranslatable 
                  ? (language === 'ar' ? 'إلغاء الترجمة' : 'Remove Translation')
                  : (language === 'ar' ? 'إضافة للترجمة' : 'Add Translation')
                }
              </Button>
            </div>
          </div>
        )}

        {highlightedSegments.length > 0 && (
          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => {
                setHighlightedSegments([]);
                setSelectedSegmentIndex(null);
                setIsManualMode(false);
              }}
              variant="ghost"
              size="lg"
            >
              {language === 'ar' ? 'إعادة تعيين' : 'Reset'}
            </Button>
          </div>
        )}

        {highlightedSegments.length > 0 && !showSplitView && (
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
