import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../lib/AuthContext";
import { api } from "../lib/api";

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("phone"); // "phone" | "code"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const requestCode = async () => {
    setError(null);
    if (!phone.trim()) {
      setError("Enter your phone number.");
      return;
    }
    setBusy(true);
    try {
      await api.requestCode(phone.trim());
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    setError(null);
    if (!code.trim()) {
      setError("Enter the code we texted you.");
      return;
    }
    setBusy(true);
    try {
      const { token, phone: verifiedPhone } = await api.verifyCode(phone.trim(), code.trim());
      await login(verifiedPhone, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Txt2Cart</Text>
      <Text style={styles.subtitle}>
        {step === "phone"
          ? "Enter the phone number you order with."
          : `Enter the code we texted to ${phone}.`}
      </Text>

      {step === "phone" ? (
        <TextInput
          style={styles.input}
          placeholder="+1 555 555 5555"
          keyboardType="phone-pad"
          autoFocus
          value={phone}
          onChangeText={setPhone}
        />
      ) : (
        <TextInput
          style={styles.input}
          placeholder="123456"
          keyboardType="number-pad"
          autoFocus
          maxLength={6}
          value={code}
          onChangeText={setCode}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        disabled={busy}
        onPress={step === "phone" ? requestCode : verifyCode}
      >
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {step === "phone" ? "Send code" : "Verify"}
          </Text>
        )}
      </Pressable>

      {step === "code" && (
        <Pressable onPress={() => setStep("phone")} disabled={busy}>
          <Text style={styles.link}>Use a different number</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
    color: "#1E2761",
  },
  subtitle: {
    fontSize: 15,
    color: "#555",
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 14,
    fontSize: 17,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#1E2761",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  error: {
    color: "#B00020",
    marginBottom: 8,
  },
  link: {
    color: "#1E2761",
    textAlign: "center",
    marginTop: 16,
  },
});
