import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Palette, Upload, Globe } from 'lucide-react';
import { GamePreview } from './GamePreview';
import { supabase } from '@/integrations/supabase/client';

interface GameConfig {
  prompt: string;
  brandUrl: string;
  gameType: string;
  dominantColor: string;
  backgroundImage: File | null;
  logo: File | null;
}

export const GameGenerator = () => {
  const [config, setConfig] = useState<GameConfig>({
    prompt: '',
    brandUrl: '',
    gameType: '',
    dominantColor: '#3B82F6',
    backgroundImage: null,
    logo: null
  });

  const [generatedGame, setGeneratedGame] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = (file: File, type: 'logo' | 'backgroundImage') => {
    setConfig({ ...config, [type]: file });
  };

  const convertFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!config.prompt.trim()) return;
    
    setIsGenerating(true);
    
    try {
      // Convert uploaded files to data URLs for preview
      let logoDataUrl = '';
      let backgroundDataUrl = '';
      
      if (config.logo) {
        logoDataUrl = await convertFileToDataUrl(config.logo);
      }
      
      if (config.backgroundImage) {
        backgroundDataUrl = await convertFileToDataUrl(config.backgroundImage);
      }

      // Call the edge function to generate the game
      const { data, error } = await supabase.functions.invoke('generate-game', {
        body: { config: { ...config, logo: logoDataUrl, backgroundImage: backgroundDataUrl } }
      });

      if (error) throw error;

      setGeneratedGame(data.gameData);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating game:', error);
      // Fallback to local generation if API fails
      const gameData = generateGameFromPrompt({ ...config, logo: await convertFileToDataUrl(config.logo || new File([], '')), backgroundImage: await convertFileToDataUrl(config.backgroundImage || new File([], '')) });
      setGeneratedGame(gameData);
      setShowPreview(true);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateGameFromPrompt = (config: any): any => {
    const prompt = config.prompt.toLowerCase();
    
    // Détection intelligente du type de jeu
    let gameType = config.gameType;
    if (!gameType) {
      if (prompt.includes('roue') || prompt.includes('wheel') || prompt.includes('fortune')) {
        gameType = 'wheel';
      } else if (prompt.includes('gratter') || prompt.includes('scratch') || prompt.includes('carte')) {
        gameType = 'scratch';
      } else if (prompt.includes('quiz') || prompt.includes('question') || prompt.includes('réponse')) {
        gameType = 'quiz';
      } else {
        gameType = 'wheel'; // Default
      }
    }

    // Génération du contenu basé sur le prompt
    const brandName = extractBrandName(config.brandUrl || config.prompt);
    const theme = extractTheme(prompt);
    
    return {
      type: gameType,
      theme,
      brandName,
      colors: {
        primary: config.dominantColor,
        secondary: adjustColor(config.dominantColor, -20),
        accent: adjustColor(config.dominantColor, 40)
      },
      content: generateGameContent(gameType, theme, brandName),
      logo: config.logo,
      backgroundImage: config.backgroundImage
    };
  };

  const extractBrandName = (text: string): string => {
    const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
    if (urlMatch) {
      return urlMatch[1].split('.')[0];
    }
    
    const brandWords = text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g);
    return brandWords?.[0] || 'Votre Marque';
  };

  const extractTheme = (prompt: string): string => {
    if (prompt.includes('sport') || prompt.includes('dynamique') || prompt.includes('énergie')) return 'sport';
    if (prompt.includes('noël') || prompt.includes('festif') || prompt.includes('hiver')) return 'christmas';
    if (prompt.includes('été') || prompt.includes('soleil') || prompt.includes('plage')) return 'summer';
    if (prompt.includes('luxe') || prompt.includes('premium') || prompt.includes('élégant')) return 'luxury';
    if (prompt.includes('cosy') || prompt.includes('café') || prompt.includes('chaleureux')) return 'cozy';
    return 'modern';
  };

  const generateGameContent = (type: string, theme: string, brandName: string) => {
    switch (type) {
      case 'wheel':
        return {
          title: `Roue de la Fortune ${brandName}`,
          prizes: [
            '🎁 Cadeau Surprise',
            '🏆 Grand Prix',
            '🎯 Bon de Réduction 20%',
            '⭐ Produit Gratuit',
            '🎪 Tentez encore',
            '💎 Offre Exclusive',
            '🎨 Pack Découverte',
            '🚀 Avantage VIP'
          ]
        };
      case 'scratch':
        return {
          title: `Carte à Gratter ${brandName}`,
          winMessage: '🎉 Félicitations ! Vous avez gagné !',
          loseMessage: '😔 Pas de chance cette fois...'
        };
      case 'quiz':
        return {
          title: `Quiz ${brandName}`,
          questions: [
            {
              question: `Depuis quand ${brandName} vous accompagne ?`,
              answers: ['Moins d\'un an', '1-3 ans', '3-5 ans', 'Plus de 5 ans'],
              correct: 0
            },
            {
              question: `Quel est votre produit ${brandName} préféré ?`,
              answers: ['Le classique', 'La nouveauté', 'Le premium', 'Tous !'],
              correct: 3
            }
          ]
        };
      default:
        return {};
    }
  };

  const adjustColor = (hex: string, amount: number): string => {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
            Générateur de Jeux Concours IA
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Créez des jeux concours personnalisés de qualité professionnelle en quelques secondes
          </p>
        </div>

        <Card className="mb-8 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Configuration du Jeu Concours
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-sm font-medium">
                Décrivez votre jeu concours *
              </Label>
              <Textarea
                id="prompt"
                placeholder="Ex: Crée une roue de la fortune pour une marque de sport aux couleurs vives et à l'ambiance dynamique"
                value={config.prompt}
                onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                className="min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brandUrl" className="text-sm font-medium flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  URL de la marque
                </Label>
                <Input
                  id="brandUrl"
                  placeholder="https://exemple.com"
                  value={config.brandUrl}
                  onChange={(e) => setConfig({ ...config, brandUrl: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameType" className="text-sm font-medium">
                  Type de jeu
                </Label>
                <Select value={config.gameType} onValueChange={(value) => setConfig({ ...config, gameType: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Détection automatique" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wheel">Roue de la Fortune</SelectItem>
                    <SelectItem value="scratch">Carte à Gratter</SelectItem>
                    <SelectItem value="quiz">Quiz Interactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="color" className="text-sm font-medium flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Couleur dominante
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={config.dominantColor}
                    onChange={(e) => setConfig({ ...config, dominantColor: e.target.value })}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={config.dominantColor}
                    onChange={(e) => setConfig({ ...config, dominantColor: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo" className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Logo
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                    className="flex-1"
                  />
                  {config.logo && (
                    <span className="text-sm text-green-600">✓ {config.logo.name}</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background" className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Image de fond
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="background"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, 'backgroundImage');
                    }}
                    className="flex-1"
                  />
                  {config.backgroundImage && (
                    <span className="text-sm text-green-600">✓ {config.backgroundImage.name}</span>
                  )}
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!config.prompt.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-3 text-lg"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Génération en cours...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Générer le Jeu Concours
                </div>
              )}
            </Button>
          </CardContent>
        </Card>

        {showPreview && generatedGame && (
          <GamePreview
            gameData={generatedGame}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </div>
  );
};
