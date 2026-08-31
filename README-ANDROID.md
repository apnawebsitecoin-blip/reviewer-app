# Android App Build Guide — ReviewApp

Yeh guide aapko `.aab` file (Play Store ke liye) generate karne mein help karegi.

---

## Prerequisites

### 1. Android Studio Install Karo

1. https://developer.android.com/studio pe jaao
2. Latest stable version download karo (Hedgehog ya newer)
3. Install karo — default settings sahi hain
4. Pehli baar kholne par SDK Manager automatically required SDKs install kar dega
5. **Java 17** required hai — Android Studio ke saath bundled aata hai

### 2. Node.js & Project Dependencies

```bash
npm install
```

---

## Workflow: Website Update Ke Baad

Kyunki app directly live Vercel URL (`https://reviewer-app-orpin.vercel.app`) load karta hai, website changes ke liye **koi extra step nahi** — app automatically latest version dikhayega.

Sirf Capacitor config ya native Android code change hone par yeh run karo:

```bash
npx cap sync android
```

---

## Android Studio Mein Project Open Karo

```bash
npx cap open android
```

Ya manually: Android Studio > **File > Open** > `reviewer-app/android` folder select karo.

Pehli baar Gradle sync hoga (internet chahiye, 2-5 min lag sakte hain).

---

## Signed .aab File Generate Karo (Play Store ke liye)

### Step 1: Keystore Banao (SIRF PEHLI BAAR)

Android Studio mein:

1. **Build > Generate Signed Bundle / APK** click karo
2. **Android App Bundle** select karo > Next
3. **Create new...** click karo
4. Fill karo:
   - **Key store path**: Koi safe jagah — jaise `~/Desktop/reviewapp-keystore.jks`
   - **Password**: Strong password (yaad rakhein ya password manager mein save karein)
   - **Key alias**: `reviewapp`
   - **Key password**: (same ya alag)
   - **Validity**: 25 years
   - **Certificate fields**: Apna naam aur country fill karo (`IN` for India)
5. **OK** click karo

### ⚠️ KEYSTORE BACKUP — BAHUT ZAROORI

```
Keystore file khone par aap kabhi bhi app update publish NAHI kar sakoge.
Google Play ek baar set keystore se bandhaa rehta hai.

Backup karo:
- Google Drive
- Email to yourself
- External hard drive

Password bhi safe jagah note karo (password manager recommended).
```

### Step 2: .aab Build Karo

1. **Build > Generate Signed Bundle / APK**
2. **Android App Bundle** > Next
3. Apna keystore select karo, passwords enter karo
4. **release** build variant choose karo
5. **Finish**

Build complete hone par file milegi:
```
android/app/release/app-release.aab
```

---

## Play Store Pe Upload Karo

1. [Google Play Console](https://play.google.com/console) open karo
2. App create karo (agar pehli baar hai)
3. **Production > Create new release** pe jaao
4. `.aab` file upload karo
5. Release notes fill karo
6. Review submit karo

---

## Version Update Karne Ka Tarika

Har naye release se pehle `android/app/build.gradle` mein update karo:

```groovy
versionCode 2          // pichle se +1 karo (Play Store requirement)
versionName "1.1.0"    // apni versioning scheme ke hisaab se
```

Phir dobara signed .aab generate karo.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Gradle sync fail | File > Invalidate Caches > Restart |
| SDK missing | SDK Manager se install karo |
| Build fail (JAVA_HOME) | Android Studio bundled JDK use karo |
| App blank screen dikh raha hai | Internet permission check karo, device mein internet hai? |
