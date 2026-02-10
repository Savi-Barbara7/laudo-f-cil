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

function saveLaudos(laudos: Laudo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(laudos));
}

export function useLaudoStore() {
  const [laudos, setLaudos] = useState<Laudo[]>(loadLaudos);

  useEffect(() => {
    saveLaudos(laudos);
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
    setLaudos(prev => [novo, ...prev]);
    return id;
  }, []);

  const atualizarLaudo = useCallback((id: string, updates: Partial<Laudo>) => {
    setLaudos(prev =>
      prev.map(l =>
        l.id === id ? { ...l, ...updates, atualizadoEm: new Date().toISOString() } : l
      )
    );
  }, []);

  const removerLaudo = useCallback((id: string) => {
    setLaudos(prev => prev.filter(l => l.id !== id));
  }, []);

  const getLaudo = useCallback((id: string): Laudo | undefined => {
    return laudos.find(l => l.id === id);
  }, [laudos]);

  return { laudos, criarLaudo, atualizarLaudo, removerLaudo, getLaudo };
}
