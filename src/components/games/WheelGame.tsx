
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Sparkles } from 'lucide-react';

interface WheelGameProps {
  gameData: any;
}

export const WheelGame: React.FC<WheelGameProps> = ({ gameData }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const { content, colors, brandName, logo } = gameData;
  const prizes = content.prizes || [];

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);
    setShowResult(false);

    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    const randomRotation = Math.random() * 360 + 1800; // 5 tours minimum

    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${randomRotation}deg)`;
    }

    setTimeout(() => {
      setResult(randomPrize);
      setShowResult(true);
      setIsSpinning(false);
    }, 3000);
  };

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${colors.primary}15, ${colors.secondary}15)`
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-blue-50/50" />
      <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-purple-200 to-blue-200 rounded-full blur-xl opacity-60" />
      <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-xl opacity-60" />

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
          Tournez la roue et tentez votre chance !
        </p>
      </div>

      {/* Wheel Container */}
      <div className="relative mb-8">
        {/* Wheel */}
        <div 
          ref={wheelRef}
          className="w-80 h-80 rounded-full border-8 border-white shadow-2xl relative overflow-hidden transition-transform duration-[3s] ease-out"
          style={{ background: `conic-gradient(${generateWheelGradient(prizes, colors)})` }}
        >
          {/* Prize segments */}
          {prizes.map((prize, index) => (
            <div
              key={index}
              className="absolute w-full h-full flex items-center justify-center"
              style={{
                transform: `rotate(${(360 / prizes.length) * index}deg)`,
                transformOrigin: 'center'
              }}
            >
              <div 
                className="text-white font-bold text-sm px-2 py-1 rounded transform -rotate-90"
                style={{ marginTop: '-120px' }}
              >
                {prize}
              </div>
            </div>
          ))}
          
          {/* Center circle */}
          <div 
            className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ backgroundColor: colors.primary }}
          >
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Pointer */}
        <div 
          className="absolute top-0 left-1/2 w-0 h-0 transform -translate-x-1/2 -translate-y-2 z-10"
          style={{
            borderLeft: '15px solid transparent',
            borderRight: '15px solid transparent',
            borderTop: `30px solid ${colors.accent}`,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}
        />
      </div>

      {/* Spin Button */}
      <Button
        onClick={spinWheel}
        disabled={isSpinning}
        className="px-8 py-4 text-xl font-bold rounded-full shadow-lg transform transition-all duration-200 hover:scale-105"
        style={{
          background: `linear-gradient(45deg, ${colors.primary}, ${colors.secondary})`,
          color: 'white'
        }}
      >
        {isSpinning ? (
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Tournage...
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6" />
            TOURNER LA ROUE
          </div>
        )}
      </Button>

      {/* Result Modal */}
      {showResult && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 mx-4 animate-bounce">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-center">
                🎉 Résultat !
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div 
                className="text-4xl font-bold mb-4 p-4 rounded-lg"
                style={{ color: colors.primary }}
              >
                {result}
              </div>
              <Button
                onClick={() => setShowResult(false)}
                className="w-full"
                style={{ backgroundColor: colors.primary }}
              >
                Continuer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const generateWheelGradient = (prizes: string[], colors: any): string => {
  const segmentSize = 360 / prizes.length;
  let gradientStops: string[] = [];
  
  prizes.forEach((_, index) => {
    const startAngle = index * segmentSize;
    const endAngle = (index + 1) * segmentSize;
    const color = index % 2 === 0 ? colors.primary : colors.secondary;
    
    if (index === 0) {
      gradientStops.push(`${color} ${startAngle}deg`);
    }
    gradientStops.push(`${color} ${endAngle}deg`);
  });
  
  return gradientStops.join(', ');
};
