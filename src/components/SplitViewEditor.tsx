import { useState, useRef, useEffect } from "react";
import { CodeEditor } from "./CodeEditor";
import { type LanguageCode, LANGUAGES } from "./LanguageSelector";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, Copy, Download, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

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

  // Generate Language Switcher Code
  const generateHTMLCode = () => {
    const links = targetLangs.map(langCode => {
      const lang = LANGUAGES.find(l => l.code === langCode);
      return `  <a href="index_${langCode}.html" class="lang-btn">\n    ${lang?.flag} ${lang?.nativeName}\n  </a>`;
    }).join('\n');
    
    return `<div class="zas-lang-switcher">\n${links}\n</div>`;
  };

  const generateCSSCode = () => {
    return `.zas-lang-switcher {
  display: flex;
  gap: 10px;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  flex-wrap: wrap;
}

.lang-btn {
  padding: 8px 15px;
  background: rgba(255,255,255,0.1);
  color: white;
  text-decoration: none;
  border-radius: 5px;
  transition: 0.3s;
  font-weight: 500;
}

.lang-btn:hover {
  background: rgba(255,255,255,0.2);
  transform: translateY(-2px);
}

.lang-btn.active {
  background: white;
  color: #667eea;
}`;
  };

  const generateReactCode = () => {
    const langItems = targetLangs.map(langCode => {
      const lang = LANGUAGES.find(l => l.code === langCode);
      return `    { code: '${langCode}', flag: '${lang?.flag}', name: '${lang?.nativeName}' }`;
    }).join(',\n');

    return `import { useState } from 'react';

const LanguageSwitcher = () => {
  const [currentLang, setCurrentLang] = useState('${targetLangs[0]}');
  
  const languages = [
${langItems}
  ];

  return (
    <div className="flex gap-2 p-4 bg-gradient-to-r from-purple-600 to-purple-800 rounded-lg flex-wrap">
      {languages.map(lang => (
        <button
          key={lang.code}
          onClick={() => setCurrentLang(lang.code)}
          className={\`px-4 py-2 rounded transition-all \${
            currentLang === lang.code 
              ? 'bg-white text-purple-600' 
              : 'bg-white/10 text-white hover:bg-white/20'
          }\`}
        >
          {lang.flag} {lang.name}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;`;
  };

  // CodeBlock Component
  const CodeBlock = ({ code }: { code: string }) => {
    const handleCopyCode = async () => {
      try {
        await navigator.clipboard.writeText(code);
        toast({
          title: language === 'ar' ? "تم النسخ!" : "Copied!",
          description: language === 'ar' ? "الكود جاهز للصق" : "Code ready to paste",
        });
      } catch (error) {
        toast({
          title: language === 'ar' ? "فشل النسخ" : "Copy failed",
          variant: "destructive",
        });
      }
    };

    return (
      <div className="relative group">
        <Button
          size="sm"
          variant="secondary"
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          onClick={handleCopyCode}
        >
          <Copy className="w-3 h-3 mr-1" />
          {language === 'ar' ? 'نسخ' : 'Copy'}
        </Button>
        <pre className="bg-black/90 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-primary/20">
          <code>{code}</code>
        </pre>
      </div>
    );
  };

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

      {/* Language Switcher Generator - Only for Multi Translation */}
      {targetLangs.length > 1 && (
        <div className="border-t border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-bold">
                {language === 'ar' 
                  ? '🎯 إنشاء زر تبديل اللغات تلقائياً' 
                  : '🎯 Generate Language Switcher'}
              </h3>
            </div>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground">
              {language === 'ar'
                ? 'انسخ هذا الكود وضعه في Header موقعك لتمكين الزوار من التبديل بين اللغات:'
                : 'Copy this code to your website header to allow visitors to switch languages:'}
            </p>

            {/* Tabs for HTML/CSS/React */}
            <Tabs defaultValue="html" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="css">CSS</TabsTrigger>
                <TabsTrigger value="react">React</TabsTrigger>
              </TabsList>
              
              <TabsContent value="html" className="mt-4">
                <CodeBlock code={generateHTMLCode()} />
              </TabsContent>
              
              <TabsContent value="css" className="mt-4">
                <CodeBlock code={generateCSSCode()} />
              </TabsContent>

              <TabsContent value="react" className="mt-4">
                <CodeBlock code={generateReactCode()} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};
