import { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { scanTicket } from './api';

// Scanner del validador en puerta: lee el QR (qrToken) y marca status = scanned.
export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [resultado, setResultado] = useState<string | null>(null);
  const [bloqueado, setBloqueado] = useState(false);

  if (!permission) return <Text>Solicitando cámara…</Text>;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 12 }}>Necesitamos acceso a la cámara para validar boletos.</Text>
        <Button title="Permitir cámara" onPress={requestPermission} />
      </View>
    );
  }

  async function onScan({ data }: { data: string }) {
    if (bloqueado) return;
    setBloqueado(true);
    const r = await scanTicket(data);
    if (r.ok) setResultado('✅ Acceso válido');
    else if (r.motivo === 'ya_escaneado') setResultado('⛔ Boleto ya usado');
    else if (r.motivo === 'no_aprobado') setResultado('⚠️ Boleto no aprobado');
    else setResultado('❌ Boleto inválido');
    setTimeout(() => { setResultado(null); setBloqueado(false); }, 2500);
  }

  return (
    <View style={styles.fill}>
      <CameraView
        style={styles.fill}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={bloqueado ? undefined : onScan}
      />
      {resultado && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>{resultado}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  banner: { position: 'absolute', bottom: 40, left: 20, right: 20, backgroundColor: '#000a', padding: 16, borderRadius: 12 },
  bannerText: { color: '#fff', fontSize: 18, textAlign: 'center', fontWeight: '700' },
});
