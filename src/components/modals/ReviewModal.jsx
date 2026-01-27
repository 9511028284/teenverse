import React, { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Star } from 'lucide-react';

const ReviewModal = ({ onClose, onSubmit, freelancerName }) => {
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);

  const availableTags = ["Fast Delivery ⚡", "Creative 🎨", "Polite 🤝", "Expert 🧠", "Good Value 💎"];

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else setSelectedTags([...selectedTags, tag]);
  };

  const handleSubmit = () => {
    if (rating === 0) return alert("Please select a star rating");
    onSubmit(rating, selectedTags);
  };

  return (
    <Modal title={`Rate ${freelancerName}`} onClose={onClose}>
       <div className="space-y-6 text-center">
          <p className="text-sm text-gray-500">How was your experience working with {freelancerName}?</p>
          
          {/* STAR RATING */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
                <button 
                    key={star} 
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110 focus:outline-none"
                >
                    <Star 
                        size={32} 
                        className={star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
                    />
                </button>
            ))}
          </div>
          <div className="text-sm font-bold text-yellow-500 h-5">
            {rating === 5 && "Amazing!"}
            {rating === 4 && "Great Job"}
            {rating === 3 && "Good"}
            {rating === 2 && "Needs Improvement"}
            {rating === 1 && "Poor"}
          </div>

          {/* TAGS */}
          <div className="text-left">
             <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">What did they do well?</label>
             <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                            selectedTags.includes(tag) 
                            ? 'bg-indigo-100 border-indigo-200 text-indigo-700' 
                            : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'
                        }`}
                    >
                        {tag}
                    </button>
                ))}
             </div>
          </div>

          <Button onClick={handleSubmit} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white">
            Submit Review
          </Button>
       </div>
    </Modal>
  );
};

export default ReviewModal;