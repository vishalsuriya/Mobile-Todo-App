import { View, Text, TextInput, StyleSheet, Button, ActivityIndicator } from 'react-native';
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";
import { auth } from "../Services/Firebase";

export default function RegisterScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const isValidPassword = (password) => {
        return password.length >= 6 &&
            /[0-9]/.test(password) &&
            /[!@#$%^&*]/.test(password);
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleRegister = async () => {
        if (!name || !email || !password) {
            setError("All fields are required!");
            return;
        }
        if (!isValidEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }
        if (!isValidPassword(password)) {
            setError("Password must be at least 6 characters long, include a number, and a special character.");
            return;
        }
        try {
            setLoading(true);
            setError('');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await updateProfile(user, {
                displayName: name
            });
            await sendEmailVerification(user);
        
        alert('Verification email sent! Please check your inbox and verify your email to proceed.');
        auth.signOut();
        navigation.navigate('Login');
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const gotoLogin = () => {
        navigation.navigate('Login');
    }

    return (
        <View style={styles.container}>
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>Register</Text>
            <TextInput
                style={styles.TextInput}
                placeholder='Name'
                onChangeText={setName}
            />
            <TextInput
                style={styles.TextInput}
                placeholder='Email'
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.TextInput}
                placeholder='Password'
                secureTextEntry
                onChangeText={setPassword}
            />
            <Button title='Register' onPress={handleRegister} />
            {error ? <Text style={{ color: 'red', marginTop: 10, marginRight: 10, marginLeft: 10 }}>{error}</Text> : null}
            {loading ? (
                <ActivityIndicator size='large' color='#0000ff' style={{ marginTop: 10 }} />
            ) : (
                <Text style={{ marginVertical: 10 }} onPress={gotoLogin}>
                    Already have an Account? Login here
                </Text>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    TextInput: {
        width: 200,
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginVertical: 10,
        paddingHorizontal: 8
    }
});
