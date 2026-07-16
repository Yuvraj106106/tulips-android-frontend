import { useState, useCallback } from 'react';

/**
 * Custom hook to manage the lifecycle of the assistant overlay session.
 *
 * Rule (AO-6): After a voice command executes, the session remains active and
 * shows a confirmation banner. It does not auto-close; it only closes when
 * the user performs an explicit close action (e.g., tapping the close button).
 */
export function useAssistantSessionLifecycle() {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);
  const [isBannerVisible, setIsBannerVisible] = useState<boolean>(false);

  // Stub function to simulate trigger of "voice command executed"
  const triggerVoiceCommand = useCallback(() => {
    setIsBannerVisible(true);
  }, []);

  // Action to dismiss/confirm the banner (keeps the session active)
  const dismissBanner = useCallback(() => {
    setIsBannerVisible(false);
  }, []);

  // Action to explicitly close the session/overlay
  const closeSession = useCallback(() => {
    setIsSessionActive(false);
    setIsBannerVisible(false);
  }, []);

  return {
    isSessionActive,
    isBannerVisible,
    triggerVoiceCommand,
    dismissBanner,
    closeSession,
  };
}
