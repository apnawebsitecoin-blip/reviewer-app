package com.raikaro.reviewapp;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.Toast;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private static final int PUSH_PERMISSION_CODE = 1001;

    private boolean backPressedOnce = false;
    private SwipeRefreshLayout swipeRefreshLayout;
    private View offlineOverlay;

    private final BroadcastReceiver networkReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            runOnUiThread(() -> {
                if (isNetworkAvailable()) {
                    hideOfflineView();
                    if (getBridge() != null) getBridge().getWebView().reload();
                } else {
                    showOfflineView();
                }
            });
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestPushPermission();

        // Wait for Capacitor to add WebView to the hierarchy before wrapping it
        getWindow().getDecorView().post(() -> {
            setupSwipeRefresh();
            setupOfflineOverlay();
            if (!isNetworkAvailable()) showOfflineView();
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        IntentFilter filter = new IntentFilter(ConnectivityManager.CONNECTIVITY_ACTION);
        registerReceiver(networkReceiver, filter);
        if (!isNetworkAvailable()) showOfflineView();
    }

    @Override
    protected void onPause() {
        super.onPause();
        try { unregisterReceiver(networkReceiver); } catch (Exception ignored) {}
    }

    // ── Back button: go back in WebView history, double-tap to exit ─────────────

    @Override
    public void onBackPressed() {
        if (getBridge() != null) {
            WebView webView = getBridge().getWebView();
            if (webView != null && webView.canGoBack()) {
                webView.goBack();
                return;
            }
        }
        if (backPressedOnce) {
            super.onBackPressed();
            return;
        }
        backPressedOnce = true;
        Toast.makeText(this, "Bahar jaane ke liye dobara dabayen", Toast.LENGTH_SHORT).show();
        new Handler(Looper.getMainLooper()).postDelayed(() -> backPressedOnce = false, 2000);
    }

    // ── Pull-to-refresh: wrap Capacitor's WebView in SwipeRefreshLayout ─────────

    private void setupSwipeRefresh() {
        if (getBridge() == null) return;
        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        ViewGroup parent = (ViewGroup) webView.getParent();
        if (parent == null) return;

        int index = parent.indexOfChild(webView);
        ViewGroup.LayoutParams params = webView.getLayoutParams();
        parent.removeView(webView);

        swipeRefreshLayout = new SwipeRefreshLayout(this);
        swipeRefreshLayout.setColorSchemeColors(Color.parseColor("#4F46E5"));
        swipeRefreshLayout.setLayoutParams(params);
        swipeRefreshLayout.setOnChildScrollUpCallback((p, child) ->
                webView.canScrollVertically(-1));

        swipeRefreshLayout.addView(webView, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        swipeRefreshLayout.setOnRefreshListener(() -> {
            webView.reload();
            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                if (swipeRefreshLayout != null) swipeRefreshLayout.setRefreshing(false);
            }, 1500);
        });

        parent.addView(swipeRefreshLayout, index);
    }

    // ── Offline overlay setup ────────────────────────────────────────────────────

    private void setupOfflineOverlay() {
        offlineOverlay = getLayoutInflater().inflate(R.layout.offline_view, null);
        Button retryBtn = offlineOverlay.findViewById(R.id.retry_button);
        retryBtn.setOnClickListener(v -> {
            if (isNetworkAvailable()) {
                hideOfflineView();
                if (getBridge() != null) getBridge().getWebView().reload();
            } else {
                Toast.makeText(this, "Internet connection nahi hai", Toast.LENGTH_SHORT).show();
            }
        });
        ViewGroup root = (ViewGroup) getWindow().getDecorView();
        root.addView(offlineOverlay, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        offlineOverlay.setVisibility(View.GONE);
    }

    private void showOfflineView() {
        if (offlineOverlay != null) offlineOverlay.setVisibility(View.VISIBLE);
        if (swipeRefreshLayout != null) swipeRefreshLayout.setEnabled(false);
    }

    private void hideOfflineView() {
        if (offlineOverlay != null) offlineOverlay.setVisibility(View.GONE);
        if (swipeRefreshLayout != null) swipeRefreshLayout.setEnabled(true);
    }

    // ── Network check ────────────────────────────────────────────────────────────

    private boolean isNetworkAvailable() {
        ConnectivityManager cm =
                (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            NetworkCapabilities cap = cm.getNetworkCapabilities(cm.getActiveNetwork());
            return cap != null && (
                    cap.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                    cap.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                    cap.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET));
        }
        //noinspection deprecation
        return cm.getActiveNetworkInfo() != null && cm.getActiveNetworkInfo().isConnected();
    }

    // ── Push notification permission (Android 13+) ───────────────────────────────

    private void requestPushPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                requestPermissions(
                        new String[]{ Manifest.permission.POST_NOTIFICATIONS },
                        PUSH_PERMISSION_CODE);
            }
        }
    }
}
