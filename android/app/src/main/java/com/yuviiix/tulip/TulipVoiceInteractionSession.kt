package com.yuviiix.tulip

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.service.voice.VoiceInteractionSession

/**
 * Fires when the user triggers Tulip as the system assistant (power-button hold, assist
 * gesture, etc). MVP behavior: immediately launch MainActivity via the app's existing
 * `tulips://` deep-link scheme (already registered in AndroidManifest.xml for other flows),
 * with a `start-listening` path so the JS side can pick it up through the standard React
 * Native Linking API (Linking.getInitialURL / 'url' event) — no native bridging needed.
 *
 * We deliberately do NOT render any VoiceInteractionSession UI (no overlay/bottom-sheet) —
 * the user just sees Tulip's own app UI open, already listening. Wake-word detection is
 * parked (see TULIP_HANDOFF_v38.md), so this is the only trigger path for now.
 */
class TulipVoiceInteractionSession(context: Context) : VoiceInteractionSession(context) {

    override fun onShow(args: Bundle?, showFlags: Int) {
        super.onShow(args, showFlags)

        val launchIntent = Intent(Intent.ACTION_VIEW, Uri.parse("tulips://start-listening")).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            )
        }
        context.startActivity(launchIntent)

        // No persistent session UI — close immediately so we don't block the launched activity.
        hide()
        finish()
    }
}
