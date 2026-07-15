package com.yuviiix.tulip

import android.os.Bundle
import android.service.voice.VoiceInteractionSession
import android.service.voice.VoiceInteractionSessionService

/**
 * The system calls onNewSession() every time the user triggers the assistant (e.g. power
 * button hold). Its only job is to hand back a session instance.
 */
class TulipVoiceInteractionSessionService : VoiceInteractionSessionService() {
    override fun onNewSession(args: Bundle?): VoiceInteractionSession {
        return TulipVoiceInteractionSession(this)
    }
}
