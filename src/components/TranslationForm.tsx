import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LanguageSelector, type LanguageCode } from "./LanguageSelector";
import { Loader2, ArrowRight, Code2, Search, HandMetal, Maximize2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SyncedCodeEditors } from "./SyncedCodeEditors";
import { FullscreenTranslationMode } from "./FullscreenTranslationMode";

import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";

interface HighlightedSegment {
  text: string;
  isTranslatable: boolean;
  startIndex: number;
  endIndex: number;
}

export const TranslationForm = () => {
  const { language } = useLanguage();
  const t = translations.form[language];
  const tEditor = translations.editor[language];
  const [input, setInput] = useState("");
  const [sourceLang, setSourceLang] = useState<LanguageCode>('en');
  const [targetLang, setTargetLang] = useState<LanguageCode>('ar');
  const [translatedContent, setTranslatedContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [highlightedSegments, setHighlightedSegments] = useState<HighlightedSegment[]>([]);
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [translationProgress, setTranslationProgress] = useState({ current: 0, total: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    const translatableSegments = highlightedSegments.filter(seg => seg.isTranslatable);
    
    if (translatableSegments.length === 0) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' 
          ? "لا توجد نصوص محددة للترجمة" 
          : "No texts selected for translation",
        variant: "destructive",
      });
      return;
    }

    if (sourceLang === targetLang) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' 
          ? "لغة المصدر والهدف يجب أن تكون مختلفة" 
          : "Source and target languages must be different",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setTranslationProgress({ current: 0, total: translatableSegments.length });
    
    // TODO: Add your translation API here
    // Example structure:
    // const translatedTexts = await yourTranslationAPI(textsToTranslate, sourceLang, targetLang);
    
    toast({
      title: language === 'ar' ? "انتظر" : "Wait",
      description: language === 'ar' 
        ? "يجب إضافة طريقة ترجمة أولاً" 
        : "Translation method needs to be added first",
      variant: "destructive",
    });
    
    setIsLoading(false);
    setTranslationProgress({ current: 0, total: 0 });
  };

  return (
    <>
      {isFullscreen && (
        <FullscreenTranslationMode
          initialCode={input}
          highlightedSegments={highlightedSegments}
          onClose={() => setIsFullscreen(false)}
          onSegmentClick={(index) => {
            setSelectedSegmentIndex(selectedSegmentIndex === index ? null : index);
          }}
          selectedSegmentIndex={selectedSegmentIndex}
        />
      )}

      <div className="w-full max-w-7xl mx-auto space-y-6">
        <Card className="p-6 shadow-card hover:shadow-glow transition-all duration-300 relative">
          {/* Fullscreen Button */}
          {input.trim() && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(true)}
              className="absolute top-4 right-4 z-10 hover:bg-primary/10"
              title={language === 'ar' ? 'وضع ملء الشاشة' : 'Fullscreen Mode'}
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
          )}

          <SyncedCodeEditors
          inputValue={input}
          outputValue={translatedContent}
          onInputChange={(value) => {
            setInput(value);
            setHighlightedSegments([]);
          }}
          inputSegments={highlightedSegments.length > 0 ? highlightedSegments : undefined}
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

        {highlightedSegments.length > 0 && (
          <>
            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <LanguageSelector
                value={sourceLang}
                onChange={setSourceLang}
                label={t.sourceLanguage}
              />
              <LanguageSelector
                value={targetLang}
                onChange={setTargetLang}
                label={t.targetLanguage}
              />
            </div>

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
          </>
        )}
        </Card>
      </div>
    </>
  );
};
