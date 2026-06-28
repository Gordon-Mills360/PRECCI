// FILE: precci/frontend/app/components/voice/AgentVoicePanel.tsx
// Displays the currently active agent during a voice session.
// Shows agent name, animated avatar, and speaking waveform.

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import AgentAvatar from '../ui/AgentAvatar';
import VoiceWaveform from './VoiceWaveform';

interface AgentVoicePanelProps {
  agentName: string;
  agentPcId: string;
  isSpeaking: boolean;
  isListening: boolean;
  statusText?: string;
}

export default function AgentVoicePanel({
  agentName,
  agentPcId,
  isSpeaking,
  isListening,
  statusText,
}: AgentVoicePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 p-6"
    >
      <AgentAvatar
        agentName={agentName}
        pcId={agentPcId}
        isActive={isListening || isSpeaking}
        size="lg"
      />

      <div className="text-center">
        <p className="font-display font-semibold text-ivory-cream text-lg">
          {agentName}
        </p>
        <AnimatePresence mode="wait">
          <motion.p
            key={statusText}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs tracking-widest uppercase mt-1"
            style={{ color: 'rgba(250,240,232,0.45)' }}
          >
            {statusText ||
              (isSpeaking
                ? 'Speaking...'
                : isListening
                ? 'Listening...'
                : 'Ready')}
          </motion.p>
        </AnimatePresence>
      </div>

      <VoiceWaveform isActive={isSpeaking} height={32} />
    </motion.div>
  );
}