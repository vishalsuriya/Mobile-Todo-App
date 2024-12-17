import { View, Text, StyleSheet, TextInput, Button, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../Services/Firebase';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      if (user.emailVerified) {
        navigation.navigate("Home");
      } else {
        alert('Please verify your email before logging in.');
        auth.signOut();
      }
    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const gotoRegister = () => {
    navigation.navigate('Register');
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'User not found';
      case 'auth/missing-password':
        return 'Please enter your password';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later.';
      case 'auth/invalid-credential':
        return 'Please check your email and password and try again.';
      default:
        return 'Authentication error. Please try again.';
    }
  };

  const handleForgetPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset your password.");
      return;
    }
    try {
      setIsSendingReset(true);
      await sendPasswordResetEmail(auth, email);
      alert("A password reset email has been sent! Check your inbox to reset your password.");
    } catch (error) {
      setError(getErrorMessage(error.code));
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{ fontSize: 20, fontWeight: "bold" }}>Login</Text>
      <TextInput
        style={styles.TextInput}
        placeholder="Email"
        onChangeText={setEmail}
        autoCapitalize="none"
        value={email}
      />
      <TextInput
        style={styles.TextInput}
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
        value={password}
      />
      <Button title="Login" onPress={handleLogin} />
      <TouchableOpacity onPress={handleForgetPassword} disabled={isSendingReset}>
        <Text style={styles.forgetPasswordText}>
          {isSendingReset ? <ActivityIndicator size="small" color="blue" /> : "Forget password?"}
        </Text>
      </TouchableOpacity>
      {error ? <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text> : null}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 10 }} />
      ) : (
        <Text style={{ marginVertical: 10 }} onPress={gotoRegister}>
          Create an account? Register here
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  TextInput: {
    width: 200,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginVertical: 10,
    paddingHorizontal: 8,
  },
  forgetPasswordText: {
    color: 'blue',
    marginVertical: 10,
  },
});
