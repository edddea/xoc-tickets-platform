'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string, direccion: string) => void;
}

export default function VenueMapPicker({ lat, lng, onChange }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);
  const [query, setQuery] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import('leaflet').then((L) => {
      // Fix íconos por defecto de Leaflet con Next.js
      // @ts-expect-error propiedad interna de Leaflet
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const initLat = lat ? Number(lat) : 19.4326;
      const initLng = lng ? Number(lng) : -99.1332;

      const map = L.map(mapRef.current!).setView([initLat, initLng], lat ? 15 : 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
      }).addTo(map);

      if (lat && lng) {
        markerRef.current = L.marker([initLat, initLng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          onChange(pos.lat.toFixed(6), pos.lng.toFixed(6), '');
        });
      }

      map.on('click', (e) => {
        const { lat: clat, lng: clng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([clat, clng]);
        } else {
          markerRef.current = L.marker([clat, clng], { draggable: true }).addTo(map);
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLatLng();
            onChange(pos.lat.toFixed(6), pos.lng.toFixed(6), '');
          });
        }
        onChange(clat.toFixed(6), clng.toFixed(6), '');
      });

      mapInstance.current = map;
    });

    return () => {
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, []);

  async function buscar() {
    if (!query.trim()) return;
    setBuscando(true);
    setError('');
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
        { headers: { 'Accept-Language': 'es' } }
      );
      const data = await res.json();
      if (!data.length) { setError('No se encontró el lugar. Intenta con otra búsqueda.'); return; }
      const { lat: rlat, lon: rlng, display_name } = data[0];
      const numLat = Number(rlat);
      const numLng = Number(rlng);

      import('leaflet').then((L) => {
        if (!mapInstance.current) return;
        mapInstance.current.setView([numLat, numLng], 16);
        if (markerRef.current) {
          markerRef.current.setLatLng([numLat, numLng]);
        } else {
          markerRef.current = L.marker([numLat, numLng], { draggable: true }).addTo(mapInstance.current);
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current!.getLatLng();
            onChange(pos.lat.toFixed(6), pos.lng.toFixed(6), '');
          });
        }
      });

      onChange(numLat.toFixed(6), numLng.toFixed(6), display_name);
    } catch {
      setError('Error al buscar. Revisa tu conexión.');
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="space-y-2">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="flex gap-2">
        <input
          className="w-full rounded border border-neutral-300 px-3 py-2 text-sm"
          placeholder="Busca el venue: nombre, dirección, ciudad…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), buscar())}
        />
        <button type="button" onClick={buscar} disabled={buscando}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 whitespace-nowrap">
          {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div ref={mapRef} className="h-64 w-full rounded-lg border border-neutral-200 z-0" />
      {lat && lng && (
        <p className="text-xs text-neutral-400">
          Pin en {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)} — también puedes arrastrarlo o hacer clic en el mapa.
        </p>
      )}
    </div>
  );
}
