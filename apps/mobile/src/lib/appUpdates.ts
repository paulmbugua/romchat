import { Alert } from 'react-native';
import * as Updates from 'expo-updates';

export async function checkForAppUpdate() {
  if (__DEV__) return;

  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();

      Alert.alert(
        'Update available',
        'A new version is ready. Restart the app now to update.',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Update now', onPress: () => void Updates.reloadAsync() },
        ],
      );
    }
  } catch (error) {
    console.warn('[romchat-updates] check failed', error instanceof Error ? error.message : String(error));
  }
}
