import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { Timestamp } from 'firebase/firestore';
import { theme } from '../utils/theme';
import { useAuthContext } from '../hooks/useAuth';
import { ADMIN_EMAILS } from '../config/admin';
import { Arena, createArena, deleteArena, listenArenas, updateArena } from '../services/firestore';

const emptyForm = {
  name: '',
  latitude: '',
  longitude: '',
  radius: '',
  startTime: '',
  endTime: '',
  isActive: true,
};

const toDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const AdminScreen: React.FC = () => {
  const { user } = useAuthContext();
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [form, setForm] = useState({ ...emptyForm });

  const isAdmin = useMemo(() => {
    const email = user?.email || '';
    return ADMIN_EMAILS.includes(email);
  }, [user?.email]);

  useEffect(() => {
    const unsub = listenArenas(setArenas);
    return unsub;
  }, []);

  if (Platform.OS !== 'web') return null;

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 24 }}>
        <Text style={{ color: theme.colors.text, fontSize: 22, fontWeight: '800' }}>Admin</Text>
        <Text style={{ color: theme.colors.muted, marginTop: 8 }}>Not authorized.</Text>
      </View>
    );
  }

  const handleCreate = async () => {
    const start = toDate(form.startTime);
    const end = toDate(form.endTime);
    if (!start || !end) return Alert.alert('Invalid time', 'Use an ISO date string.');
    try {
      await createArena({
        name: form.name.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        radius: Number(form.radius),
        startTime: Timestamp.fromDate(start),
        endTime: Timestamp.fromDate(end),
        isActive: form.isActive,
      });
      setForm({ ...emptyForm });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleUpdate = async (arenaId: string, draft: Partial<Arena>) => {
    try {
      await updateArena(arenaId, draft as any);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDelete = async (arenaId: string) => {
    try {
      await deleteArena(arenaId);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }} contentContainerStyle={{ padding: 24 }}>
      <Text style={{ color: theme.colors.text, fontSize: 24, fontWeight: '800' }}>Admin</Text>
      <Text style={{ color: theme.colors.muted, marginTop: 6 }}>Manage arenas</Text>

      <View style={{ marginTop: 20, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card }}>
        <Text style={{ color: theme.colors.text, fontWeight: '800' }}>Create Arena</Text>
        {(['name', 'latitude', 'longitude', 'radius', 'startTime', 'endTime'] as const).map(field => (
          <TextInput
            key={field}
            value={form[field] as string}
            onChangeText={value => setForm(prev => ({ ...prev, [field]: value }))}
            placeholder={field}
            placeholderTextColor={theme.colors.subtle}
            style={{ marginTop: 10, backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.inputBorder }}
          />
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <Text style={{ color: theme.colors.text, marginRight: 10 }}>Active</Text>
          <Switch value={form.isActive} onValueChange={value => setForm(prev => ({ ...prev, isActive: value }))} />
        </View>
        <TouchableOpacity onPress={handleCreate} style={{ marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: theme.colors.cardAlt, borderWidth: 1, borderColor: theme.colors.border }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700', textAlign: 'center' }}>Create</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 24 }}>
        {arenas.map(arena => {
          const start = arena.startTime?.toDate?.() || new Date(arena.startTime as any);
          const end = arena.endTime?.toDate?.() || new Date(arena.endTime as any);
          return (
            <View key={arena.id} style={{ marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.card }}>
              <Text style={{ color: theme.colors.text, fontWeight: '800' }}>{arena.name}</Text>
              <Text style={{ color: theme.colors.muted, marginTop: 4 }}>{arena.id}</Text>

              <TextInput
                defaultValue={arena.name}
                onEndEditing={e => handleUpdate(arena.id, { name: e.nativeEvent.text })}
                placeholder="name"
                placeholderTextColor={theme.colors.subtle}
                style={{ marginTop: 10, backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.inputBorder }}
              />
              <TextInput
                defaultValue={String(arena.latitude)}
                onEndEditing={e => handleUpdate(arena.id, { latitude: Number(e.nativeEvent.text) })}
                placeholder="latitude"
                placeholderTextColor={theme.colors.subtle}
                style={{ marginTop: 10, backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.inputBorder }}
              />
              <TextInput
                defaultValue={String(arena.longitude)}
                onEndEditing={e => handleUpdate(arena.id, { longitude: Number(e.nativeEvent.text) })}
                placeholder="longitude"
                placeholderTextColor={theme.colors.subtle}
                style={{ marginTop: 10, backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.inputBorder }}
              />
              <TextInput
                defaultValue={String(arena.radius)}
                onEndEditing={e => handleUpdate(arena.id, { radius: Number(e.nativeEvent.text) })}
                placeholder="radius"
                placeholderTextColor={theme.colors.subtle}
                style={{ marginTop: 10, backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.inputBorder }}
              />
              <TextInput
                defaultValue={start.toISOString()}
                onEndEditing={e => {
                  const parsed = toDate(e.nativeEvent.text);
                  if (!parsed) return;
                  handleUpdate(arena.id, { startTime: Timestamp.fromDate(parsed) } as any);
                }}
                placeholder="startTime"
                placeholderTextColor={theme.colors.subtle}
                style={{ marginTop: 10, backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.inputBorder }}
              />
              <TextInput
                defaultValue={end.toISOString()}
                onEndEditing={e => {
                  const parsed = toDate(e.nativeEvent.text);
                  if (!parsed) return;
                  handleUpdate(arena.id, { endTime: Timestamp.fromDate(parsed) } as any);
                }}
                placeholder="endTime"
                placeholderTextColor={theme.colors.subtle}
                style={{ marginTop: 10, backgroundColor: theme.colors.inputBg, color: theme.colors.text, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.inputBorder }}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <Text style={{ color: theme.colors.text, marginRight: 10 }}>Active</Text>
                <Switch value={arena.isActive} onValueChange={value => handleUpdate(arena.id, { isActive: value })} />
              </View>

              <TouchableOpacity onPress={() => handleDelete(arena.id)} style={{ marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: theme.colors.accent, borderWidth: 1, borderColor: theme.colors.border }}>
                <Text style={{ color: theme.colors.card, fontWeight: '700', textAlign: 'center' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
};

export default AdminScreen;
