import React from 'react';
import Modal from '../ui/Modal'; // Adjust import

const ActiveQuizModal = ({ modalData, currentQuestionIndex, score, setScore, setCurrentQuestionIndex, handleQuizSelection, onClose, showToast }) => {
  if (!modalData?.data) return null;

  const questions = modalData.data.questions;
  const currentQ = questions[currentQuestionIndex];

  return (
    <Modal 
      title={`Exam: ${modalData.data.title}`} 
      onClose={() => { onClose(); setCurrentQuestionIndex(0); setScore(0); }}
    >
      <div className="space-y-6">
        {/* PROGRESS BAR */}
        <div className="w-full bg-gray-100 dark:bg-white/10 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-indigo-500 h-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>Score: {score}</span>
        </div>

        <h3 className="text-xl font-bold dark:text-white px-2">
          {currentQ.q}
        </h3>

        <div className="space-y-3">
          {currentQ.options.map((opt, i) => (
            <button 
              key={i} 
              onClick={() => {
                const isCorrect = opt === currentQ.a;
                if (isCorrect) setScore(score + 1);
                
                // Next Question or Finish
                if (currentQuestionIndex + 1 < questions.length) {
                  setCurrentQuestionIndex(currentQuestionIndex + 1);
                } else {
                  // FINISH LOGIC
                  const finalScore = score + (isCorrect ? 1 : 0);
                  if (finalScore >= 7) { // Pass if 7/10 correct
                    handleQuizSelection(modalData.category, true); 
                  } else {
                    showToast(`You scored ${finalScore}/10. Try again!`, "error");
                    onClose();
                    setCurrentQuestionIndex(0);
                    setScore(0);
                  }
                }
              }} 
              className="w-full p-4 rounded-xl text-left border-2 bg-white dark:bg-[#020617] border-gray-100 dark:border-white/10 hover:border-indigo-500 hover:shadow-md dark:text-gray-300 transition-all font-medium"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default ActiveQuizModal;