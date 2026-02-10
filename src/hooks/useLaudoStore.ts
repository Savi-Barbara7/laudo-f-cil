import { useState, useEffect, useCallback } from 'react';
import type { Laudo } from '@/types/laudo';
import { TEXTOS_PADRAO, DADOS_CAPA_PADRAO } from '@/data/defaultTexts';

const STORAGE_KEY = 'lvl-pro-laudos';

function generateId(): string {
  return crypto.randomUUID();
}

function loadLaudos(): Laudo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLaudosSync(laudos: Laudo[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(laudos));
  } catch (e) {
    console.warn('localStorage quota exceeded, stripping images and retrying...');
    // Strip large base64 images to fit in storage
    const stripped = laudos.map(l => ({
      ...l,
      dadosCapa: { ...l.dadosCapa, fotoCapaUrl: undefined },
      lindeiros: l.lindeiros.map(lin => ({
        ...lin,
        ambientes: lin.ambientes.map(amb => ({
          ...amb,
          fotos: amb.fotos.map(f => ({ ...f, dataUrl: '' })),
        })),
      })),
    }));
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    } catch {
      console.error('localStorage still full after stripping images');
    }
  }
}

export function useLaudoStore() {
  const [laudos, setLaudos] = useState<Laudo[]>(loadLaudos);

  useEffect(() => {
    saveLaudosSync(laudos);
  }, [laudos]);

  const criarLaudo = useCallback((titulo: string = 'Novo Laudo'): string => {
    const id = generateId();
    const now = new Date().toISOString();
    const novo: Laudo = {
      id,
      titulo,
      status: 'rascunho',
      dadosCapa: { ...DADOS_CAPA_PADRAO },
      textos: { ...TEXTOS_PADRAO },
      lindeiros: [],
      criadoEm: now,
      atualizadoEm: now,
    };
    const updated = [novo, ...loadLaudos()];
    saveLaudosSync(updated);
    setLaudos(updated);
    return id;
  }, []);

  const atualizarLaudo = useCallback((id: string, updates: Partial<Laudo>) => {
    setLaudos(prev => {
      const updated = prev.map(l =>
        l.id === id ? { ...l, ...updates, atualizadoEm: new Date().toISOString() } : l
      );
      saveLaudosSync(updated);
      return updated;
    });
  }, []);

  const removerLaudo = useCallback((id: string) => {
    setLaudos(prev => {
      const updated = prev.filter(l => l.id !== id);
      saveLaudosSync(updated);
      return updated;
    });
  }, []);

  const getLaudo = useCallback((id: string): Laudo | undefined => {
    return loadLaudos().find(l => l.id === id);
  }, []);

  return { laudos, criarLaudo, atualizarLaudo, removerLaudo, getLaudo };
}
