# Predictify Numbers

A number guessing game (Bulls and Cows) built with React Native and Expo.

## Game Rules

1. Select the number of digits (2-5)
2. Try to guess the secret number
3. After each guess, you'll see:
   - **+X (Bulls)**: X digits are correct and in the right position
   - **-Y (Cows)**: Y digits are correct but in the wrong position
4. Find the secret number in as few moves as possible!

## Features

- 2 to 5 digit game modes
- Real-time timer and move counter
- Haptic feedback on button presses
- Shake animation on invalid input
- Confetti celebration on winning
- Persistent leaderboard with AsyncStorage
- Dark theme UI

## Tech Stack

- React Native with Expo
- TypeScript
- React Navigation
- AsyncStorage for local storage
- Expo Haptics

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
```

## Project Structure

```
/PredictifyNumbers
├── App.tsx                 # Main app with navigation
├── src/
│   ├── screens/            # Screen components
│   ├── components/         # Reusable UI components
│   ├── context/            # React Context for state
│   ├── utils/              # Game logic and storage
│   ├── types/              # TypeScript definitions
│   └── constants/          # Theme and styling
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

## License

MIT
