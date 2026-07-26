# Android Device And ADB Setup

Use this guide when the APK builds but the phone or emulator is not visible to Android tooling.

## Goal

Confirm that Android Studio, platform tools, emulator and physical-device debugging are ready before running mobile QA.

## Required Paths

Expected local paths on Pablo's Windows machine:

```cmd
C:\Program Files\Android\Android Studio\jbr
C:\Users\Pablo\AppData\Local\Android\Sdk
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe
```

## Command Prompt Setup

Run this in every new terminal before Android commands:

```cmd
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\Pablo\AppData\Local\Android\Sdk"
set "ANDROID_SDK_ROOT=C:\Users\Pablo\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\emulator;%PATH%"
```

## ADB Health Check

```cmd
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe kill-server
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe start-server
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe devices
```

Expected result:

- Emulator or physical phone appears under `List of devices attached`.
- If the list is empty, the app cannot be installed from the command line yet.

## Physical Phone Checklist

- Enable Developer Options.
- Enable USB debugging.
- Connect with a data-capable USB cable.
- Unlock the phone screen.
- Accept the RSA fingerprint prompt on the phone.
- Re-run `adb.exe devices`.

Expected physical device state:

```text
List of devices attached
<device-id>    device
```

If the state is `unauthorized`, unlock the phone and accept the debugging prompt.

## Emulator Checklist

- Open Android Studio.
- Open Device Manager.
- Start one emulator.
- Wait until Android home screen is fully loaded.
- Re-run `adb.exe devices`.

## Install Test

```cmd
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe install -r apps\mobile\android\app\build\outputs\apk\release\app-release.apk
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe shell monkey -p com.cyclewars.app 1
```

Expected result:

- Install returns `Success`.
- App launches without `Cycle Wars keeps stopping`.

## Log Capture

```cmd
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe logcat -d -t 500 | findstr /i "FATAL EXCEPTION AndroidRuntime ReactNativeJS cyclewars com.cyclewars"
```
