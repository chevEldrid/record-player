import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { DriveImage } from '@/components/DriveImage';
import { LabeledField } from '@/components/LabeledField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { useAppData } from '@/contexts/AppDataContext';

export default function NewAlbumScreen() {
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
      const created = await createAlbum({ name, imageUri });
      router.replace({
        pathname: '/albums/[albumId]',
        params: { albumId: created.id },
      });
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
    <ScreenShell bottomNav scroll>
      <View className="items-center gap-4 px-4 pt-5">
        <View className="rounded-appLg border border-appBorder bg-appCard p-4">
          <DriveImage label={name || 'A'} size={104} uri={imageUri} />
        </View>
        <Text className="text-center text-[26px] font-extrabold text-appText">
          Create a new album
        </Text>
      </View>

      <View className="gap-5 px-4">
        <Text className="text-[15px] leading-[22px] text-appMuted">
          Each album represents one person and holds every track recorded for them.
        </Text>

        <LabeledField
          label="Person name"
          onChangeText={setName}
          placeholder="For example: Grandma Rosa"
          value={name}
        />

        <View className="gap-2">
          <PrimaryButton label="Choose Picture" onPress={chooseImage} variant="secondary" />
          <PrimaryButton label="Create Album" loading={saving} onPress={submit} />
        </View>
      </View>
    </ScreenShell>
  );
}
