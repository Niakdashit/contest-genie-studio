
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, Share, Eye } from 'lucide-react';
import { WheelGame } from './games/WheelGame';
import { ScratchCard } from './games/ScratchCard';
import { QuizGame } from './games/QuizGame';

interface GamePreviewProps {
  gameData: any;
  onClose: () => void;
}

export const GamePreview: React.FC<GamePreviewProps> = ({ gameData, onClose }) => {
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  const renderGame = () => {
    switch (gameData.type) {
      case 'wheel':
        return <WheelGame gameData={gameData} />;
      case 'scratch':
        return <ScratchCard gameData={gameData} />;
      case 'quiz':
        return <QuizGame gameData={gameData} />;
      default:
        return <WheelGame gameData={gameData} />;
    }
  };

  const getPreviewSize = () => {
    switch (viewMode) {
      case 'mobile':
        return 'w-80 h-[600px]';
      case 'tablet':
        return 'w-[600px] h-[400px]';
      case 'desktop':
      default:
        return 'w-[900px] h-[600px]';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-xl font-bold">
            Aperçu du Jeu Concours - {gameData.content.title}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <Button
                variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('desktop')}
                className="px-3 py-1 text-xs"
              >
                Desktop
              </Button>
              <Button
                variant={viewMode === 'tablet' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('tablet')}
                className="px-3 py-1 text-xs"
              >
                Tablette
              </Button>
              <Button
                variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('mobile')}
                className="px-3 py-1 text-xs"
              >
                Mobile
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center py-4">
          <div className={`${getPreviewSize()} border-2 border-gray-200 rounded-lg overflow-hidden shadow-lg bg-white transition-all duration-300`}>
            <div className="w-full h-full">
              {renderGame()}
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Prévisualiser en plein écran
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Télécharger le projet
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Share className="h-4 w-4" />
              Partager
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
