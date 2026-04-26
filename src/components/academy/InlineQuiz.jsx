import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

export function InlineQuiz({ question, options, correctIndex, explanation }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);

  const isCorrect = selected === correctIndex;

  function handleSelect(idx) {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
  }

  return (
    <div className="rounded-xl bg-[#12122A] border border-[#4361EE]/20 p-4 my-3">
      <div className="flex items-center gap-2 mb-3">
        <HelpCircle size={14} className="text-[#4361EE]" />
        <div className="text-[10px] font-extrabold tracking-[0.15em] text-[#4361EE]">
          QUIZ RAPIDO
        </div>
      </div>

      <p className="text-white font-bold mb-3">{question}</p>

      <div className="space-y-2">
        {options.map((opt, i) => {
          const isSelected = selected === i;
          const isAnswerCorrect = i === correctIndex;
          const showAsCorrect   = revealed && isAnswerCorrect;
          const showAsWrong     = revealed && isSelected && !isAnswerCorrect;

          return (
            <motion.button
              key={i}
              onClick={() => handleSelect(i)}
              whileTap={{ scale: revealed ? 1 : 0.98 }}
              disabled={revealed}
              className={`w-full p-3 rounded-lg border text-left text-sm transition-colors
                flex items-center gap-3
                ${showAsCorrect ? 'bg-[#00D68F]/15 border-[#00D68F]/50 text-white' : ''}
                ${showAsWrong   ? 'bg-[#E94560]/15 border-[#E94560]/50 text-white' : ''}
                ${!revealed     ? 'bg-white/5 border-white/10 text-white/80 hover:border-white/30' : ''}
                ${revealed && !isSelected && !isAnswerCorrect ? 'opacity-40 bg-white/5 border-white/10 text-white/60' : ''}
              `}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                ${showAsCorrect ? 'bg-[#00D68F]' : showAsWrong ? 'bg-[#E94560]' : 'bg-white/10'}`}>
                {showAsCorrect && <CheckCircle2 size={14} className="text-white" />}
                {showAsWrong && <XCircle size={14} className="text-white" />}
              </div>
              <span className="font-medium">{opt}</span>
            </motion.button>
          );
        })}
      </div>

      {revealed && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-3 p-3 rounded-lg text-sm
            ${isCorrect ? 'bg-[#00D68F]/10' : 'bg-[#E94560]/10'}`}
        >
          <div className={`text-xs font-bold mb-1 tracking-wider
            ${isCorrect ? 'text-[#00D68F]' : 'text-[#E94560]'}`}>
            {isCorrect ? '✓ CORRETTO' : '✗ NON ESATTO'}
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{explanation}</p>
        </motion.div>
      )}
    </div>
  );
}
