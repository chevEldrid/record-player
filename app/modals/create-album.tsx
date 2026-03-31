import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { DriveImage } from '@/components/DriveImage';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { colors, spacing } from '@/constants/theme';
import { useAppData } from '@/contexts/AppDataContext';

export default function CreateAlbumModal() {
  const router = useRouter();
  const { createAlbum } = useAppData();
  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState<string>();
  const [saving, setSaving] = useState(false);

  async function chooseImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0]?.uri);
    }
  }

  async function submit() {
    if (!name.trim()) {
      Alert.alert('Name required', 'Enter a name for this album.');
      return;
    }

    setSaving(true);
    try {
      await createAlbum({ name, imageUri });
      router.back();
    } catch (error) {
      Alert.alert(
        'Could not create album',
        error instanceof Error ? error.message : 'Album creation failed.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScreenShell scroll>
      <Text style={styles.title}>Create a new album</Text>
      <Text style={styles.subtitle}>
        Each album represents one person and holds every track recorded for them.
      </Text>

      <View style={styles.preview}>
        <DriveImage label={name || 'A'} size={120} uri={imageUri} />
      </View>

      <LabeledField
        label="Person name"
        onChangeText={setName}
        placeholder="For example: Grandma Rosa"
        value={name}
      />

      <PrimaryButton label="Choose Picture" onPress={chooseImage} variant="secondary" />
      <PrimaryButton label="Create Album" loading={saving} onPress={submit} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  preview: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
});
