package com.yuviiix.tulip

import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.service.voice.VoiceInteractionSession
import android.view.Gravity
import android.view.View
import android.widget.FrameLayout
import android.widget.TextView
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactInstanceManager
import com.facebook.react.ReactInstanceEventListener
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactContext
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags
import com.facebook.react.interfaces.fabric.ReactSurface

/**
 * Fires when the user triggers Tulip as the system assistant (power-button hold, assist
 * gesture, etc).
 *
 * AO-2 (Assistant Overlay):
 * Replaces the placeholderTextView in onCreateContentView() with a mounted ReactRootView / ReactSurface
 * that renders real React Native content - without ever launching MainActivity.
 *
 * AO-4 (popup sizing, added this session):
 * onCreateContentView() now returns a transparent full-screen root with a small,
 * fixed-size (320x420dp) rounded "popup" docked bottom-right, instead of a full-screen
 * opaque fill. The RN surface/root view mounts inside that fixed popup, not the
 * transparent root. Paired with Theme.Tulip.TransparentSession in styles.xml
 * (applied to TulipVoiceInteractionSessionService in AndroidManifest.xml) so the
 * session window itself doesn't paint an opaque background behind the popup.
 * NOT YET VERIFIED ON DEVICE - see TULIP_HANDOFF next-session notes. MIUI's window
 * handling for VoiceInteractionSession is the known-flaky part of this stack (see
 * "Current Known Status" in the roadmap), so this needs the same on-device
 * QR/tunnel + logcat workflow used for AO-1/2/3 before it's considered done.
 */
class TulipVoiceInteractionSession(context: Context) : VoiceInteractionSession(context) {

    private var container: FrameLayout? = null
    private var popupHost: FrameLayout? = null
    private var reactRootView: ReactRootView? = null
    private var reactSurface: ReactSurface? = null
    private var eventListener: ReactInstanceEventListener? = null

    // AO-4: popup size in dp. Bottom-right docked "bubble" instead of full-screen.
    // NOTE: matches AO-5's expectation that OverlayGestureContainer drives size from
    // state/animated values, not literal screen dimensions - this is just the initial
    // resting (collapsed) size before any swipe-up expansion happens on the RN side.
    private val popupWidthDp = 320
    private val popupHeightDp = 420
    private val popupMarginDp = 16

    private fun dpToPx(dp: Int): Int {
        val density = context.resources.displayMetrics.density
        return (dp * density).toInt()
    }

    override fun onCreateContentView(): View {
        // Transparent root so the area outside the popup shows the screen behind it,
        // instead of the old opaque #0A0A1A full-screen fill.
        val rootContainer = FrameLayout(context).apply {
            setBackgroundColor(Color.TRANSPARENT)
        }
        container = rootContainer

        // The actual popup surface: fixed size, docked bottom-right, rounded dark-glass
        // background so it reads as a floating bubble rather than a full-screen sheet.
        val popupContainer = FrameLayout(context).apply {
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(Color.parseColor("#E60A0A1A")) // dark glass, ~90% opaque
                cornerRadius = dpToPx(16).toFloat()
            }
            clipToOutline = true
        }
        popupHost = popupContainer

        val margin = dpToPx(popupMarginDp)
        rootContainer.addView(
            popupContainer,
            FrameLayout.LayoutParams(
                dpToPx(popupWidthDp),
                dpToPx(popupHeightDp),
                Gravity.BOTTOM or Gravity.END
            ).apply {
                bottomMargin = margin
                marginEnd = margin
            }
        )

        // Attempt to mount RN content
        val app = context.applicationContext as? ReactApplication
        if (app != null) {
            val isBridgeless = ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()
            if (isBridgeless) {
                val reactHost = app.reactHost
                if (reactHost == null) {
                    showPlaceholder("Tulip overlay error: ReactHost not available.")
                } else {
                    val reactContext = reactHost.currentReactContext
                    if (reactContext != null) {
                        // Already initialized
                        mountBridgeless(reactHost)
                    } else {
                        // Show fallback and listen for initialization
                        showPlaceholder("Tulip overlay initializing...")
                        val listener = object : ReactInstanceEventListener {
                            override fun onReactContextInitialized(context: ReactContext) {
                                mountBridgeless(reactHost)
                                reactHost.removeReactInstanceEventListener(this)
                                if (eventListener == this) {
                                    eventListener = null
                                }
                            }
                        }
                        eventListener = listener
                        reactHost.addReactInstanceEventListener(listener)
                    }
                }
            } else {
                val reactNativeHost = app.reactNativeHost
                val reactInstanceManager = reactNativeHost.reactInstanceManager
                val reactContext = reactInstanceManager.currentReactContext
                if (reactContext != null) {
                    // Already initialized
                    mountLegacy(reactInstanceManager)
                } else {
                    // Show fallback and listen for initialization
                    showPlaceholder("Tulip overlay initializing...")
                    val listener = object : ReactInstanceEventListener {
                        override fun onReactContextInitialized(context: ReactContext) {
                            mountLegacy(reactInstanceManager)
                            reactInstanceManager.removeReactInstanceEventListener(this)
                            if (eventListener == this) {
                                eventListener = null
                            }
                        }
                    }
                    eventListener = listener
                    reactInstanceManager.addReactInstanceEventListener(listener)
                }
            }
        } else {
            showPlaceholder("Tulip overlay error: ReactApplication not found.")
        }

        return rootContainer
    }

    private fun showPlaceholder(message: String) {
        val host = popupHost ?: return
        host.removeAllViews()

        val placeholder = TextView(context).apply {
            text = message
            setTextColor(Color.parseColor("#FFBF00"))
            textSize = 16f
            gravity = Gravity.CENTER
        }

        host.addView(
            placeholder,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
            )
        )
    }

    private fun mountBridgeless(reactHost: ReactHost) {
        val host = popupHost ?: return
        host.removeAllViews()

        try {
            val surface = reactHost.createSurface(context, "TulipOverlay", null)
            reactSurface = surface
            val surfaceView = surface.view
            if (surfaceView != null) {
                host.addView(
                    surfaceView,
                    FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT
                    )
                )
                surface.start()
            } else {
                showPlaceholder("Tulip overlay: Surface view is null.")
            }
        } catch (e: Exception) {
            e.printStackTrace()
            showPlaceholder("Tulip overlay load error: ${e.message}")
        }
    }

    private fun mountLegacy(reactInstanceManager: ReactInstanceManager) {
        val host = popupHost ?: return
        host.removeAllViews()

        try {
            val rRootView = ReactRootView(context)
            reactRootView = rRootView
            rRootView.startReactApplication(
                reactInstanceManager,
                "TulipOverlay",
                null
            )
            host.addView(
                rRootView,
                FrameLayout.LayoutParams(
                    FrameLayout.LayoutParams.MATCH_PARENT,
                    FrameLayout.LayoutParams.MATCH_PARENT
                )
            )
        } catch (e: Exception) {
            e.printStackTrace()
            showPlaceholder("Tulip overlay load error: ${e.message}")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        val app = context.applicationContext as? ReactApplication
        if (app != null && eventListener != null) {
            val isBridgeless = ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()
            if (isBridgeless) {
                app.reactHost?.removeReactInstanceEventListener(eventListener!!)
            } else {
                app.reactNativeHost.reactInstanceManager.removeReactInstanceEventListener(eventListener!!)
            }
        }
        eventListener = null

        reactSurface?.stop()
        reactSurface = null

        reactRootView?.unmountReactApplication()
        reactRootView = null

        popupHost = null
        container = null
    }

    override fun onShow(args: Bundle?, showFlags: Int) {
        super.onShow(args, showFlags)
    }
}

