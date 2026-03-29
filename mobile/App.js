import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { useAuthStore } from './src/stores/authStore';

export default function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <RootNavigator />
    </>
  );
}
