import React from 'react';
import { Swords } from 'lucide-react';
import { ComingSoon } from '../components/ComingSoon';

export default function Battle() {
  return (
    <ComingSoon
      icon={Swords}
      title="Battle Arena"
      description="Registra le tue battaglie, traccia le statistiche e scala la classifica con i tuoi amici."
      accentColor="#E94560"
    />
  );
}
