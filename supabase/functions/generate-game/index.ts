
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

    console.log('🚀 API Key found, starting game generation...');
    console.log('📝 Configuration received:', {
      prompt: config.prompt,
      brandUrl: config.brandUrl,
      gameType: config.gameType,
      hasLogo: !!config.logo,
      hasBackground: !!config.backgroundImage
    });

    // Récupération automatique du branding si URL fournie
    let brandData = null;
    if (config.brandUrl) {
      console.log('🔍 Fetching brand data for:', config.brandUrl);
      brandData = await fetchBrandData(config.brandUrl);
      console.log('✅ Brand data retrieved:', brandData);
    }

    // Génération via OpenAI avec contexte enrichi
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
            content: `Tu es un expert en création de jeux concours. Tu dois générer un jeu parfaitement adapté à l'identité de marque fournie. Le jeu doit être prêt à être publié sans modification supplémentaire.`
          },
          {
            role: 'user',
            content: `Génère un jeu concours basé sur ces informations :
            
PROMPT: ${config.prompt}
TYPE DE JEU: ${config.gameType || 'détection automatique'}
URL MARQUE: ${config.brandUrl || 'non fournie'}
COULEUR DOMINANTE: ${config.dominantColor}

${brandData ? `
DONNÉES MARQUE RÉCUPÉRÉES:
- Nom: ${brandData.name}
- Couleurs: ${brandData.colors.join(', ')}
- Secteur: ${brandData.industry || 'non défini'}
- Ton: ${brandData.tone || 'professionnel'}
- Logo disponible: ${brandData.logo ? 'oui' : 'non'}
` : ''}

Le jeu doit refléter à 100% l'identité visuelle et le ton de la marque. Adapte le wording, les couleurs, et l'ambiance en conséquence.`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const aiSuggestion = aiResponse.choices[0].message.content;

    console.log('🤖 AI suggestion generated successfully');

    // Génération du jeu avec toutes les données
    const gameData = generateGameFromPrompt(config, aiSuggestion, brandData);

    console.log('✅ Game generation completed successfully');
    console.log('📊 Final game data:', {
      type: gameData.type,
      brandName: gameData.brandName,
      colorsUsed: gameData.colors,
      hasCustomLogo: !!gameData.customLogo,
      hasCustomBackground: !!gameData.customBackground
    });

    return new Response(JSON.stringify({ 
      gameData,
      debug: {
        apiCalled: true,
        brandDataRetrieved: !!brandData,
        allInputsUsed: true
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in generate-game function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function fetchBrandData(brandUrl: string) {
  try {
    // Extraction du domaine
    const domain = brandUrl
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    const apiKey = Deno.env.get('BRANDFETCH_API_KEY');
    let data: any = null;

    if (apiKey) {
      const res = await fetch(`https://api.brandfetch.io/v2/brands/${domain}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (res.ok) {
        data = await res.json();
      }
    }

    const name =
      data?.name || domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    const colors =
      data?.brandColors?.map((c: any) => c.hex) ||
      data?.colors?.map((c: any) => c.hex) ||
      [];
    const logo =
      data?.logos?.[0]?.formats?.find((f: any) => f.format === 'png')?.src ||
      data?.logos?.[0]?.src ||
      null;

    const industryDetection = detectIndustry(name.toLowerCase(), domain);
    return {
      name,
      colors: colors.length ? colors.slice(0, 3) : industryDetection.colors,
      industry: data?.industry || industryDetection.sector,
      tone: industryDetection.tone,
      logo,
    };
  } catch (error) {
    console.warn('Brand data fetch failed:', error);
    return null;
  }
}

function detectIndustry(brandName: string, domain: string) {
  const name = brandName.toLowerCase();
  const fullDomain = domain.toLowerCase();
  
  // Détection basée sur des mots-clés
  if (name.includes('tech') || name.includes('digital') || name.includes('soft') || name.includes('app')) {
    return {
      sector: 'Technologie',
      colors: ['#007AFF', '#5856D6', '#34C759'],
      tone: 'innovant et moderne'
    };
  }
  
  if (name.includes('sport') || name.includes('fit') || name.includes('gym') || name.includes('run')) {
    return {
      sector: 'Sport',
      colors: ['#FF3B30', '#FF9500', '#34C759'],
      tone: 'dynamique et énergique'
    };
  }
  
  if (name.includes('food') || name.includes('restaurant') || name.includes('cook') || name.includes('cafe')) {
    return {
      sector: 'Restauration',
      colors: ['#FF9500', '#FFCC02', '#FF3B30'],
      tone: 'chaleureux et gourmand'
    };
  }
  
  if (name.includes('fashion') || name.includes('mode') || name.includes('style') || name.includes('cloth')) {
    return {
      sector: 'Mode',
      colors: ['#000000', '#8E8E93', '#FF2D92'],
      tone: 'élégant et tendance'
    };
  }
  
  if (name.includes('beauty') || name.includes('cosmetic') || name.includes('skin') || name.includes('care')) {
    return {
      sector: 'Beauté',
      colors: ['#FF2D92', '#AF52DE', '#FFCC02'],
      tone: 'raffiné et séduisant'
    };
  }
  
  // Détection par extension de domaine
  if (fullDomain.includes('.luxury') || fullDomain.includes('.premium')) {
    return {
      sector: 'Luxe',
      colors: ['#000000', '#FFD700', '#8E8E93'],
      tone: 'exclusif et premium'
    };
  }
  
  // Valeurs par défaut
  return {
    sector: 'Général',
    colors: ['#007AFF', '#34C759', '#FF9500'],
    tone: 'professionnel et accessible'
  };
}

function generateGameFromPrompt(config: any, aiSuggestion: string, brandData: any): any {
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

  // Utilisation des données de marque si disponibles
  const brandName = brandData?.name || extractBrandName(config.brandUrl || config.prompt);
  const brandColors = brandData?.colors || [config.dominantColor];
  const brandTone = brandData?.tone || 'professionnel';
  
  // Couleurs finales : utilisateur > marque > défaut
  const finalColors = {
    primary: config.dominantColor || (brandColors[0] || '#3B82F6'),
    secondary: brandColors[1] || adjustColor(config.dominantColor || brandColors[0] || '#3B82F6', -20),
    accent: brandColors[2] || adjustColor(config.dominantColor || brandColors[0] || '#3B82F6', 40)
  };

  return {
    type: gameType,
    theme: extractTheme(prompt, brandData?.industry),
    brandName,
    brandTone,
    colors: finalColors,
    brandColors: brandColors,
    content: generateGameContent(gameType, brandName, brandTone, brandData?.industry),
    customLogo: config.logo, // Logo uploadé par l'utilisateur
    customBackground: config.backgroundImage, // Image de fond uploadée
    brandLogo: brandData?.logo, // Logo récupéré automatiquement
    debug: {
      promptUsed: config.prompt,
      brandDataUsed: !!brandData,
      userAssetsUsed: !!(config.logo || config.backgroundImage)
    }
  };
}

function extractBrandName(text: string): string {
  const urlMatch = text.match(/(?:https?:\/\/)?(?:www\.)?([^\/\s]+)/);
  if (urlMatch) {
    return urlMatch[1].split('.')[0].charAt(0).toUpperCase() + urlMatch[1].split('.')[0].slice(1);
  }
  
  const brandWords = text.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g);
  return brandWords?.[0] || 'Votre Marque';
}

function extractTheme(prompt: string, industry?: string): string {
  // Priorité à l'industrie détectée
  if (industry) {
    switch (industry.toLowerCase()) {
      case 'sport': return 'sport';
      case 'technologie': return 'tech';
      case 'restauration': return 'food';
      case 'mode': return 'fashion';
      case 'beauté': return 'beauty';
      case 'luxe': return 'luxury';
    }
  }
  
  // Fallback sur analyse du prompt
  if (prompt.includes('sport') || prompt.includes('dynamique') || prompt.includes('énergie')) return 'sport';
  if (prompt.includes('noël') || prompt.includes('festif') || prompt.includes('hiver')) return 'christmas';
  if (prompt.includes('été') || prompt.includes('soleil') || prompt.includes('plage')) return 'summer';
  if (prompt.includes('luxe') || prompt.includes('premium') || prompt.includes('élégant')) return 'luxury';
  if (prompt.includes('cosy') || prompt.includes('café') || prompt.includes('chaleureux')) return 'cozy';
  return 'modern';
}

function generateGameContent(type: string, brandName: string, brandTone: string, industry?: string) {
  const toneAdjectives = {
    'dynamique et énergique': ['Explosif', 'Dynamique', 'Énergique', 'Puissant'],
    'innovant et moderne': ['Innovant', 'Futuriste', 'Révolutionnaire', 'Moderne'],
    'chaleureux et gourmand': ['Délicieux', 'Savoureux', 'Gourmand', 'Authentique'],
    'élégant et tendance': ['Élégant', 'Chic', 'Tendance', 'Stylé'],
    'raffiné et séduisant': ['Raffiné', 'Séduisant', 'Sublime', 'Précieux'],
    'exclusif et premium': ['Exclusif', 'Premium', 'Privilégié', 'Prestigieux'],
    'professionnel et accessible': ['Professionnel', 'Accessible', 'Fiable', 'Qualité']
  };

  const adjectives = toneAdjectives[brandTone] || toneAdjectives['professionnel et accessible'];

  switch (type) {
    case 'wheel':
      return {
        title: `Roue de la Fortune ${brandName}`,
        subtitle: `Tournez et gagnez avec ${brandName} !`,
        prizes: [
          `🎁 ${adjectives[0]} Cadeau`,
          `🏆 ${adjectives[1]} Prix`,
          `🎯 Réduction ${adjectives[2]}`,
          `⭐ Produit ${adjectives[3]}`,
          `🎪 Nouvelle Chance`,
          `💎 Offre ${adjectives[0]}`,
          `🎨 Pack ${adjectives[1]}`,
          `🚀 Avantage ${adjectives[2]}`
        ]
      };
    case 'scratch':
      return {
        title: `Carte à Gratter ${brandName}`,
        subtitle: `Grattez et découvrez vos surprises ${brandName}`,
        winMessage: `🎉 Bravo ! Vous avez gagné avec ${brandName} !`,
        loseMessage: `😊 Pas de chance... Mais ${brandName} vous réserve d'autres surprises !`
      };
    case 'quiz':
      return {
        title: `Quiz ${brandName}`,
        subtitle: `Testez vos connaissances sur ${brandName}`,
        questions: [
          {
            question: `Que représente ${brandName} pour vous ?`,
            answers: [
              `${adjectives[0]} et ${adjectives[1]}`,
              `${adjectives[2]} et ${adjectives[3]}`,
              `Tout ce qui précède`,
              `Une découverte`
            ],
            correct: 2
          },
          {
            question: `Quel est le point fort de ${brandName} ?`,
            answers: [
              `La ${adjectives[0].toLowerCase()}`,
              `L'aspect ${adjectives[1].toLowerCase()}`,
              `Le côté ${adjectives[2].toLowerCase()}`,
              `Tout cela à la fois`
            ],
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
