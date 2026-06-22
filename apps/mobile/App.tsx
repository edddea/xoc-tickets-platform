import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { getEventos } from './src/api';
import ScannerScreen from './src/ScannerScreen';
import type { Evento } from '@xoc/shared';

export default function App() {
  const [tab, setTab] = useState<'feed' | 'scanner'>('feed');
  const [eventos, setEventos] = useState<Evento[]>([]);

  useEffect(() => { getEventos().then(setEventos).catch(() => {}); }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>🎟️ Xoc Tickets</Text>

      {tab === 'feed' ? (
        <FlatList
          data={eventos}
          keyExtractor={(e) => e._id}
          ListEmptyComponent={<Text style={styles.muted}>Sin eventos publicados.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.titulo}</Text>
              <Text style={styles.muted}>{item.venue}</Text>
              <Text style={styles.muted}>{new Date(item.fecha).toLocaleDateString('es-MX')} · {item.hora}</Text>
            </View>
          )}
        />
      ) : (
        <ScannerScreen />
      )}

      <View style={styles.tabbar}>
        <TouchableOpacity onPress={() => setTab('feed')} style={styles.tab}>
          <Text style={tab === 'feed' ? styles.tabActive : styles.muted}>Eventos</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('scanner')} style={styles.tab}>
          <Text style={tab === 'scanner' ? styles.tabActive : styles.muted}>Validar (scanner)</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 16, backgroundColor: '#fafafa' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#e5e5e5' },
  cardTitle: { fontWeight: '600', fontSize: 16 },
  muted: { color: '#737373' },
  tabbar: { flexDirection: 'row', borderTopWidth: 1, borderColor: '#e5e5e5', paddingVertical: 10 },
  tab: { flex: 1, alignItems: 'center' },
  tabActive: { color: '#059669', fontWeight: '700' },
});
