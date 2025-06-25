
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, RotateCcw } from 'lucide-react';

interface ScratchCardProps {
  gameData: any;
}

export const ScratchCard: React.FC<ScratchCardProps> = ({ gameData }) => {
  const [isScratching, setIsScratching] = useState(false);
  const [scratchedPercent, setScratchedPercent] = useState(0);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | null>(null);
  const [showResult, setShowResult] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isWinner] = useState(Math.random() > 0.3); // 70% chance de gagner

  const { content, colors, brandName, logo } = gameData;

  useEffect(() => {
    initializeCanvas();
  }, []);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 200;

    // Fond scratchable
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, colors.primary);
    gradient.addColorStop(1, colors.secondary);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Texture de grattage
    ctx.fillStyle = '#C0C0C0';
    ctx.globalCompositeOperation = 'overlay';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        Math.random() * 3 + 1,
        0,
        2 * Math.PI
      );
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Texte d'indication
    ctx.fillStyle = 'white';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Grattez ici !', canvas.width / 2, canvas.height / 2);
  };

  const scratch = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, 2 * Math.PI);
    ctx.fill();

    // Calculer le pourcentage gratté
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixelData = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixelData.length; i += 4) {
      if (pixelData[i] === 0) {
        transparentPixels++;
      }
    }

    const percent = (transparentPixels / (canvas.width * canvas.height)) * 100;
    setScratchedPercent(percent);

    if (percent > 30 && !showResult) {
      setGameResult(isWinner ? 'win' : 'lose');
      setShowResult(true);
    }
  };

  const resetCard = () => {
    setScratchedPercent(0);
    setGameResult(null);
    setShowResult(false);
    initializeCanvas();
  };

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10)`
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/50 to-orange-50/50" />
      <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full blur-xl opacity-40" />
      <div className="absolute bottom-4 left-4 w-20 h-20 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-xl opacity-40" />

      <div className="relative z-10 text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          {logo && (
            <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
          )}
          <h1 className="text-3xl font-bold text-gray-800">
            {content.title}
          </h1>
        </div>
        <p className="text-gray-600 text-lg">
          Grattez la carte pour découvrir votre lot !
        </p>
      </div>

      {/* Scratch Card */}
      <div className="relative mb-8">
        <div className="p-6 bg-white rounded-xl shadow-2xl border-4 border-gray-100">
          <div className="relative">
            {/* Hidden content */}
            <div 
              className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl rounded-lg"
              style={{ backgroundColor: isWinner ? '#22C55E' : '#EF4444' }}
            >
              {isWinner ? (
                <div className="text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <div>GAGNANT !</div>
                  <div className="text-lg font-normal mt-2">
                    {content.winMessage}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl mb-2">😔</div>
                  <div>PERDU</div>
                  <div className="text-lg font-normal mt-2">
                    {content.loseMessage}
                  </div>
                </div>
              )}
            </div>

            {/* Scratchable overlay */}
            <canvas
              ref={canvasRef}
              className="cursor-crosshair rounded-lg border-2 border-gray-200"
              onMouseDown={() => setIsScratching(true)}
              onMouseUp={() => setIsScratching(false)}
              onMouseMove={(e) => isScratching && scratch(e)}
              onClick={scratch}
            />
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="mt-4 text-center text-sm text-gray-500">
          Gratté: {Math.round(scratchedPercent)}%
        </div>
      </div>

      {/* Reset Button */}
      <Button
        onClick={resetCard}
        variant="outline"
        className="flex items-center gap-2 px-6 py-3 rounded-full shadow-lg"
      >
        <RotateCcw className="w-5 h-5" />
        Nouvelle Carte
      </Button>

      {/* Result Modal */}
      {showResult && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 mx-4 animate-pulse">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                {isWinner ? '🎉 Félicitations !' : '😔 Dommage !'}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-lg mb-4">
                {isWinner ? content.winMessage : content.loseMessage}
              </div>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowResult(false)}
                  variant="outline"
                >
                  Continuer
                </Button>
                <Button
                  onClick={resetCard}
                  style={{ backgroundColor: colors.primary }}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  Rejouer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
