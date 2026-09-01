# Push Notifications Setup — Raikaro Android App

Yeh guide Firebase Cloud Messaging (FCM) ke through native push notifications enable karne ke liye hai.

> **Note on web vs native push:**  
> Website pe pehle se OneSignal web push hai (browser-based). Woh alag kaam karta hai aur is setup se conflict NAHI karega. Web push aur native push dono parallel kaam kar sakte hain:
> - **Web push (OneSignal)** → Browser/PWA notifications → Website ke andar kaam karta hai
> - **Native push (FCM)** → Android OS-level notifications → App close hone par bhi aata hai

---

## Step 1: Firebase Project Banao

1. [Firebase Console](https://console.firebase.google.com/) open karo
2. **Add project** → Project name: `raikaro-app` (ya kuch bhi)
3. Google Analytics: optional, enable ya disable karein
4. **Create project**

---

## Step 2: Android App Firebase Mein Add Karo

1. Firebase Console mein project khola → **Add app** → Android icon
2. Fill karo:
   - **Android package name**: `com.raikaro.reviewapp`
   - **App nickname**: Raikaro Android (optional)
   - **Debug signing certificate**: optional, baad mein add kar sakte ho
3. **Register app** click karo

---

## Step 3: google-services.json Download Karo

1. **Download google-services.json** button click karo
2. File download hogi — iska path hoga kuch aisa: `~/Downloads/google-services.json`

---

## Step 4: File Project Mein Place Karo

```bash
# Yeh file android/app/ folder mein daalni hai
cp ~/Downloads/google-services.json /path/to/reviewer-app/android/app/google-services.json
```

Ya manually File Explorer se `reviewer-app/android/app/` folder mein paste karo.

**Folder structure aisi honi chahiye:**
```
android/
  app/
    google-services.json   ← yahan
    src/
    build.gradle
```

---

## Step 5: Sync aur Build

```bash
npx cap sync android
npx cap open android
```

Android Studio mein Gradle sync hoga aur push notifications kaam karna shuru ho jayengi.

---

## Step 6: FCM Server Key (Backend ke liye)

Notifications backend se bhejna ho to:
1. Firebase Console → Project Settings → Cloud Messaging
2. **Server key** copy karo
3. Ise apne backend/admin panel mein use karo push bhejne ke liye

---

## Test Kaise Karein

1. App phone pe install karo (debug build)
2. Firebase Console → **Messaging** → **Send your first message**
3. Title aur body enter karo
4. **Send test message** → App ka FCM token paste karo (log se milega)
5. Send karo — phone pe notification aani chahiye

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `google-services.json not found` error | File `android/app/` mein hai confirm karo |
| Notification nahi aayi | Phone mein app notification permission check karo |
| Build fail ho raha hai | `File > Invalidate Caches > Restart` try karo |
| Debug FCM token kahan milega | `adb logcat` mein `FCMToken:` dhundho |
