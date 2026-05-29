package io.github.toyota32k.bootauri2.app

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Bundle
import android.util.Log

class MainActivity : TauriActivity() {
    private var multicastLock: WifiManager.MulticastLock? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // mDNS / マルチキャスト UDP 受信のために MulticastLock を取得する。
        // これを取らないと Android はバッテリー節約のためマルチキャストパケットをドロップする。
        try {
            val wifi = applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            multicastLock = wifi.createMulticastLock("bootauri2-mdns").apply {
                setReferenceCounted(true)
                acquire()
            }
            Log.i("BooTauri", "MulticastLock acquired")
        } catch (e: Exception) {
            Log.w("BooTauri", "MulticastLock failed: ${e.message}")
        }
    }

    override fun onDestroy() {
        try {
            multicastLock?.let {
                if (it.isHeld) it.release()
            }
        } catch (_: Exception) {}
        multicastLock = null
        super.onDestroy()
    }
}
