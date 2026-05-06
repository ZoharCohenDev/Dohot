// Minimal type stub for expo-secure-store.
// Replace with the real package types after running: npx expo install expo-secure-store
declare module 'expo-secure-store' {
  export function getItemAsync(key: string): Promise<string | null>;
  export function setItemAsync(key: string, value: string): Promise<void>;
  export function deleteItemAsync(key: string): Promise<void>;
}
