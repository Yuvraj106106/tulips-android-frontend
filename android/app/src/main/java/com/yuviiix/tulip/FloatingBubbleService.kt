package com.yuviiix.tulip

import android.app.*
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.*
import android.widget.ImageView
import androidx.core.app.NotificationCompat
import kotlin.math.abs

class FloatingBubbleService : Service() {

    private lateinit var windowManager: WindowManager
    private var floatingBubble: ImageView? = null
    private var params: WindowManager.LayoutParams? = null

    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "floating_bubble_channel"
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
        addFloatingBubble()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Floating Bubble Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Channel for Krishna Floating Bubble"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Krishna Companion")
            .setContentText("Floating bubble is active")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun addFloatingBubble() {
        val sizeInDp = 60
        val scale = resources.displayMetrics.density
        val sizeInPx = (sizeInDp * scale + 0.5f).toInt()

        val circleDrawable = android.graphics.drawable.GradientDrawable().apply {
            shape = android.graphics.drawable.GradientDrawable.OVAL
            setColor(android.graphics.Color.parseColor("#FFBF00"))
        }

        floatingBubble = ImageView(this).apply {
            setImageResource(android.R.drawable.ic_menu_help)
            background = circleDrawable
            setPadding(sizeInPx / 4, sizeInPx / 4, sizeInPx / 4, sizeInPx / 4)
            setColorFilter(android.graphics.Color.parseColor("#0a0a1a"))
        }

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            WindowManager.LayoutParams.TYPE_PHONE
        }

        params = WindowManager.LayoutParams(
            sizeInPx,
            sizeInPx,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 0
            y = 100
        }

        floatingBubble?.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f
            private var isMoving = false

            override fun onTouch(v: View, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params!!.x
                        initialY = params!!.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
                        isMoving = false
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = (event.rawX - initialTouchX).toInt()
                        val dy = (event.rawY - initialTouchY).toInt()
                        if (abs(dx) > 10 || abs(dy) > 10) {
                            isMoving = true
                        }
                        params!!.x = initialX + dx
                        params!!.y = initialY + dy
                        windowManager.updateViewLayout(floatingBubble, params)
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        if (!isMoving) {
                            // Tapping the bubble
                            val intent = Intent(this@FloatingBubbleService, MainActivity::class.java).apply {
                                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            }
                            startActivity(intent)
                        } else {
                            // Snap to edges
                            snapToEdges()
                        }
                        return true
                    }
                }
                return false
            }
        })

        windowManager.addView(floatingBubble, params)
    }

    private fun snapToEdges() {
        val displayMetrics = resources.displayMetrics
        val screenWidth = displayMetrics.widthPixels
        val bubbleWidth = floatingBubble?.width ?: 0

        val middle = screenWidth / 2
        params?.x = if (params!!.x + bubbleWidth / 2 < middle) 0 else screenWidth - bubbleWidth
        windowManager.updateViewLayout(floatingBubble, params)
    }

    override fun onDestroy() {
        super.onDestroy()
        if (floatingBubble != null) {
            windowManager.removeView(floatingBubble)
        }
    }
}
