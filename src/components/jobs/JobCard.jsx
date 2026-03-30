import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import {
  Calendar,
  DollarSign,
  User,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const statusColors = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  funded: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  in_progress: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function JobCard({ job, userProfile }) {
  if (!job) return null;

  // ✅ Determine role using IDs (correct way)
  const isClient = job.client_id === userProfile?.id;
  const isProvider = job.provider_id === userProfile?.id;

  const userRole = isClient
    ? "client"
    : isProvider
    ? "provider"
    : "viewer";

  // ✅ Safe amount formatter
  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  // ✅ Safe date formatter (prevents crash)
  const safeDate = (date) => {
    if (!date) return "No date";

    const parsed = new Date(date);
    if (isNaN(parsed)) return "Invalid date";

    return format(parsed, "MMM d, yyyy");
  };

  return (
    <Link
      to={createPageUrl(`JobDetail?id=${job.id}`)}
      className="card-dark p-5 hover:border-[#FF6633]/30 transition-all duration-300 block group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Title + Status */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-white truncate group-hover:text-[#FF6633] transition-colors">
              {job.title || "Untitled Job"}
            </h3>

            {job.status && (
              <Badge
                className={`${
                  statusColors[job.status] || "bg-gray-500/20 text-gray-400"
                } border capitalize`}
              >
                {job.status.replace("_", " ")}
              </Badge>
            )}
          </div>

          {/* Role */}
          {userRole !== "viewer" && (
            <p className="text-gray-400 text-sm mb-2 italic">
              You are the{" "}
              {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </p>
          )}

          {/* Description */}
          <p className="text-gray-500 text-sm line-clamp-2 mb-4">
            {job.description || "No description provided"}
          </p>

          {/* Info Row */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {/* Amount */}
            <div className="flex items-center gap-1.5 text-gray-400">
              <DollarSign className="w-4 h-4" />
              <span className="font-medium text-white">
                {formatAmount(job.agreed_amount)}
              </span>
            </div>

            {/* Role Info */}
            <div className="flex items-center gap-1.5 text-gray-400">
              <User className="w-4 h-4" />
              <span>
                {userRole === "client"
                  ? "You hired a provider"
                  : userRole === "provider"
                  ? "You were hired"
                  : "Job"}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{safeDate(job.created_at)}</span>
            </div>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-[#FF6633] group-hover:translate-x-1 transition-all flex-shrink-0 mt-2" />
      </div>
    </Link>
  );
}