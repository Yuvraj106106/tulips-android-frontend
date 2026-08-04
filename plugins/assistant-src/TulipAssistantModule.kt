package com.yuviiix.tulip

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class TulipAssistantModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "TulipAssistantModule"

    @ReactMethod
    fun hideAssistant(promise: Promise) {
        try {
            TulipVoiceInteractionSession.activeInstance?.hideFromBridge()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("HIDE_ERROR", e.message, e)
        }
    }
}
