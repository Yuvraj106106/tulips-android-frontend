// Thin backwards-compatible wrapper around the generic CompanionAvatar.
// Existing screens that import KrishnaAvatar (e.g. ChatScreen.tsx) keep
// working unchanged. New code, and the multi-companion work in Phase 6,
// should use CompanionAvatar directly with a companionId prop instead.
import React from 'react';
import CompanionAvatar from './CompanionAvatar';

const KrishnaAvatar: React.FC = () => <CompanionAvatar companionId="krishna" />;

export default KrishnaAvatar;
