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

    companion object {
        var activeInstance: TulipVoiceInteractionSession? = null
    }

    private var container: FrameLayout? = null
    private var popupHost: FrameLayout? = null
    private var reactRootView: ReactRootView? = null
    private var reactSurface: ReactSurface? = null
    private var eventListener: ReactInstanceEventListener? = null

    // AO-4 v3 (this session): the native content view is now ALWAYS full-screen and
    // transparent. Previously popupContainer was sized to a fixed 45%/55% box docked
    // bottom-end - that meant the *actual Android window* never had more than that much
    // touchable space, no matter what. The JS side's collapsed/expanded animation had no
    // way to know that: it assumed it could grow to "the screen" size, so on expand it
    // laid out buttons/close-affordance beyond the small window's real bounds - they
    // rendered outside the touchable/visible area entirely (buttons not working, no
    // collapse option, expand ratio going "off screen"). Root cause: two independent
    // notions of "the window size" (native's small fixed box vs JS's full-screen
    // assumption) that never matched.
    //
    // Fix: native always gives RN a full-screen, always-full-size, transparent, touch-
    // passthrough-outside-content canvas. The "small bubble in the corner" vs
    // "expanded" look is now purely a JS/CSS concern (see OverlayGestureContainer.tsx),
    // animated freely within a canvas that's genuinely as big as the JS side thinks it
    // is. Native no longer needs to know or care about collapsed/expanded percentages.

    fun hideFromBridge() {
        hide()
    }

    override fun onCreateContentView(): View {
        activeInstance = this
        // Transparent, full-screen root. Nothing here is sized/docked anymore - RN
        // content decides its own visible bubble size/position and can grow all the way
        // to these real bounds without ever being clipped by a smaller native window.
        val rootContainer = FrameLayout(context).apply {
            setBackgroundColor(Color.TRANSPARENT)
        }
        container = rootContainer

        // AO-4 correction: this is deliberately NOT a card. No background/corner-radius
        // drawable here anymore - it's a transparent sizing/positioning bounds only, so
        // the avatar renders directly onto the transparent screen (per reference image),
        // not inside a dark-glass box.
        val popupContainer = FrameLayout(context)
        popupHost = popupContainer

        rootContainer.addView(
            popupContainer,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
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
        if (activeInstance == this) {
            activeInstance = null
        }
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
        activeInstance = this
    }

    // Bug 1 fix (v54): VoiceInteractionSession.hide() only hides the session's window -
    // it does NOT destroy the session or the mounted RN surface. Previously nothing here
    // ever called finish(), so a hidden session instance could stick around and be shown
    // again by the framework on a later assist trigger instead of a fresh onNewSession()
    // being dispatched. onCreateContentView() (where the RN surface is mounted) only runs
    // once per session instance, so reusing a hidden-not-destroyed session meant the user
    // saw whatever the RN surface last rendered - stale/"frozen" content from the previous
    // interaction, with no re-mount and no way for JS-side state to reset.
    //
    // Fix: explicitly finish() the session as soon as it's hidden, so onDestroy() runs its
    // existing full cleanup (already correct, see above) and the next assist trigger is
    // guaranteed to go through onNewSession() -> a brand-new TulipVoiceInteractionSession
    // -> a fresh onCreateContentView() mount, instead of possibly reusing stale state.
    // NOT YET VERIFIED ON DEVICE - this is a code-level diagnosis (no logcat captured for
    // Bug 1 yet), so confirm the frozen-content symptom is actually gone after this before
    // considering Bug 1 closed.
    override fun onHide() {
        super.onHide()
        finish()
    }
}
