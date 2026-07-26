# Android Log Triage

Use this guide when the APK installs but the app crashes, freezes or opens to an unexpected screen.

## Goal

Capture the shortest useful `adb logcat` evidence and classify the issue before starting a fix.

## Clear And Reproduce

Run this before launching the app:

```cmd
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe logcat -c
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe shell monkey -p com.cyclewars.app 1
```

Reproduce the problem once. Avoid collecting logs after many unrelated actions.

## Capture Crash Logs

```cmd
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe logcat -d -t 800 | findstr /i "FATAL EXCEPTION AndroidRuntime ReactNativeJS cyclewars com.cyclewars"
```

If this returns nothing, collect a broader app log:

```cmd
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe logcat -d -t 1200 | findstr /i "cyclewars ReactNativeJS AndroidRuntime Exception Error"
```

## Triage Categories

### Java Or Native Crash

Signals:

- `FATAL EXCEPTION`
- `AndroidRuntime`
- Java stack trace with package or native module names.

Action:

- Record the first exception line.
- Record the first app-owned stack frame.
- Mark severity as blocker when the app cannot launch.

### JavaScript Runtime Crash

Signals:

- `ReactNativeJS`
- `TypeError`
- `ReferenceError`
- `undefined is not an object`

Action:

- Record the JS error line.
- Record the screen or action that triggered it.
- Compare with the TypeScript model if the value may be nullable.

### Bundle Or Asset Failure

Signals:

- `Unable to load script`
- `index.android.bundle`
- `loadScriptFromAssets`

Action:

- Confirm this is a release APK, not a debug shell expecting Metro.
- Rebuild with `gradlew.bat clean assembleRelease`.
- Review `docs/APK_BUILD_TROUBLESHOOTING.md`.

### Permission Or Device State

Signals:

- Location permission denied.
- GPS provider disabled.
- Emulator has no location source.

Action:

- Re-run permission prompts.
- Test emulator and physical phone separately.
- Record device model and Android version in `docs/MOBILE_QA_REPORT.md`.
