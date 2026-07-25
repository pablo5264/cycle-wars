# Mobile QA Report

Use this template for each emulator or physical-device validation run.

## Run Metadata

- Date:
- Tester:
- Build commit:
- APK path:
- Device type:
- Device model:
- Android version:
- Network mode:

## Preflight Results

| Gate | Result | Notes |
| --- | --- | --- |
| `npm.cmd run smoke:static` | Pending |  |
| `npm.cmd --workspace @cycle-wars/mobile run typecheck` | Pending |  |
| `npm.cmd --workspace @cycle-wars/mobile run lint` | Pending |  |
| `npm.cmd --workspace @cycle-wars/shared run build` | Pending |  |

## Install And Launch

| Check | Result | Evidence |
| --- | --- | --- |
| Device appears in `adb devices` | Pending |  |
| APK installs with `Success` | Pending |  |
| App launches without crash dialog | Pending |  |
| First screen renders correctly | Pending |  |

## Manual QA Matrix

| Area | Scenario | Result | Notes |
| --- | --- | --- | --- |
| Auth | Entry or mocked session opens app flow | Pending |  |
| Permissions | Location permission prompt behaves correctly | Pending |  |
| Ride | Ride recording starts and stops | Pending |  |
| GPS | Samples queue or submit successfully | Pending |  |
| Map | Territory map renders | Pending |  |
| Conquest | Conquest state can be reviewed | Pending |  |
| Battle | Battle screen and summaries render | Pending |  |
| Clan | Clan screen and governance flows render | Pending |  |
| Events | Rewards, schedule and reminders render | Pending |  |
| Social | Feed, notifications, chat and sharing render | Pending |  |
| Shop | Wallet, inventory and equip flows render | Pending |  |
| Offline | Ride queue handles network loss and retry | Pending |  |

## Crash And Log Review

Capture logs when a crash or blocking error appears:

```cmd
C:\Users\Pablo\AppData\Local\Android\Sdk\platform-tools\adb.exe logcat -d -t 500 | findstr /i "FATAL EXCEPTION AndroidRuntime ReactNativeJS cyclewars com.cyclewars"
```

| Issue | Screen | Action | Log excerpt | Severity |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Screenshots And Evidence

- Emulator launch:
- Physical device launch:
- Critical flow screenshots:
- Crash dialog screenshot:

## Exit Decision

- Overall result: Pending
- Ready for release hardening: No
- Blocking issues:
- Follow-up fixes:
