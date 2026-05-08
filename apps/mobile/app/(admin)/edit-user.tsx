import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert } from 'react-native';
import { EditUserScreen } from '@/screens/admin/EditUserScreen';
import { adminListUsers, type AdminUser } from '@/services/adminApi';
import { lightColors } from '@/theme/tokens';
import { ROUTES } from '@/navigation/constants';
import { safeBack } from '@/navigation/safeBack';

export default function EditUserPage() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [user, setUser] = useState<AdminUser | null>(null);
  const colors = lightColors;

  useEffect(() => {
    adminListUsers()
      .then((users) => {
        const found = users.find((u) => u.id === userId);
        if (!found) {
          Alert.alert('שגיאה', 'המשתמש לא נמצא');
          router.replace(ROUTES.ADMIN_HOME);
          return;
        }
        setUser(found);
      })
      .catch(() => {
        Alert.alert('שגיאה', 'לא ניתן לטעון פרטי משתמש');
        router.replace(ROUTES.ADMIN_HOME);
      });
  }, [userId]);

  if (!user) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <EditUserScreen
      user={user}
      onDone={() => router.replace(ROUTES.ADMIN_HOME)}
      onBack={() => safeBack(router, ROUTES.ADMIN_HOME)}
    />
  );
}
