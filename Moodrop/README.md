# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start --tunnel
   ```

Method1.
A) Run the app in Expo Go mode so that the application can be run on the app
Change to Expo Go Mode 
So that the app will run in the given app

Scan the QR code
Click run in Expo go App

B) Make sure the Backend API address is configured properly
Check the app.json file and change the backend API address(EXPO_PUBLIC_API_BASE_URL)

If the back-end server is not deployed ,
Use the same Wi-Fi So that the phone can send and API call to the given computer and retrieve data from the backend server which is the computer that you're using

Method2.
npx expo start --web
configure the backend api address to localhost:8080 or with the given port number

Use the web page to run the front-end server and the back-end server int the same machine

That will surely reduce the complexity of running the app in the expo go app.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
