import { useState, useRef, useEffect } from "react";
import { CodeEditor } from "./CodeEditor";
import { type LanguageCode, LANGUAGES } from "./LanguageSelector";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Copy, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";

interface SplitViewEditorProps {
  originalCode: string;
  translatedContent: Partial<Record<LanguageCode, string>>;
  targetLangs: LanguageCode[];
}

export const SplitViewEditor = ({
  originalCode,
  translatedContent,
  targetLangs,
}: SplitViewEditorProps) => {
  const { language } = useLanguage();
  const t = translations.editor[language];
  const { toast } = useToast();

  const [selectedLang, setSelectedLang] = useState<LanguageCode>(targetLangs[0]);
  const [originalCodeState, setOriginalCodeState] = useState(originalCode);
  const [translatedCodeState, setTranslatedCodeState] = useState(translatedContent[selectedLang] || "");

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const isScrollingSyncRef = useRef(false);

  // Update translated code when language changes
  useEffect(() => {
    setTranslatedCodeState(translatedContent[selectedLang] || "");
  }, [selectedLang, translatedContent]);

  // Synchronized scrolling
  const handleLeftScroll = () => {
    if (isScrollingSyncRef.current || !leftScrollRef.current || !rightScrollRef.current) return;
    
    isScrollingSyncRef.current = true;
    rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    rightScrollRef.current.scrollLeft = leftScrollRef.current.scrollLeft;
    
    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false;
    });
  };

  const handleRightScroll = () => {
    if (isScrollingSyncRef.current || !leftScrollRef.current || !rightScrollRef.current) return;
    
    isScrollingSyncRef.current = true;
    leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    leftScrollRef.current.scrollLeft = rightScrollRef.current.scrollLeft;
    
    requestAnimationFrame(() => {
      isScrollingSyncRef.current = false;
    });
  };

  const handleCopy = async (code: string, langCode?: LanguageCode) => {
    try {
      await navigator.clipboard.writeText(code);
      const langName = langCode ? LANGUAGES.find(l => l.code === langCode)?.nativeName : '';
      toast({
        title: language === 'ar' ? "تم النسخ!" : "Copied!",
        description: langName 
          ? `${language === 'ar' ? 'تم نسخ كود' : 'Copied'} ${langName}`
          : t.copiedDescription,
      });
    } catch (error) {
      toast({
        title: t.copyError,
        description: t.copyErrorDescription,
        variant: "destructive",
      });
    }
  };

  const handleDownload = (code: string, langCode: LanguageCode) => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated-${langCode}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: t.downloadedSuccess,
      description: `${LANGUAGES.find(l => l.code === langCode)?.nativeName}`,
    });
  };

  const currentLangInfo = LANGUAGES.find(l => l.code === selectedLang);

  return (
    <div className="h-full flex flex-col">
      {/* Language Tabs - Always show for multiple languages */}
      {targetLangs.length > 1 && (
        <div className="border-b border-border bg-card/50 px-4 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
            {targetLangs.map((langCode) => {
              const lang = LANGUAGES.find(l => l.code === langCode);
              if (!lang) return null;
              return (
                <Button
                  key={langCode}
                  variant={selectedLang === langCode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedLang(langCode)}
                  className="gap-2 shrink-0 transition-all"
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="text-xs font-medium">{lang.nativeName}</span>
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Split View */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* Original Code Panel */}
        <div className="flex flex-col border-r border-border bg-card/30">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
            <h3 className="text-sm font-medium">
              {language === 'ar' ? 'الكود الأصلي' : 'Original Code'}
            </h3>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCopy(originalCodeState)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto" ref={leftScrollRef} onScroll={handleLeftScroll}>
            <CodeEditor
              value={originalCodeState}
              onChange={setOriginalCodeState}
              scrollRef={leftScrollRef}
              className="h-full border-0 rounded-none"
            />
          </div>
        </div>

        {/* Translated Code Panel */}
        <div className="flex flex-col bg-card/30">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">
                {language === 'ar' ? 'الكود المترجم' : 'Translated Code'}
              </h3>
              {currentLangInfo && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>{currentLangInfo.flag}</span>
                  <span>{currentLangInfo.nativeName}</span>
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleCopy(translatedCodeState, selectedLang)}
              >
                <Copy className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleDownload(translatedCodeState, selectedLang)}
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto" ref={rightScrollRef} onScroll={handleRightScroll}>
            <CodeEditor
              value={translatedCodeState}
              onChange={setTranslatedCodeState}
              scrollRef={rightScrollRef}
              className="h-full border-0 rounded-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
