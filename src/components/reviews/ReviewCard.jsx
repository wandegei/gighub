import React from 'react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewCard({ review }) {
  return (
    <div className="p-4 rounded-xl bg-[#0A0E1A] border border-[#1E2430]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF5722] flex items-center justify-center">
            <span className="font-semibold text-sm" style={{ color: 'black' }}>
              {review.client_name?.charAt(0) || 'C'}
            </span>
          </div>
          <div>
            <p className="font-medium text-white">{review.client_name || 'Client'}</p>
            <p className="text-xs text-gray-500">
              {format(new Date(review.created_date), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-white text-sm leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}