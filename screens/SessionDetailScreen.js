// Session detail: shows the caller's own order (participant view) and, for organizers,
// the full group digest (task #816 -- organizer dashboard). Submitting order text pipes
// through the same handleInboundMessage() pipeline every other channel uses (see
// POST /sessions/:code/order in appApi.js), so accuracy/clarification behavior matches
// SMS/Slack/Teams exactly -- the replies returned are rendered as a simple chat log.
import { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { api } from "../lib/api";

function ModifierLine({ item }) {
  const mods = item.displayModifiers;
  return (
    <View style={styles.itemRow}>
      <Text style={styles.itemName}>
        {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ""}
        {item.name || item.text}
      </Text>
      {Array.isArray(mods) && mods.length > 0 ? (
        <Text style={styles.itemMods}>{mods.join(", ")}</Text>
      ) : null}
    </View>
  );
}

export default function SessionDetailScreen({ route }) {
  const { code } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [orderText, setOrderText] = useState("");
  const [sending, setSending] = useState(false);
  const [replies, setReplies] = useState([]);

  const load = useCallback(
    async (isRefresh) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        const session = await api.getSession(code);
        setData(session);
      } catch (err) {
        setError(err.message);
      } finally {
        isRefresh ? setRefreshing(false) : setLoading(false);
      }
    },
    [code]
  );

  useFocusEffect(
    useCallback(() => {
      load(false);
    }, [load])
  );

  const send = async () => {
    if (!orderText.trim()) return;
    setSending(true);
    setError(null);
    try {
      const { replies: newReplies } = await api.submitOrder(code, orderText.trim());
      setReplies((prev) => [...prev, { from: "me", text: orderText.trim() }, ...newReplies.map((t) => ({ from: "carter", text: t }))]);
      setOrderText("");
      await load(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1E2761" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error || "Couldn't load this order."}</Text>
      </View>
    );
  }

  const isOrganizer = data.role === "organizer";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <View style={styles.header}>
        <Text style={styles.vendor}>{data.vendorLabel}</Text>
        <Text style={styles.meta}>
          Code {data.code} · {data.status === "closed" ? "Closed" : "Open"}
          {data.forDate ? ` · ${data.forDate}` : ""}
        </Text>
      </View>

      {/* Organizer dashboard (task #816): every participant's order */}
      {isOrganizer && data.summary ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group order ({data.summary.participants?.length ?? 0})</Text>
          {(data.summary.participants || []).map((p, idx) => (
            <View key={idx} style={styles.participantCard}>
              <Text style={styles.participantName}>{p.name || p.identifier || "Someone"}</Text>
              {(p.confirmedItems || p.items || []).map((item, i) => (
                <ModifierLine key={i} item={item} />
              ))}
            </View>
          ))}
          {data.summary.total ? (
            <Text style={styles.total}>Total: {data.summary.total}</Text>
          ) : null}
        </View>
      ) : null}

      {/* My order */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My order</Text>
        {data.myOrder?.confirmedItems?.length ? (
          data.myOrder.confirmedItems.map((item, i) => <ModifierLine key={i} item={item} />)
        ) : data.myOrder?.pendingItems?.length ? (
          data.myOrder.pendingItems.map((item, i) => <ModifierLine key={i} item={item} />)
        ) : (
          <Text style={styles.empty}>No order yet -- type what you want below.</Text>
        )}
      </View>

      {replies.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conversation</Text>
          {replies.map((r, i) => (
            <View key={i} style={[styles.bubble, r.from === "me" ? styles.bubbleMe : styles.bubbleCarter]}>
              <Text style={r.from === "me" ? styles.bubbleTextMe : styles.bubbleTextCarter}>{r.text}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {data.status !== "closed" ? (
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="What do you want to order?"
            value={orderText}
            onChangeText={setOrderText}
            multiline
          />
          <Pressable
            style={[styles.sendButton, sending && styles.buttonDisabled]}
            disabled={sending}
            onPress={send}
          >
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Send</Text>}
          </Pressable>
        </View>
      ) : (
        <Text style={styles.closedNote}>This order is closed.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  header: { padding: 20, paddingTop: 60 },
  vendor: { fontSize: 24, fontWeight: "700", color: "#1E2761" },
  meta: { fontSize: 13, color: "#888", marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#333", marginBottom: 8 },
  participantCard: {
    backgroundColor: "#F5F6FA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  participantName: { fontWeight: "600", fontSize: 14, color: "#222", marginBottom: 4 },
  itemRow: { marginBottom: 4 },
  itemName: { fontSize: 14, color: "#222" },
  itemMods: { fontSize: 12, color: "#777", marginTop: 1 },
  total: { fontWeight: "700", marginTop: 8, fontSize: 15, color: "#1E2761" },
  empty: { color: "#999", fontStyle: "italic" },
  bubble: { borderRadius: 12, padding: 10, marginBottom: 6, maxWidth: "85%" },
  bubbleMe: { backgroundColor: "#1E2761", alignSelf: "flex-end" },
  bubbleCarter: { backgroundColor: "#F0F0F0", alignSelf: "flex-start" },
  bubbleTextMe: { color: "#fff" },
  bubbleTextCarter: { color: "#222" },
  error: { color: "#B00020", paddingHorizontal: 20, marginTop: 12 },
  composer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
    alignItems: "flex-end",
  },
  composerInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    minHeight: 44,
    maxHeight: 120,
  },
  sendButton: {
    backgroundColor: "#1E2761",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  sendButtonText: { color: "#fff", fontWeight: "600" },
  closedNote: { textAlign: "center", color: "#999", padding: 24 },
});
