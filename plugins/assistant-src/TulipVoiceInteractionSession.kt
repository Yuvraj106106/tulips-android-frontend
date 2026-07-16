package com.yuviiix.tulip

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.service.voice.VoiceInteractionSession
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.TextView

/**
 * Fires when the user triggers Tulip as the system assistant (power-button hold, assist
 * gesture, etc).
 *
 * AO-1 (Assistant Overlay, scaffold only — see TULIP_HANDOFF_v43.md):
 * The app must NEVER launch by default anymore. Instead, this session's own window IS
 * the overlay — it persists on screen instead of handing off to MainActivity. This file
 * only proves out "no MainActivity launch + window stays up"; the real content (a
 * ReactRootView with the live 3D avatar) is mounted in AO-2/AO-3. For now we render a
 * simple placeholder native view so the scaffold is visually verifiable on-device.
 *
 * Old MVP behavior (superseded, kept here as a comment for reference — do not restore
 * without checking TULIP_HANDOFF_v43.md first): this used to fire an ACTION_VIEW intent to
 * `tulips://start-listening`, launching MainActivity, then immediately call hide()+finish()
 * so it wouldn't block the launched activity. That whole handoff — and the SplashScreen/
 * deep-link race bug that lived inside it — is being removed by this AO-1 change; see
 * "Splash/deep-link race bug" section in the handoff for what to revisit.
 */
class TulipVoiceInteractionSession(context: Context) : VoiceInteractionSession(context) {

    override fun onCreateContentView(): View {
        // AO-2/AO-3 will replace this FrameLayout's single child with a ReactRootView
        // rendering the warm/cached 3D avatar. Keep this container so later steps just
        // swap what's added to it, without re-touching the session lifecycle logic below.
        val container = FrameLayout(context).apply {
            setBackgroundColor(Color.parseColor("#1A1A2E"))
        }

        val placeholder = TextView(context).apply {
            text = "Tulip overlay (AO-1 scaffold)\nAvatar mounts here in AO-2/AO-3"
            setTextColor(Color.WHITE)
            textSize = 16f
            gravity = Gravity.CENTER
        }

        container.addView(
            placeholder,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
            )
        )

        return container
    }

    override fun onShow(args: Bundle?, showFlags: Int) {
        super.onShow(args, showFlags)
        // Deliberately no startActivity() here anymore, and no hide()/finish() either —
        // the whole point of AO-1 is that this window IS the app now, and it stays up
        // until the user explicitly closes it (manual close / swipe-down), which will be
        // wired in a later AO step. Leaving it open with no close path yet is expected
        // for this scaffold — don't add an auto-hide "fix" without checking the roadmap.
    }
}
