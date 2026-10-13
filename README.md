# ✦ Nova Calculator — Android (`.kts`) Project

**— powered by RV GROUP —**  
**RV Group LTD | ♥️ BY PANKAJ**

Yeh **Nova Calculator** ka complete, production-ready **Android Studio + Kotlin (`.kt`) + Gradle Kotlin DSL (`.kts`)** source code hai, jismein **GitHub Actions Auto-APK Release** pehle se configured hai.

---

## 🚀 GitHub Se Direct APK Kaise Banayein Aur Download Karein (Step-by-Step)

Aap bina Android Studio install kiye seedha **GitHub** par repository banakar apna signed **`.apk`** download kar sakte hain:

1. **GitHub par Nayi Repository Banayein**
   - [GitHub](https://github.com/new) par jaakar ek nayi repository create karein (e.g., `nova-calculator-apk`).
2. **Ye Project Files Upload / Push Karein**
   - Is ZIP file ko extract karein aur saari files (`app/`, `gradle/`, `.github/workflows/build-apk.yml`, `build.gradle.kts`, `settings.gradle.kts`, `gradle.properties`, `gradlew`) apne GitHub repo ke `main` branch mein push ya upload kar dein.
   - **Termux / Git Commands (Recommended taaki `.github` folder miss na ho):**
     ```bash
     git init
     git branch -M main
     git add -A
     git commit -m "Initial commit: Nova Calculator Android KTS by RV Group LTD"
     git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
     git push -u origin main
     ```
3. **GitHub Releases Se APK Download Karein**
   - Jaise hi code `main` branch par push hoga, **GitHub Actions** apne aap chalu ho jayega (~2–3 minute mein build complete hoga).
   - Build complete hote hi aapke GitHub repo ke **Releases** section (`v1.0.0`) mein **`Nova-Calculator-v1.0.0-RV-Group.apk`** aa jayega — wahan se seedha download karke kisi bhi Android phone mein install karein!

---

## 📂 Project Architecture (`.kts` + Kotlin)

```text
Nova-Calculator-Android-KTS/
├── settings.gradle.kts                          # Gradle Kotlin DSL project settings
├── build.gradle.kts                             # Root Gradle Kotlin DSL build config (AGP 8.5.2, Kotlin 1.9.24)
├── gradle.properties                            # AndroidX & JVM configuration
├── gradlew                                      # Self-bootstrapping Gradle wrapper
├── .github/workflows/build-apk.yml              # Auto-builds signed APK & publishes to GitHub Releases
└── app/
    ├── build.gradle.kts                         # App module Gradle Kotlin DSL + auto-keystore signing
    ├── proguard-rules.pro                       # Keeps @JavascriptInterface methods intact
    └── src/main/
        ├── AndroidManifest.xml                  # Permissions, MainActivity, FileProvider, WhatsApp queries
        ├── java/com/rvgroup/novacalculator/
        │   ├── MainActivity.kt                  # Edge-to-edge shell, WebViewAssetLoader, dialogs, back nav
        │   ├── bridge/NovaNativeBridge.kt       # @JavascriptInterface connecting UI to Android OS
        │   └── util/
        │       ├── HapticHelper.kt              # Native Android VibrationEffect haptics
        │       ├── SpeechHelper.kt              # Native Android Hindi (hi-IN) & English (en-IN) TTS
        │       └── ShareHelper.kt               # FileProvider PNG card & WhatsApp share + TXT export
        ├── res/                                 # Dark theme, strings, FileProvider paths, mipmap icons
        └── assets/                              # Bundled Nova Calculator UI + RV Group LTD branding
```

---

## ✨ Branding & Opening Animation Details

- **Opening Animation (2.3 Seconds)**: App open hote hi **RV Group LTD — Powering Possibilities** logo card, neon progress bar, **`— powered by RV GROUP —`** lockup, aur **`RV Group LTD | ♥️ BY PANKAJ`** ke saath smooth 2.3-second splash animation dikhta hai (tap karke turant skip bhi kar sakte hain).
- **App Footer & Topbar**: Har jagah **`— powered by RV GROUP —`** logo lockup aur **`RV Group LTD | ♥️ BY PANKAJ`** signature laga hua hai.
- **Branded Share Card**: Calculation ko image ya WhatsApp par share karne par card ke niche **`— powered by RV GROUP —`** logo aur **`RV Group LTD | ♥️ BY PANKAJ`** print hota hai.
# Nova
