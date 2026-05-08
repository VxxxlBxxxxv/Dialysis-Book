import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AllDialysisSessions from "./screens/AllDialysisSessions";
import ManageSession from "./screens/ManageSession";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";

import { SessionsContextProvider } from "./store/session-context";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <>
      <SessionsContextProvider>
        <StatusBar style="dark" />
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
              name="Manage Session"
              component={ManageSession}
              options={{ presentation: "modal" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SessionsContextProvider>
    </>
  );
}
