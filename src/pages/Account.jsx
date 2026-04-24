import React from 'react';
import { User } from 'lucide-react';
import { ComingSoon } from '../components/ComingSoon';

export default function Account() {
  return (
    <ComingSoon
      icon={User}
      title="Profilo Blader"
      description="Gestisci il tuo profilo, personalizza il tuo avatar e sblocca achievement esclusivi."
      accentColor="#4361EE"
    />
  );
}
