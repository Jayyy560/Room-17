# Room 17

Room 17 is a location-based campus dating app that only works at a specific place, at a specific time.

No swiping.
No endless chatting.
Just show up, signal, match — and meet in real life.

---

## 🚀 Concept

Room 17 creates a time-limited "Arena" on campus.

During the activation window:

- Students inside the physical zone can enter the Arena
- Each user gets 3 signals
- If two people signal each other → it's a match
- Chat unlocks for 10 minutes
- If you meet IRL, both earn extra points

The goal is simple: push interaction offline.

---

## 🎯 Core Mechanics

### Arena Window
- Active daily from 3 PM – 5 PM
- Only accessible within a defined campus radius
- Countdown shown outside activation hours

### Signals
- 3 signals per session
- Mutual signals create a match
- Signals enforced server-side (transactional, atomic decrement)

### Matches
- Deterministic match IDs (no duplicates)
- Swipe to archive or unmatch
- Mutual match = +20 bravery points

### Chat
- Text-only
- Stored under `matches/{matchId}/messages`
- Auto-expires after 10 minutes unless extended
- "Met IRL" confirmation awards +30 points

### Gamification
Bravery Points:
- +10 Activation
- +20 Mutual Match
- +30 Met IRL

Levels:
- Level 1: 0–49
- Level 2: 50–149
- Level 3: 150–299
- Level 4: 300+

---

## 🛡 Safety

- Block user
- Report user (auto-flag after 3 reports)
- No precise location sharing
- Server-side enforcement of:
  - Activation window
  - Active zone requirement
  - Signals remaining
  - Authenticated sender only

---

## 🧠 Compatibility Logic

Users only see others if attraction is mutual.

Example:
- Straight male → sees females who are interested in males
- Gay male → sees males who are interested in males
- Lesbian → sees females who are interested in females
- Bisexual → sees users compatible with their gender

No asymmetric exposure.

---

## 🏗 Tech Stack

Frontend:
- React Native (Expo, Managed Workflow)
- TypeScript
- React Navigation

Backend:
- Firebase Authentication
- Firestore
- Cloud Functions (transactional match logic)

Native Modules:
- expo-location
- expo-notifications
- expo-image-picker

---

## 📦 Building APK

Using EAS:

```bash
eas build --platform android --profile preview
