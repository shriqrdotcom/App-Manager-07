---
name: Expo dependency install location
description: Environment constraint for imported Expo projects whose app lives in a frontend subdirectory
---

Imported Expo projects may have their package manager files below the repository root, while the Replit workflow runs from that app directory. Dependencies installed at the repository root do not make the app-local Expo CLI available to the workflow.

**Why:** A fresh import failed with `yarn run ... error Command "expo" not found` even though dependencies had been installed elsewhere in the workspace.

**How to apply:** Confirm the workflow working directory first, then install from that same directory using its existing lockfile. Avoid creating root-level package manifests for a nested app.