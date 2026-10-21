import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const CHUNK = 1800;

function webStore() {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}

async function removeNative(key: string) {
  const countRaw = await SecureStore.getItemAsync(`${key}.n`);
  if (countRaw) {
    const count = Number(countRaw);
    for (let index = 0; index < count; index += 1) {
      await SecureStore.deleteItemAsync(`${key}.${index}`);
    }
    await SecureStore.deleteItemAsync(`${key}.n`);
  }
  await SecureStore.deleteItemAsync(key);
}

/** Keychain / Keystore on device. Session storage on web, cleared when the tab closes. */
export function createSecureStorage() {
  return {
    async getItem(key: string) {
      if (Platform.OS === "web") return webStore()?.getItem(key) ?? null;
      const countRaw = await SecureStore.getItemAsync(`${key}.n`);
      if (!countRaw) return SecureStore.getItemAsync(key);
      const count = Number(countRaw);
      let value = "";
      for (let index = 0; index < count; index += 1) {
        value += (await SecureStore.getItemAsync(`${key}.${index}`)) ?? "";
      }
      return value || null;
    },
    async setItem(key: string, value: string) {
      if (Platform.OS === "web") {
        webStore()?.setItem(key, value);
        return;
      }
      await removeNative(key);
      if (value.length <= CHUNK) {
        await SecureStore.setItemAsync(key, value);
        return;
      }
      const count = Math.ceil(value.length / CHUNK);
      for (let index = 0; index < count; index += 1) {
        await SecureStore.setItemAsync(`${key}.${index}`, value.slice(index * CHUNK, (index + 1) * CHUNK));
      }
      await SecureStore.setItemAsync(`${key}.n`, String(count));
    },
    async removeItem(key: string) {
      if (Platform.OS === "web") {
        webStore()?.removeItem(key);
        return;
      }
      await removeNative(key);
    },
  };
}
