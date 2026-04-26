import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronLeft, Trophy } from 'lucide-react';

export function LessonQuiz({ quiz, onComplete, onCancel }) {
  const questions = quiz.questions ?? [];
  const passingScore = quiz.passingScore ?? Math.ceil(questions.length * 0.7);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]); // array of selected indices
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[step];

  function selectAnswer(idx) {
    const newAnswers = [...answers];
    newAnswers[step] = idx;
    setAnswers(newAnswers);
  }

  function next() {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResults(true);
    }
  }

  function finish() {
    const score = answers.reduce((acc, ans, i) =>
      acc + (ans === questions[i].correctIndex ? 1 : 0), 0);
    const passed = score >= passingScore;
    onComplete({ score, passed, total: questions.length });
  }

  // Results screen
  if (showResults) {
    const score = answers.reduce((acc, ans, i) =>
      acc + (ans === questions[i].correctIndex ? 1 : 0), 0);
    const passed = score >= passingScore;
    const isPerfect = score === questions.length;

    return (
      <div className="px-4 pt-8">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: passed ? 'rgba(0,214,143,0.15)' : 'rgba(233,69,96,0.15)',
              border: passed ? '2px solid #00D68F' : '2px solid #E94560',
            }}>
            {passed
              ? <Trophy size={40} style={{ color: '#00D68F' }} />
              : <X size={40} style={{ color: '#E94560' }} strokeWidth={2.5} />}
          </div>
          <h2 className="text-white text-3xl font-black uppercase tracking-tight mb-2">
            {isPerfect ? 'Perfetto!' : passed ? 'Superato!' : 'Riprova'}
          </h2>
          <div className="text-white/60 text-sm">
            {score} su {questions.length} risposte corrette
          </div>
        </motion.div>

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-xl bg-white/5 text-white/70 font-bold tracking-wider"
          >
            INDIETRO
          </button>
          {passed ? (
            <button
              onClick={finish}
              className="flex-1 py-3.5 rounded-xl text-white font-bold tracking-wider"
              style={{ background: 'linear-gradient(135deg, #00D68F, #00A86F)' }}
            >
              COMPLETA
            </button>
          ) : (
            <button
              onClick={() => { setStep(0); setAnswers([]); setShowResults(false); }}
              className="flex-1 py-3.5 rounded-xl text-white font-bold tracking-wider"
              style={{ background: 'linear-gradient(135deg, #4361EE, #2E45C9)' }}
            >
              RIPROVA
            </button>
          )}
        </div>
      </div>
    );
  }

  // Question screen
  const selectedAnswer = answers[step];
  return (
    <div>
      <div className="px-4 mb-4 flex items-center gap-3">
        <button onClick={onCancel}
          className="p-2 rounded-xl bg-white/5 text-white/70">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="text-[10px] font-bold tracking-[0.15em] text-[#4361EE]">
            QUIZ — DOMANDA {step + 1} / {questions.length}
          </div>
          <h1 className="text-white text-base font-black uppercase tracking-tight">
            Test finale
          </h1>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mx-4 h-1 bg-white/5 rounded-full overflow-hidden mb-6">
        <motion.div
          className="h-full bg-[#4361EE]"
          animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <div className="px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <p className="text-white text-lg font-bold mb-6 leading-relaxed">
              {currentQuestion.question}
            </p>

            <div className="space-y-2.5 mb-6">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                return (
                  <motion.button
                    key={i}
                    onClick={() => selectAnswer(i)}
                    whileTap={{ scale: 0.98 }}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-colors
                      ${isSelected
                        ? 'bg-[#4361EE]/15 border-[#4361EE] text-white'
                        : 'bg-[#12122A] border-white/10 text-white/80 hover:border-white/30'}`}
                  >
                    <span className="font-medium">{opt}</span>
                  </motion.button>
                );
              })}
            </div>

            <button
              onClick={next}
              disabled={selectedAnswer == null}
              className="w-full py-4 rounded-xl font-bold tracking-wider text-white
                disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #4361EE, #2E45C9)' }}
            >
              {step === questions.length - 1 ? 'VEDI RISULTATI' : 'PROSSIMA'}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
