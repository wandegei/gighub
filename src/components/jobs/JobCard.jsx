import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Calendar, DollarSign, User, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

const statusColors = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  funded: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  in_progress: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  completed: 'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function JobCard({ job, userEmail }) {
  const isClient = job.client_email === userEmail;
  
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <Link 
      to={createPageUrl(`JobDetail?id=${job.id}`)}
      className="card-dark p-5 hover:border-[#FF6633]/30 transition-all duration-300 block group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white truncate group-hover:text-[#FF6633] transition-colors">
              {job.title}
            </h3>
            <Badge className={`${statusColors[job.status]} border capitalize`}>
              {job.status?.replace('_', ' ')}
            </Badge>
          </div>
          
          <p className="text-gray-500 text-sm line-clamp-2 mb-4">
            {job.description || 'No description provided'}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-gray-400">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium text-white">{formatAmount(job.agreed_amount)}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-gray-400">
              <User className="w-4 h-4" />
              <span>{isClient ? 'Provider' : 'Client'}: {isClient ? job.provider_email : job.client_email}</span>
            </div>
            
            <div className="flex items-center gap-1.5 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(job.created_date), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
        
        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#FF6633] group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
      </div>
    </Link>
  );
}