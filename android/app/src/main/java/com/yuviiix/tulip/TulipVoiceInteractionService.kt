package com.yuviiix.tulip

import android.service.voice.VoiceInteractionService

/**
 * Top-level voice interaction service. Android keeps this alive once Tulip is set as the
 * device's default assistant (Settings > Apps > Default apps > Digital assistant app).
 *
 * This class is intentionally minimal — it does NOT do wake-word/hotword detection (that
 * feature is parked, see TULIP_HANDOFF_v38.md). All it does is exist so the OS has a
 * VoiceInteractionService to bind to. The actual "what happens when the user triggers the
 * assistant" logic lives in TulipVoiceInteractionSession.
 */
class TulipVoiceInteractionService : VoiceInteractionService() {
    // No overrides needed for the MVP: power-button-hold / assist-gesture triggering is
    // handled entirely by the system once this service + the session service are registered
    // and Tulip holds the ROLE_ASSISTANT role.
}
