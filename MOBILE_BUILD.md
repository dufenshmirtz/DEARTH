# DEARTH Mobile Build

This mobile build is Arcade-only. It uses `app.html` as the native entry point and leaves `mobile.html` for the PvP phone flow.

## Source Flow

- `app.html` boots the normal game code with `window.DEARTH_APP_MODE = "arcade-native"`.
- `pnpm run mobile:build` copies the Arcade app bundle into `native-www/`.
- Capacitor syncs `native-www/` into `android/` and `ios/`.
- The native bundle id is currently `com.aenao.dearth` in `capacitor.config.json`.

## Commands

```powershell
pnpm install
pnpm run mobile:sync
```

Android:

```powershell
pnpm run mobile:sync
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat bundleRelease
```

This Capacitor/Android Gradle setup requires JDK 21 and Android SDK 36. A local portable toolchain can be kept in `.android-toolchain/`; that folder is ignored by Git.

iOS must be built on macOS with Xcode:

```bash
pnpm install
pnpm run mobile:ios
open ios/App/App.xcworkspace
```

## Native Notes

- Android is locked to landscape with `android:screenOrientation="sensorLandscape"`.
- iOS supports landscape left/right only and sets `UIRequiresFullScreen`.
- Arcade runs are saved in native app local storage and can be resumed from the app menu.
- Final store builds still need Android signing credentials, a final bundle id, app icons, screenshots, and store metadata.
