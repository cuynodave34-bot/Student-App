# OTA (Over-The-Air) Update Guide

## Overview

OTA updates let you push JavaScript & asset changes to users **instantly** — no need to rebuild and reinstall the APK. This uses **EAS Update** with the `preview` channel.

--- 

## * eas update --channel preview --message "your message"

## One-Time Setup

### 1. Install expo-updates

```bash
npx expo install expo-updates
```

### 2. Add expo-updates to app.json plugins

In `app.json`, add `"expo-updates"` to the plugins array:

```json
"plugins": [
  "expo-font",
  "expo-secure-store",
  "expo-updates"
]
```

### 3. Verify eas.json has the preview channel

Your `eas.json` preview profile should include a `channel`:

```json
"preview": {
  "android": {
    "buildType": "apk"
  },
  "distribution": "internal",
  "channel": "preview"
}
```

### 4. Build the APK with the preview channel

You must build AT LEAST ONCE with the channel configured so the app knows where to check for updates:

```bash
eas build -p android --profile preview
```

Install this APK on your device. This is the base build that will receive OTA updates.

---

## Pushing an OTA Update

After making code changes (JS/assets only), run:

```bash
eas update --channel preview --message "describe your changes here"
```

**Example:**

```bash
eas update --channel preview --message "fix: dashboard crash on empty data"
```

That's it! Users who have the preview APK installed will receive the update automatically on the next app launch.

---

## Useful Commands

| Command | Description |
|---|---|
| `eas update --channel preview --message "..."` | Push a new OTA update |
| `eas update:list` | List all published updates |
| `eas update:view <update-id>` | View details of a specific update |
| `eas update:rollback --channel preview` | Roll back to the previous update |
| `eas channel:list` | List all channels |

---

## What CAN be updated via OTA

- JavaScript code changes (screens, logic, styles)
- Asset changes (images, fonts bundled via `require()`)

## What CANNOT be updated via OTA (requires a new build)

- Native module additions/removals (new `expo install` of native packages)
- Changes to `app.json` native config (package name, permissions, splash screen)
- SDK version upgrades
- Changes to `eas.json` build config

---

## How It Works

1. You build an APK with `--profile preview` → the app is linked to the `preview` channel
2. You run `eas update --channel preview` → your JS bundle is uploaded to EAS servers
3. When a user opens the app → it checks the `preview` channel for new updates
4. If an update is found → it downloads in the background and applies on the next launch

---

## Tips

- **Always test locally** before pushing an OTA update (`npx expo start`)
- **Write clear messages** so you can identify updates in `eas update:list`
- **If something breaks**, roll back immediately: `eas update:rollback --channel preview`
- OTA updates are **near-instant** for users — no app store/APK reinstall needed
