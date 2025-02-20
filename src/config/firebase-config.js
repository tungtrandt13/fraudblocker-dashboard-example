import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const config = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: "fraud-blocker.firebaseapp.com",
    databaseURL: "https://fraud-blocker.firebaseio.com",
    projectId: "fraud-blocker",
    storageBucket: "fraud-blocker.appspot.com",
    messagingSenderId: "861365078961",
};

// const app = initializeApp(config);
// const auth = getAuth(app);
// const storage = getStorage(app);

const auth = () => ({
    currentUser: {
        getIdToken: () => "fakeToken",
    },
});

export { auth };
