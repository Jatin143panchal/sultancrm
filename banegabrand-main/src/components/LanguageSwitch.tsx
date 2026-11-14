import { useLanguage, Language } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";

export function LanguageSwitch() {
  const { language, setLanguage } = useLanguage();

  const options: { code: Language; label: string; sub: string }[] = [
    { code: "en", label: "English", sub: "Default" },
    { code: "hinglish", label: "Hinglish", sub: "Hindi + English" },
    { code: "hi", label: "हिन्दी", sub: "Pure Hindi" },
  ];

  const currentOption = options.find((o) => o.code === language) || options[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs font-medium border-muted-foreground/30">
          <Globe className="h-3.5 w-3.5 text-primary" />
          <span>{currentOption.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {options.map((opt) => (
          <DropdownMenuItem
            key={opt.code}
            onClick={() => setLanguage(opt.code)}
            className="flex items-center justify-between text-xs cursor-pointer py-1.5"
          >
            <div>
              <p className="font-medium">{opt.label}</p>
              <p className="text-[10px] text-muted-foreground">{opt.sub}</p>
            </div>
            {language === opt.code && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
