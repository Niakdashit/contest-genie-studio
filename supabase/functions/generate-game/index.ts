
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config } = await req.json();
    const apiKey = Deno.env.get('GAME_GENERATION_API_KEY');

    if (!apiKey) {
      throw new Error('API key not configured');
    }

    // Simulate AI generation with OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a game contest generator. Based on the user prompt, generate appropriate game content and configuration.'
          },
          {
            role: 'user',
            content: `Generate a contest game based on this prompt: ${config.prompt}. Brand URL: ${config.brandUrl}. Game type preference: ${config.gameType || 'auto-detect'}. Theme: ${config.dominantColor}`
          }
        ],
        temperature: 0.7,
      }),
    });

    const aiResponse = await response.json();
    const aiSuggestion = aiResponse.choices[0].message.content;

    // Process the AI response and generate game data
    const gameData = generateGameFromPrompt(config, aiSuggestion);

    return new Response(JSON.stringify({ gameData }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-game function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateGameFromPrompt(config: any, aiSuggestion: string): any {
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

  // Génération du contenu basé sur le prompt et l'IA
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
    content: generateGameContent(gameType, theme, brandName, aiSuggestion),
    logo: config.logo,
    backgroundImage: config.backgroundImage
  };
}

function extractBrandName(text: string): string {
  const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
  if (urlMatch) {
    return urlMatch[1].split('.')[0];
  }
  
  const brandWords = text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g);
  return brandWords?.[0] || 'Votre Marque';
}

function extractTheme(prompt: string): string {
  if (prompt.includes('sport') || prompt.includes('dynamique') || prompt.includes('énergie')) return 'sport';
  if (prompt.includes('noël') || prompt.includes('festif') || prompt.includes('hiver')) return 'christmas';
  if (prompt.includes('été') || prompt.includes('soleil') || prompt.includes('plage')) return 'summer';
  if (prompt.includes('luxe') || prompt.includes('premium') || prompt.includes('élégant')) return 'luxury';
  if (prompt.includes('cosy') || prompt.includes('café') || prompt.includes('chaleureux')) return 'cozy';
  return 'modern';
}

function generateGameContent(type: string, theme: string, brandName: string, aiSuggestion: string) {
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
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, (num >> 8 & 0x00FF) + amount));
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}
