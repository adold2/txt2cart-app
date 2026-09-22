// Structured "create session" form -- calls POST /sessions directly (task #814's
// structured-create path in appApi.js), rather than driving the multi-turn SMS wizard,
// since a form can collect menuKey/date/cutoff/note in one submission.
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { api } from "../lib/api";

export default function NewSessionScreen({ navigation }) {
  const [menus, setMenus] = useState([]);
  const [menuKey, setMenuKey] = useState("");
  const [forDate, setForDate] = useState("");
  const [cutoff, setCutoff] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMenus, setLoadingMenus] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { menus: list } = await api.listMenus();
        setMenus(list);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingMenus(false);
      }
    })();
  }, []);

  const create = async () => {
    setError(null);
    if (!menuKey.trim()) {
      setError("Pick or type a vendor first.");
      return;
    }
    setBusy(true);
    try {
      const { session } = await api.createSession({
        menuKey: menuKey.trim(),
        forDate: forDate.trim() || undefined,
        cutoff: cutoff.trim() || undefined,
        note: note.trim() || undefined,
      });
      navigation.replace("SessionDetail", { code: session.code });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Start a group order</Text>

      <Text style={styles.label}>Vendor</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. chickfila, starbucks, dutchbros"
        value={menuKey}
        onChangeText={setMenuKey}
        autoCapitalize="none"
      />
      {loadingMenus ? (
        <ActivityIndicator style={{ marginVertical: 8 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {menus.map((m) => (
            <Pressable
              key={m.menuKey}
              style={[styles.chip, menuKey === m.menuKey && styles.chipSelected]}
              onPress={() => setMenuKey(m.menuKey)}
            >
              <Text
                style={[
                  styles.chipText,
                  menuKey === m.menuKey && styles.chipTextSelected,
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      <Text style={styles.label}>Order for (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="today, tomorrow, Friday..."
        value={forDate}
        onChangeText={setForDate}
      />

      <Text style={styles.label}>Cutoff time (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="in 30 min, 11:30am..."
        value={cutoff}
        onChangeText={setCutoff}
      />

      <Text style={styles.label}>Note for the group (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Pickup at the front desk"
        value={note}
        onChangeText={setNote}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable style={[styles.button, busy && styles.buttonDisabled]} disabled={busy} onPress={create}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create order</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 24, fontWeight: "700", color: "#1E2761", marginBottom: 20 },
  label: { fontSize: 13, fontWeight: "600", color: "#555", marginBottom: 6, marginTop: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  chipRow: { marginTop: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  chipSelected: { backgroundColor: "#1E2761", borderColor: "#1E2761" },
  chipText: { color: "#333", fontSize: 13 },
  chipTextSelected: { color: "#fff" },
  error: { color: "#B00020", marginTop: 16 },
  button: {
    backgroundColor: "#1E2761",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
