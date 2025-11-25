import logo from '@/assets/logo.png';
import { useLanguage } from "@/contexts/LanguageContext";
import { translations } from "@/lib/translations";
import { Facebook, Send, Users } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

export const Footer = () => {
  const { language } = useLanguage();
  const t = translations.footer[language];

  return (
    <footer className="bg-card border-t border-border py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <img src={logo} alt="ZAS Logo" className="w-12 h-12" />
            <div>
              <h3 className="text-2xl font-bold gradient-text">ZAS</h3>
              <p className="text-sm text-muted-foreground">{t.tagline}</p>
            </div>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="hover:bg-primary/10 hover:border-primary/40">
                {t.followUs}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3 bg-card">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start gap-2 hover:bg-primary/10 hover:border-primary/40"
                >
                  <a 
                    href="https://www.whatsapp.com/channel/0029Vb69TZgLI8YQ57JbSw2A" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Send className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start gap-2 hover:bg-primary/10 hover:border-primary/40"
                >
                  <a 
                    href="https://www.facebook.com/me/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start gap-2 hover:bg-primary/10 hover:border-primary/40"
                >
                  <a 
                    href="https://www.facebook.com/groups/2275552176209029/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Users className="h-4 w-4" />
                    Facebook Group
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="justify-start gap-2 hover:bg-primary/10 hover:border-primary/40"
                >
                  <a 
                    href="https://t.me/zaszase" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <Send className="h-4 w-4" />
                    Telegram
                  </a>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              {t.copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
  
