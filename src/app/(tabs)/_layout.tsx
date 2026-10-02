import { Tabs } from "expo-router";

import { BottomNav } from "@/components/ui/BottomNav";

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={() => <BottomNav />}
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="tasks" options={{ title: "Tasks" }} />
      <Tabs.Screen name="calendar" options={{ title: "Calendar" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
