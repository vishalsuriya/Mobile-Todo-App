import { initializeApp, getApps } from "firebase/app";
import { initializeAuth,getReactNativePersistence, getAuth } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
const firebaseConfig = {
  apiKey: "AIzaSyBiVg23_Ys4bmTalZDuCqc19lg9WrlmXjg",
  authDomain: "todolist-82587.firebaseapp.com",
  projectId: "todolist-82587",
  storageBucket: "todolist-82587.appspot.com",
  messagingSenderId: "154550537593",
  appId: "1:154550537593:web:51785cd5ca70735284b3a8",
  measurementId: "G-8YV89TJLXT"
};

let app;
let auth;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app,{
    persistence :getReactNativePersistence(ReactNativeAsyncStorage)
  })
} else {
  app = getApps()[0];
  auth = getAuth();
}

export  {
  app,
  auth
};
