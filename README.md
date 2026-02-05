# Predictify Numbers

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-iOS%20%7C%20Android-lightgrey.svg)]()
[![Expo](https://img.shields.io/badge/Expo-SDK%2054-000020.svg)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6.svg)](https://www.typescriptlang.org)

A number guessing game based on the classic **Bulls and Cows** mechanic, built with React Native and Expo.

## Game Rules

1. Select the number of digits (2-5)
2. Try to guess the secret number
3. After each guess, you'll see:
   - **+X (Bulls)**: X digits are correct and in the right position
   - **-Y (Cows)**: Y digits are correct but in the wrong position
4. Find the secret number in as few moves as possible!

## Features

- **Multiple Difficulty Levels** - 2, 3, 4, and 5 digit game modes
- **Real-time Timer** - Track your solving speed
- **Move Counter** - Count your guesses
- **Haptic Feedback** - Tactile response on button presses
- **Animations** - Shake on invalid input, confetti on win
- **Persistent Leaderboard** - Top 10 records per difficulty with medals
- **Dark Theme** - Eye-friendly dark UI
- **Fully Offline** - No internet connection required

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [React Native](https://reactnative.dev/) | Cross-platform mobile framework |
| [Expo](https://expo.dev/) | Development & build toolchain |
| [TypeScript](https://www.typescriptlang.org/) | Type-safe JavaScript |
| [React Navigation](https://reactnavigation.org/) | Screen navigation |
| [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) | Local data persistence |
| [Expo Haptics](https://docs.expo.dev/versions/latest/sdk/haptics/) | Haptic feedback |

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or Expo Go app)

### Installation

```bash
# Clone the repository
git clone https://github.com/alperyardimci/predictify-numbers.git

# Navigate to the project
cd predictify-numbers

# Install dependencies
npm install

# Start the development server
npx expo start
```

### Running on Simulator

```bash
# iOS
npx expo start --ios

# Android
npx expo start --android

# Web
npx expo start --web
```

## Project Structure

```
PredictifyNumbers/
├── App.tsx                    # Root navigation container
├── index.ts                   # Entry point
├── app.json                   # Expo configuration
├── eas.json                   # EAS Build configuration
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Main menu & difficulty selection
│   │   ├── GameScreen.tsx     # Active gameplay
│   │   └── RecordsScreen.tsx  # Leaderboard
│   ├── components/
│   │   ├── DigitSelector.tsx  # Difficulty selector
│   │   ├── GuessInput.tsx     # Number input keypad
│   │   ├── GuessHistory.tsx   # Past guesses display
│   │   ├── ResultModal.tsx    # Win modal with confetti
│   │   └── Timer.tsx          # Timer & move counter
│   ├── context/
│   │   └── GameContext.tsx    # Game state management
│   ├── utils/
│   │   ├── gameLogic.ts      # Number generation & evaluation
│   │   └── storage.ts        # AsyncStorage wrapper
│   ├── types/
│   │   └── index.ts          # TypeScript definitions
│   └── constants/
│       └── theme.ts          # Colors, spacing, typography
└── assets/                    # App icons & splash screens
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo
eas login

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

## Documentation

- [Privacy Policy](PRIVACY_POLICY.md)
- [Support](SUPPORT.md)
- [Changelog](CHANGELOG.md)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Alper Yardimci** - [GitHub](https://github.com/alperyardimci)
