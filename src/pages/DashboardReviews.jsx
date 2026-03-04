import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Star, TrendingUp, Award } from 'lucide-react';
import ReviewCard from '../components/reviews/ReviewCard';

export default function DashboardReviews() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userData = await base44.auth.me();
    setUser(userData);
    
    const profiles = await base44.entities.Profile.filter({ user_email: userData.email });
    if (profiles.length > 0) {
      setProfile(profiles[0]);
      const reviewsData = await base44.entities.Review.filter(
        { provider_id: profiles[0].id },
        '-created_date'
      );
      setReviews(reviewsData);
    }
    
    setLoading(false);
  };

  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      dist[r.rating] = (dist[r.rating] || 0) + 1;
    });
    return dist;
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-[#1E2430] rounded w-48 mb-6" />
          <div className="h-96 bg-[#1E2430] rounded-xl" />
        </div>
      </div>
    );
  }

  const avgRating = getAverageRating();
  const distribution = getRatingDistribution();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">Reviews & Ratings</h1>
        <p className="text-[#FF6B3D]">See what clients say about your work</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card-dark p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B3D] to-[#FF5722] flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8" style={{ color: 'black' }} />
          </div>
          <p className="text-3xl font-bold text-white mb-2">{avgRating}</p>
          <p className="text-gray-500 text-sm">Average Rating</p>
        </div>

        <div className="card-dark p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#00D97E] to-[#00C26F] flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8" style={{ color: 'black' }} />
          </div>
          <p className="text-3xl font-bold text-white mb-2">{reviews.length}</p>
          <p className="text-gray-500 text-sm">Total Reviews</p>
        </div>

        <div className="card-dark p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FFC107] to-[#FF9800] flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" style={{ color: 'black' }} />
          </div>
          <p className="text-3xl font-bold text-white mb-2">{distribution[5]}</p>
          <p className="text-gray-500 text-sm">5-Star Reviews</p>
        </div>
      </div>

      <div className="card-dark p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Rating Distribution</h3>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = distribution[rating];
            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
            
            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-white text-sm">{rating}</span>
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                </div>
                <div className="flex-1 h-2 bg-[#1E2430] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FF6B3D] to-[#FF5722]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-white text-sm w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card-dark p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Reviews</h3>
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500">No reviews yet</p>
            <p className="text-sm text-gray-600 mt-2">Complete jobs to start receiving reviews</p>
          </div>
        )}
      </div>
    </div>
  );
}