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
 */
class TulipVoiceInteractionSession(context: Context) : VoiceInteractionSession(context) {

    private var container: FrameLayout? = null
    private var reactRootView: ReactRootView? = null
    private var reactSurface: ReactSurface? = null
    private var eventListener: ReactInstanceEventListener? = null

    override fun onCreateContentView(): View {
        val rootContainer = FrameLayout(context).apply {
            setBackgroundColor(Color.parseColor("#0A0A1A"))
        }
        container = rootContainer

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
        val rootContainer = container ?: return
        rootContainer.removeAllViews()

        val placeholder = TextView(context).apply {
            text = message
            setTextColor(Color.parseColor("#FFBF00"))
            textSize = 16f
            gravity = Gravity.CENTER
        }

        rootContainer.addView(
            placeholder,
            FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
            )
        )
    }

    private fun mountBridgeless(reactHost: ReactHost) {
        val rootContainer = container ?: return
        rootContainer.removeAllViews()

        try {
            val surface = reactHost.createSurface(context, "TulipOverlay", null)
            reactSurface = surface
            val surfaceView = surface.view
            if (surfaceView != null) {
                rootContainer.addView(
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
        val rootContainer = container ?: return
        rootContainer.removeAllViews()

        try {
            val rRootView = ReactRootView(context)
            reactRootView = rRootView
            rRootView.startReactApplication(
                reactInstanceManager,
                "TulipOverlay",
                null
            )
            rootContainer.addView(
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

        container = null
    }

    override fun onShow(args: Bundle?, showFlags: Int) {
        super.onShow(args, showFlags)
    }
}

