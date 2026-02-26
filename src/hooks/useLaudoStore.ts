import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Laudo } from '@/types/laudo';
import { TEXTOS_PADRAO, DADOS_CAPA_PADRAO } from '@/data/defaultTexts';

export function useLaudoStore() {
  const { user } = useAuth();
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLaudos = useCallback(async () => {
    if (!user) { setLaudos([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await (supabase
      .from('laudos') as any)
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (!error && data) {
      setLaudos(data.map(rowToLaudo));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchLaudos(); }, [fetchLaudos]);

  const criarLaudo = useCallback(async (titulo: string = 'Novo Laudo', obraNome?: string): Promise<string> => {
    if (!user) return '';
    
    let obraId: string | null = null;
    if (obraNome) {
      const { data: existing } = await (supabase
        .from('obras') as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('nome', obraNome)
        .maybeSingle();

      if (existing) {
        obraId = existing.id;
      } else {
        const { data: newObra } = await (supabase
          .from('obras') as any)
          .insert({ user_id: user.id, nome: obraNome })
          .select('id')
          .single();
        if (newObra) obraId = newObra.id;
      }
    }

    const { data, error } = await (supabase
      .from('laudos') as any)
      .insert({
        user_id: user.id,
        obra_id: obraId,
        titulo,
        status: 'rascunho',
        dados_capa: DADOS_CAPA_PADRAO,
        textos: TEXTOS_PADRAO,
        lindeiros: [],
        croqui_images: [],
        art_images: [],
        documentacoes: [],
        fichas: [],
        conclusao: '',
        croqui_rich_text: '',
        art_rich_text: '',
        documentacoes_rich_text: '',
        fichas_rich_text: '',
      })
      .select()
      .single();

    if (error || !data) return '';
    const novo = rowToLaudo(data);
    setLaudos(prev => [novo, ...prev]);
    return data.id;
  }, [user]);

  const duplicarLaudo = useCallback(async (id: string): Promise<string> => {
    if (!user) return '';
    const original = laudos.find(l => l.id === id);
    if (!original) return '';

    const { data, error } = await (supabase
      .from('laudos') as any)
      .insert({
        user_id: user.id,
        obra_id: (original as any).obraId || null,
        titulo: `${original.titulo} (cópia)`,
        status: 'rascunho',
        dados_capa: original.dadosCapa,
        textos: original.textos,
        lindeiros: original.lindeiros,
        croqui_images: original.croquiImages,
        art_images: original.artImages,
        documentacoes: original.documentacoes,
        fichas: original.fichas || [],
        conclusao: original.conclusao,
        croqui_rich_text: original.croquiRichText || '',
        art_rich_text: original.artRichText || '',
        documentacoes_rich_text: original.documentacoesRichText || '',
        fichas_rich_text: original.fichasRichText || '',
      })
      .select()
      .single();

    if (error || !data) return '';
    const novo = rowToLaudo(data);
    setLaudos(prev => [novo, ...prev]);
    return data.id;
  }, [user, laudos]);

  const atualizarLaudo = useCallback(async (id: string, updates: Partial<Laudo>) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.titulo !== undefined) dbUpdates.titulo = updates.titulo;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.dadosCapa !== undefined) dbUpdates.dados_capa = updates.dadosCapa;
    if (updates.textos !== undefined) dbUpdates.textos = updates.textos;
    if (updates.lindeiros !== undefined) dbUpdates.lindeiros = updates.lindeiros;
    if (updates.croquiImages !== undefined) dbUpdates.croqui_images = updates.croquiImages;
    if (updates.croquiRichText !== undefined) dbUpdates.croqui_rich_text = updates.croquiRichText;
    if (updates.artImages !== undefined) dbUpdates.art_images = updates.artImages;
    if (updates.artRichText !== undefined) dbUpdates.art_rich_text = updates.artRichText;
    if (updates.documentacoes !== undefined) dbUpdates.documentacoes = updates.documentacoes;
    if (updates.documentacoesRichText !== undefined) dbUpdates.documentacoes_rich_text = updates.documentacoesRichText;
    if (updates.fichas !== undefined) dbUpdates.fichas = updates.fichas;
    if (updates.fichasRichText !== undefined) dbUpdates.fichas_rich_text = updates.fichasRichText;
    if (updates.conclusao !== undefined) dbUpdates.conclusao = updates.conclusao;

    if (Object.keys(dbUpdates).length === 0) return;

    await (supabase.from('laudos') as any).update(dbUpdates).eq('id', id);

    setLaudos(prev => prev.map(l =>
      l.id === id ? { ...l, ...updates, atualizadoEm: new Date().toISOString() } : l
    ));
  }, []);

  const removerLaudo = useCallback(async (id: string) => {
    await (supabase.from('laudos') as any).delete().eq('id', id);
    setLaudos(prev => prev.filter(l => l.id !== id));
  }, []);

  const getLaudo = useCallback((id: string): Laudo | undefined => {
    return laudos.find(l => l.id === id);
  }, [laudos]);

  return { laudos, loading, criarLaudo, duplicarLaudo, atualizarLaudo, removerLaudo, getLaudo };
}

function rowToLaudo(row: any): Laudo {
  return {
    id: row.id,
    titulo: row.titulo,
    status: row.status,
    dadosCapa: row.dados_capa || DADOS_CAPA_PADRAO,
    textos: row.textos || {},
    lindeiros: row.lindeiros || [],
    croquiImages: row.croqui_images || [],
    artImages: row.art_images || [],
    documentacoes: row.documentacoes || [],
    fichas: row.fichas || [],
    conclusao: row.conclusao || '',
    obra: '',
    criadoEm: row.created_at,
    atualizadoEm: row.updated_at,
    croquiRichText: row.croqui_rich_text || '',
    artRichText: row.art_rich_text || '',
    documentacoesRichText: row.documentacoes_rich_text || '',
    fichasRichText: row.fichas_rich_text || '',
    obraId: row.obra_id,
  };
}
