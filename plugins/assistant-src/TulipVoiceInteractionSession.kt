package com.yuviiix.tulip

import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.service.voice.VoiceInteractionSession
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView

/**
 * Fires when the user triggers Tulip as the system assistant (power-button hold, assist
 * gesture, etc).
 *
 * Behavior: briefly show a small native "Tulip is listening…" card (so the user gets
 * immediate visual confirmation the trigger fired — useful both as real UX and as a
 * debugging signal, since some OEMs silently swallow the assist gesture before it ever
 * reaches this class), then hand off to MainActivity via the app's existing `tulips://`
 * deep-link scheme (already registered in AndroidManifest.xml), with a `start-listening`
 * path so the JS side picks it up through the standard React Native Linking API
 * (Linking.getInitialURL / 'url' event) — no native bridging needed.
 *
 * Wake-word detection is parked (see TULIP_HANDOFF_v38.md/v41.md), so this is the only
 * trigger path for now.
 */
class TulipVoiceInteractionSession(context: Context) : VoiceInteractionSession(context) {

    private val handler = Handler(Looper.getMainLooper())
    private val popupDurationMs = 650L

    override fun onCreateContentView(): View {
        val ctx = context

        val card = LinearLayout(ctx).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dp(24), dp(18), dp(24), dp(18))
            background = GradientDrawable().apply {
                cornerRadius = dp(20).toFloat()
                setColor(Color.parseColor("#1A1A1A"))
            }
        }

        val spinner = ProgressBar(ctx).apply {
            isIndeterminate = true
            indeterminateTintList = android.content.res.ColorStateList.valueOf(Color.parseColor("#FFBF00"))
        }
        card.addView(spinner, LinearLayout.LayoutParams(dp(22), dp(22)))

        val label = TextView(ctx).apply {
            text = "Tulip is listening…"
            setTextColor(Color.WHITE)
            textSize = 15f
            setPadding(dp(14), 0, 0, 0)
        }
        card.addView(label)

        val root = FrameLayout(ctx).apply {
            addView(
                card,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.WRAP_CONTENT,
                    FrameLayout.LayoutParams.WRAP_CONTENT
                ).apply {
                    gravity = Gravity.CENTER_HORIZONTAL or Gravity.BOTTOM
                    bottomMargin = dp(80)
                }
            )
        }
        return root
    }

    private fun dp(value: Int): Int =
        (value * context.resources.displayMetrics.density).toInt()

    override fun onShow(args: Bundle?, showFlags: Int) {
        super.onShow(args, showFlags)

        // Show the "listening" card briefly, then hand off to the app. The delay is what
        // makes the popup actually visible to the user instead of flashing for one frame.
        handler.postDelayed({
            val launchIntent = Intent(Intent.ACTION_VIEW, Uri.parse("tulips://start-listening")).apply {
                addFlags(
                    Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
                )
            }
            context.startActivity(launchIntent)
            hide()
            finish()
        }, popupDurationMs)
    }

    override fun onHide() {
        super.onHide()
        handler.removeCallbacksAndMessages(null)
    }
}
