import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, XCircle, AlertCircle, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { generateQuiz } from '../services/api';
import { QuizQuestion } from '../types/api';

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentId?: string;
  documentName?: string;
  learningLevel?: string;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  isOpen,
  onClose,
  documentId,
  documentName,
  learningLevel = 'beginner',
}) => {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = async () => {
    if (!documentId) return;
    setLoading(true);
    setError(null);
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setIsFinished(false);

    try {
      const res = await generateQuiz(documentId, 4, learningLevel);
      setQuestions(res.quiz || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && documentId) {
      fetchQuiz();
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];

  const handleSelectOption = (opt: string) => {
    if (selectedOption !== null) return; // already answered
    const letter = opt.trim().charAt(0).toUpperCase();
    setSelectedOption(letter);
    if (letter === currentQ.correct_answer.toUpperCase()) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      setIsFinished(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
              <Sparkles className="size-4.5" />
            </span>
            <div>
              <h2 className="font-semibold text-lg leading-tight">Interactive Practice Quiz</h2>
              <p className="text-xs text-muted-foreground truncate max-w-xs">{documentName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 className="size-8 animate-spin text-primary mb-3" />
              <p className="text-sm font-medium">Generating questions grounded in your document...</p>
              <p className="text-xs text-muted-foreground mt-1">Reading key concepts & formulating practice questions</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <AlertCircle className="size-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-foreground font-medium">{error}</p>
              <button
                onClick={fetchQuiz}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
              >
                <RotateCcw className="size-3.5" /> Retry
              </button>
            </div>
          ) : isFinished ? (
            <div className="py-8 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-primary/10 text-primary mx-auto mb-4">
                <CheckCircle2 className="size-8" />
              </span>
              <h3 className="text-xl font-bold">Quiz Completed!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You scored <span className="font-bold text-foreground">{score}</span> out of{' '}
                <span className="font-bold text-foreground">{questions.length}</span>
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={fetchQuiz}
                  className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  <RotateCcw className="size-4" /> Try Again
                </button>
                <button
                  onClick={onClose}
                  className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : currentQ ? (
            <div>
              {/* Progress & Badge */}
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <span>
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="font-semibold text-primary">Score: {score}</span>
              </div>

              {/* Question Text */}
              <h3 className="text-base font-medium leading-snug mb-5 text-foreground">
                {currentQ.question}
              </h3>

              {/* Options */}
              <div className="space-y-2.5">
                {currentQ.options.map((opt, i) => {
                  const letter = opt.trim().charAt(0).toUpperCase();
                  const isSelected = selectedOption === letter;
                  const isCorrect = letter === currentQ.correct_answer.toUpperCase();

                  let btnStyle = 'border-border/80 bg-card hover:bg-muted/40 hover:border-primary/40';
                  if (selectedOption !== null) {
                    if (isCorrect) {
                      btnStyle = 'border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-medium';
                    } else if (isSelected) {
                      btnStyle = 'border-red-500 bg-red-500/10 text-red-900 dark:text-red-200 font-medium';
                    } else {
                      btnStyle = 'border-border/40 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={selectedOption !== null}
                      onClick={() => handleSelectOption(opt)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left text-sm transition-all ${btnStyle}`}
                    >
                      <span className="flex-1 pr-2">{opt}</span>
                      {selectedOption !== null && isCorrect && (
                        <CheckCircle2 className="size-4.5 text-emerald-600 shrink-0" />
                      )}
                      {selectedOption !== null && isSelected && !isCorrect && (
                        <XCircle className="size-4.5 text-red-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Explanation Reveal */}
              {selectedOption !== null && (
                <div className="mt-5 rounded-xl border bg-muted/40 p-4 animate-fade-in">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                    Explanation
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {currentQ.explanation}
                  </p>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleNext}
                      className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
                    >
                      {currentIndex + 1 < questions.length ? 'Next Question →' : 'See Results'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
