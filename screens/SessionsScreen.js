// Multi-session list (task #815). Shows every session the logged-in phone number
// is either the organizer of or a participant in, newest first (server already sorts).
import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../lib/AuthContext";
import { api } from "../lib/api";

function StatusPill({ status }) {
  const color = status === "closed" ? "#888" : "#1E8E5A";
  return (
    <View style={[styles.pill, { backgroundColor: color }]}>
      <Text style={styles.pillText}>{status === "closed" ? "Closed" : "Open"}</Text>
    </View>
  );
}

export default function SessionsScreen({ navigation }) {
  const { phone, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const { sessions: rows } = await api.listSessions();
      setSessions(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E2761" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My orders</Text>
        <Text style={styles.headerSubtitle}>{phone}</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.code}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />
        }
        contentContainerStyle={sessions.length === 0 && styles.emptyContainer}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No group orders yet. Start one below, or text a menu name to the Txt2Cart
            number to get going.
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() => navigation.navigate("SessionDetail", { code: item.code })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.vendor}>{item.vendorLabel}</Text>
              <Text style={styles.meta}>
                {item.role === "organizer" ? "You're organizing" : "You joined"}
                {item.forDate ? ` · ${item.forDate}` : ""}
              </Text>
            </View>
            <StatusPill status={item.status} />
          </Pressable>
        )}
      />

      <Pressable
        style={styles.newButton}
        onPress={() => navigation.navigate("NewSession")}
      >
        <Text style={styles.newButtonText}>+ Start a group order</Text>
      </Pressable>

      <Pressable onPress={logout} style={styles.logoutRow}>
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 26, fontWeight: "700", color: "#1E2761" },
  headerSubtitle: { fontSize: 13, color: "#888", marginTop: 2 },
  error: { color: "#B00020", paddingHorizontal: 20, marginBottom: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e5e5",
  },
  vendor: { fontSize: 17, fontWeight: "600", color: "#222" },
  meta: { fontSize: 13, color: "#777", marginTop: 3 },
  pill: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  emptyContainer: { flexGrow: 1, justifyContent: "center" },
  empty: {
    textAlign: "center",
    color: "#888",
    paddingHorizontal: 32,
    lineHeight: 20,
  },
  newButton: {
    backgroundColor: "#1E2761",
    margin: 20,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
  },
  newButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  logoutRow: { alignItems: "center", paddingBottom: 24 },
  logoutText: { color: "#999", fontSize: 13 },
});
