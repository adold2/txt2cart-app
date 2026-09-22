import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import LoginScreen from "./screens/LoginScreen";
import SessionsScreen from "./screens/SessionsScreen";
import SessionDetailScreen from "./screens/SessionDetailScreen";
import NewSessionScreen from "./screens/NewSessionScreen";

const Stack = createNativeStackNavigator();

function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#1E2761" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: "#1E2761" }}>
      {token ? (
        <>
          <Stack.Screen
            name="Sessions"
            component={SessionsScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SessionDetail"
            component={SessionDetailScreen}
            options={{ title: "Order" }}
          />
          <Stack.Screen
            name="NewSession"
            component={NewSessionScreen}
            options={{ title: "New order" }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </AuthProvider>
  );
}
