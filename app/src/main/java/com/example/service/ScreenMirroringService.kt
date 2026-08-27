package com.example.service

import android.app.*
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import org.webrtc.*
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

class ScreenMirroringService : Service() {

    private var mediaProjection: MediaProjection? = null
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var videoSource: VideoSource? = null
    private var videoTrack: VideoTrack? = null
    private var videoCapturer: VideoCapturer? = null
    private val executor: ExecutorService = Executors.newSingleThreadExecutor()

    companion object {
        private const val CHANNEL_ID = "ScreenMirroringChannel"
        private const val NOTIFICATION_ID = 1001
        var isRunning = false
        var resultCode = 0
        var resultData: Intent? = null
    }

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, createNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (resultData != null) {
            startMirroring()
        }
        return START_STICKY
    }

    private var dataChannel: DataChannel? = null

    private fun startMirroring() {
        executor.execute {
            try {
                initWebRTC()
                val projectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
                mediaProjection = projectionManager.getMediaProjection(resultCode, resultData!!)

                videoCapturer = ScreenCapturerAndroid(resultData, object : MediaProjection.Callback() {
                    override fun onStop() {
                        stopMirroring()
                    }
                })

                val eglBaseContext = EglBase.create().eglBaseContext
                videoSource = peerConnectionFactory?.createVideoSource(videoCapturer!!.isScreencast)
                videoCapturer?.initialize(SurfaceTextureHelper.create("ScreenCaptureThread", eglBaseContext), this, videoSource!!.capturerObserver)
                videoCapturer?.startCapture(1280, 720, 30)

                videoTrack = peerConnectionFactory?.createVideoTrack("VIDEO_TRACK", videoSource)
                
                // Initialize Data Channel for Remote Control
                setupDataChannel()

                Log.d("MirrorService", "Screen capture and data channel initialized")
            } catch (e: Exception) {
                Log.e("MirrorService", "Error starting mirroring", e)
            }
        }
    }

    private fun setupDataChannel() {
        val dcInit = DataChannel.Init()
        dcInit.ordered = true
        dcInit.id = 1
        
        // In a real scenario, peerConnection.createDataChannel would be called
        // For this bridge, we simulate the observer for the remote control data
        Log.d("MirrorService", "DataChannel 'control-channel' ready for handshake")
    }

    private fun handleRemoteInput(payload: String) {
        // This function would be called by the DataChannel.Observer.onMessage
        Log.d("MirrorService", "Received Remote Input: $payload")
        // Logic to relay to AccessibilityService
        val intent = Intent("com.example.REMOTE_CONTROL_EVENT")
        intent.putExtra("payload", payload)
        sendBroadcast(intent)
    }

    private fun initWebRTC() {
        val options = PeerConnectionFactory.InitializationOptions.builder(this).createInitializationOptions()
        PeerConnectionFactory.initialize(options)

        val eglBaseContext = EglBase.create().eglBaseContext
        val encoderFactory = DefaultVideoEncoderFactory(eglBaseContext, true, true)
        val decoderFactory = DefaultVideoDecoderFactory(eglBaseContext)

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(encoderFactory)
            .setVideoDecoderFactory(decoderFactory)
            .createPeerConnectionFactory()
    }

    private fun stopMirroring() {
        videoCapturer?.stopCapture()
        videoCapturer?.dispose()
        mediaProjection?.stop()
        peerConnection?.close()
        peerConnectionFactory?.dispose()
        isRunning = false
        stopForeground(true)
        stopSelf()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Screen Mirroring Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    private fun createNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SREYMARA Mirroring")
            .setContentText("Screen mirroring is active")
            .setSmallIcon(android.R.drawable.ic_menu_share)
            .build()
    }

    override fun onDestroy() {
        stopMirroring()
        super.onDestroy()
    }
}
