# Mobile Testing Checklist

This checklist starts the post-construction testing workflow for Cycle Wars.

## Goal

Validate that the Android build can install, launch and complete core gameplay paths on an emulator and a physical phone before release hardening.

## Environment

- Windows development machine.
- Android Studio installed.
- Android SDK platform tools available.
- At least one Android emulator created.
- One physical Android device with developer options and USB debugging enabled.
- Project dependencies installed with `npm install`.

## Preflight Commands

Run these from the repository root:

```cmd
npm.cmd run smoke:static
npm.cmd --workspace @cycle-wars/mobile run typecheck
npm.cmd --workspace @cycle-wars/mobile run lint
npm.cmd --workspace @cycle-wars/shared run build
```

## APK Build

Run from `apps/mobile/android`:

```cmd
set "NODE_ENV=production"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\Pablo\AppData\Local\Android\Sdk"
set "ANDROID_SDK_ROOT=C:\Users\Pablo\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"
gradlew.bat assembleRelease
```

Expected output:

- Build finishes successfully.
- APK exists at `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`.

## Install And Launch

```cmd
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe devices
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r apps\mobile\android\app\build\outputs\apk\release\app-release.apk
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe shell monkey -p com.cyclewars.app 1
```

Expected result:

- Device appears in `adb devices`.
- APK install returns `Success`.
- App opens without a crash dialog.

## Manual QA Paths

- Launch app and confirm primary navigation renders.
- Complete auth entry or mocked auth state.
- Accept location permissions.
- Start ride recording.
- Confirm GPS samples are queued or sent.
- Open territory map and confirm map/territory UI renders.
- Trigger or review conquest state.
- Open battle screen and inspect battle summaries.
- Open clan screen and inspect member/governance flows.
- Open events and review rewards, schedule and reminders.
- Open social feed, notifications, chat and sharing.
- Open shop, wallet, inventory and equip flows.
- Toggle network loss and confirm offline ride queue behavior.

## Evidence To Capture

- APK build output path.
- Emulator launch screenshot.
- Physical phone launch screenshot.
- `adb logcat` excerpt for any crash or blocking error.
- Notes for each failed QA path with exact screen and action.

Record each run in `docs/MOBILE_QA_REPORT.md`.

Use `docs/ANDROID_DEVICE_SETUP.md` when `adb devices` is empty, unauthorized or the APK cannot be installed.

Use `docs/APK_BUILD_TROUBLESHOOTING.md` when the release APK build fails or produces a crashing install.
