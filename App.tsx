import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AllDialysisSessions from "./screens/AllDialysisSessions";
import TrendScreen from "./screens/TrendScreen";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { View, StyleSheet } from "react-native";

import { SessionsContextProvider } from "./store/session-context";
import BuildBadge from "./components/BuildBadge";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SessionsContextProvider>
      <StatusBar style="dark" />
      <View style={styles.root}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: "#4a90d9" },
              headerTintColor: "white",
              headerTitleStyle: { fontSize: 20, fontWeight: "600" },
            }}
          >
            <Stack.Screen
              name="Dialysis Sessions"
              component={AllDialysisSessions}
              options={{ title: "Дневник диализа" }}
            />
            <Stack.Screen
              name="Trend"
              component={TrendScreen}
              options={{ title: "Динамика" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <BuildBadge />
      </View>
    </SessionsContextProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
