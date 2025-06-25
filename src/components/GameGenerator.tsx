
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Palette, Upload, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { GamePreview } from './GamePreview';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GameConfig {
  prompt: string;
  brandUrl: string;
  gameType: string;
  dominantColor: string;
  backgroundImage: File | null;
  logo: File | null;
}

interface GenerationLog {
  apiCalled: boolean;
  brandDataRetrieved: boolean;
  allInputsUsed: boolean;
  timestamp: string;
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
  const [generationLog, setGenerationLog] = useState<GenerationLog | null>(null);
  const { toast } = useToast();

  const handleFileUpload = (file: File, type: 'logo' | 'backgroundImage') => {
    setConfig({ ...config, [type]: file });
    toast({
      title: "Fichier uploadé",
      description: `${type === 'logo' ? 'Logo' : 'Image de fond'} ajouté avec succès`,
    });
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
    if (!config.prompt.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir une description de votre jeu concours",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    setGenerationLog(null);
    
    try {
      console.log('🚀 Démarrage de la génération du jeu...');
      
      // Conversion des fichiers uploadés
      let logoDataUrl = '';
      let backgroundDataUrl = '';
      
      if (config.logo) {
        logoDataUrl = await convertFileToDataUrl(config.logo);
        console.log('📷 Logo converti en base64');
      }
      
      if (config.backgroundImage) {
        backgroundDataUrl = await convertFileToDataUrl(config.backgroundImage);
        console.log('🖼️ Image de fond convertie en base64');
      }

      const configWithFiles = {
        ...config,
        logo: logoDataUrl,
        backgroundImage: backgroundDataUrl
      };

      toast({
        title: "Génération en cours",
        description: "Appel de l'API en cours...",
      });

      console.log('📡 Appel de la fonction Edge avec configuration complète:', {
        hasPrompt: !!configWithFiles.prompt,
        hasBrandUrl: !!configWithFiles.brandUrl,
        hasGameType: !!configWithFiles.gameType,
        hasLogo: !!configWithFiles.logo,
        hasBackground: !!configWithFiles.backgroundImage,
        dominantColor: configWithFiles.dominantColor
      });

      // Appel DIRECT à l'API via la fonction Edge
      const { data, error } = await supabase.functions.invoke('generate-game', {
        body: { config: configWithFiles }
      });

      if (error) {
        console.error('❌ Erreur lors de l\'appel API:', error);
        throw error;
      }

      console.log('✅ Réponse API reçue:', data);

      // Log de génération
      const log: GenerationLog = {
        apiCalled: data.debug?.apiCalled || false,
        brandDataRetrieved: data.debug?.brandDataRetrieved || false,
        allInputsUsed: data.debug?.allInputsUsed || false,
        timestamp: new Date().toLocaleString()
      };

      setGenerationLog(log);
      setGeneratedGame(data.gameData);
      setShowPreview(true);

      toast({
        title: "Jeu généré avec succès !",
        description: `API appelée: ${log.apiCalled ? '✅' : '❌'} | Branding récupéré: ${log.brandDataRetrieved ? '✅' : '❌'}`,
      });

      console.log('🎯 Génération terminée avec succès !');
      console.log('📊 Statistiques:', log);

    } catch (error) {
      console.error('❌ Erreur lors de la génération:', error);
      toast({
        title: "Erreur de génération",
        description: "Impossible de générer le jeu. Vérifiez la console pour plus de détails.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
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
                  URL de la marque (branding automatique)
                </Label>
                <Input
                  id="brandUrl"
                  placeholder="https://exemple.com"
                  value={config.brandUrl}
                  onChange={(e) => setConfig({ ...config, brandUrl: e.target.value })}
                />
                <p className="text-xs text-gray-500">
                  Récupération automatique du logo, couleurs et ton de la marque
                </p>
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
                  Logo personnalisé (écrase le logo automatique)
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
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {config.logo.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="background" className="text-sm font-medium flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Image de fond personnalisée
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
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      {config.backgroundImage.name}
                    </span>
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

        {/* Log de génération */}
        {generationLog && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Journal de Génération
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  {generationLog.apiCalled ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Clé API appelée</span>
                </div>
                <div className="flex items-center gap-2">
                  {generationLog.brandDataRetrieved ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                  <span>Données marque récupérées</span>
                </div>
                <div className="flex items-center gap-2">
                  {generationLog.allInputsUsed ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                  )}
                  <span>Tous les inputs utilisés</span>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Génération terminée le {generationLog.timestamp}
              </p>
            </CardContent>
          </Card>
        )}

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
