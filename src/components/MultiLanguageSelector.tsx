import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { type LanguageCode, LANGUAGES } from "./LanguageSelector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";

interface MultiLanguageSelectorProps {
  mode: 'single' | 'multi';
  sourceLang: LanguageCode;
  targetLangs: LanguageCode[];
  onSourceLangChange: (lang: LanguageCode) => void;
  onTargetLangsChange: (langs: LanguageCode[]) => void;
}

export const MultiLanguageSelector = ({
  mode,
  sourceLang,
  targetLangs,
  onSourceLangChange,
  onTargetLangsChange,
}: MultiLanguageSelectorProps) => {
  const { language } = useLanguage();

  const toggleTargetLang = (lang: LanguageCode) => {
    if (targetLangs.includes(lang)) {
      onTargetLangsChange(targetLangs.filter(l => l !== lang));
    } else {
      if (mode === 'single') {
        onTargetLangsChange([lang]);
      } else {
        onTargetLangsChange([...targetLangs, lang]);
      }
    }
  };

  const getLanguageName = (code: LanguageCode) => {
    const lang = LANGUAGES.find(l => l.code === code);
    return lang ? `${lang.flag} ${lang.nativeName}` : code;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Source Language */}
      <Select value={sourceLang} onValueChange={onSourceLangChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs bg-card border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span className="text-xs">{lang.nativeName}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">→</span>

      {/* Target Languages */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 min-w-[140px] justify-start text-xs">
            {targetLangs.length === 0 
              ? (language === 'ar' ? 'اختر اللغات' : 'Select Languages')
              : targetLangs.length === 1
              ? getLanguageName(targetLangs[0])
              : `${targetLangs.length} ${language === 'ar' ? 'لغات' : 'languages'}`
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-2">
            <h4 className="font-medium text-sm mb-3">
              {language === 'ar' ? 'اختر لغات الترجمة' : 'Select Target Languages'}
            </h4>
            <div className="grid gap-2 max-h-[300px] overflow-y-auto">
              {LANGUAGES.filter(lang => lang.code !== sourceLang).map((lang) => (
                <label
                  key={lang.code}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={targetLangs.includes(lang.code)}
                    onCheckedChange={() => toggleTargetLang(lang.code)}
                  />
                  <span className="text-xl">{lang.flag}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{lang.nativeName}</div>
                    <div className="text-xs text-muted-foreground">{lang.name}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Selected Languages Badges */}
      {targetLangs.length > 0 && (
        <div className="flex items-center gap-1 max-w-[200px] overflow-x-auto">
          {targetLangs.slice(0, 3).map((langCode) => {
            const lang = LANGUAGES.find(l => l.code === langCode);
            if (!lang) return null;
            return (
              <div
                key={langCode}
                className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs"
              >
                <span>{lang.flag}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-3 w-3 p-0 hover:bg-destructive/20"
                  onClick={() => toggleTargetLang(langCode)}
                >
                  <X className="h-2 w-2" />
                </Button>
              </div>
            );
          })}
          {targetLangs.length > 3 && (
            <span className="text-xs text-muted-foreground">+{targetLangs.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
};
