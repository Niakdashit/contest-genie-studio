
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Trophy, RotateCcw } from 'lucide-react';

interface QuizGameProps {
  gameData: any;
}

export const QuizGame: React.FC<QuizGameProps> = ({ gameData }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const { content, colors, brandName, logo } = gameData;
  const questions = content.questions || [];

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);
    
    if (answerIndex === questions[currentQuestion].correct) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setGameFinished(true);
        setShowResult(true);
      }
    }, 1500);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setGameFinished(false);
    setAnswers([]);
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage >= 80) return "🏆 Excellent ! Vous êtes un expert !";
    if (percentage >= 60) return "👏 Très bien ! Bonne connaissance !";
    if (percentage >= 40) return "👍 Pas mal ! Vous pouvez mieux faire !";
    return "💪 Continuez vos efforts !";
  };

  return (
    <div 
      className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden p-6"
      style={{
        background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10)`
      }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50" />
      <div className="absolute top-4 right-4 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-full blur-xl opacity-30" />
      <div className="absolute bottom-4 left-4 w-24 h-24 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full blur-xl opacity-30" />

      {!gameFinished ? (
        <div className="relative z-10 w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {logo && (
                <img src={logo} alt="Logo" className="w-12 h-12 object-contain" />
              )}
              <h1 className="text-3xl font-bold text-gray-800">
                {content.title}
              </h1>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Question {currentQuestion + 1} / {questions.length}</span>
              <span>Score: {score} / {questions.length}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                backgroundColor: colors.primary
              }}
            />
          </div>

          {/* Question Card */}
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-xl text-center text-gray-800">
                {questions[currentQuestion]?.question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questions[currentQuestion]?.answers.map((answer: string, index: number) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  variant="outline"
                  className={`w-full p-4 text-left justify-start text-wrap h-auto transition-all duration-200 ${
                    selectedAnswer === index
                      ? index === questions[currentQuestion].correct
                        ? 'bg-green-100 border-green-500 text-green-700'
                        : 'bg-red-100 border-red-500 text-red-700'
                      : selectedAnswer !== null && index === questions[currentQuestion].correct
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: colors.primary }}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{answer}</span>
                    {selectedAnswer === index && (
                      index === questions[currentQuestion].correct ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )
                    )}
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Results Screen */
        <div className="relative z-10 text-center">
          <Card className="w-96 mx-4 shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                🎯 Quiz Terminé !
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mb-6">
                <div 
                  className="text-6xl font-bold mb-2"
                  style={{ color: colors.primary }}
                >
                  {score}/{questions.length}
                </div>
                <div className="text-2xl font-semibold mb-4">
                  {Math.round((score / questions.length) * 100)}%
                </div>
                <div className="text-lg text-gray-600">
                  {getScoreMessage()}
                </div>
              </div>

              {/* Score breakdown */}
              <div className="mb-6 space-y-2">
                {questions.map((question: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Q{index + 1}</span>
                    {answers[index] === question.correct ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => setShowResult(false)}
                  variant="outline"
                >
                  Fermer
                </Button>
                <Button
                  onClick={resetQuiz}
                  style={{ backgroundColor: colors.primary }}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Recommencer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
