import React from 'react';
import { Shield, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

export default function VerificationBadge({ verifications = [] }) {
  if (!verifications || verifications.length === 0) {
    return null;
  }

  const verificationTypes = {
    identity: 'ID Verified',
    skills: 'Skills Verified',
    business: 'Business Verified',
    background: 'Background Check'
  };

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Badge className="bg-green-500 hover:bg-green-600 text-white cursor-pointer">
          <Shield className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="bg-[#151922] border-[#1E2430] w-64">
        <div>
          <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-500" />
            Trust & Verification
          </h4>
          <div className="space-y-2">
            {verifications.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-white">{verificationTypes[v.verification_type] || v.verification_type}</span>
              </div>
            ))}
          </div>
          {verifications.length > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              Verified on {new Date(verifications[0].verified_at).toLocaleDateString()}
            </p>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}