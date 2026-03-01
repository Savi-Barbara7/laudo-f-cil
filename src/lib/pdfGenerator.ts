import jsPDF from 'jspdf';
import type { Laudo } from '@/types/laudo';
import { SECOES_NAVEGAVEIS } from '@/data/defaultTexts';

async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

const A4_W = 210;
const A4_H = 297;
const MARGIN_LEFT = 20;
const MARGIN_RIGHT = 20;
const MARGIN_TOP = 33;
const MARGIN_BOTTOM = 22;
const CONTENT_W = A4_W - MARGIN_LEFT - MARGIN_RIGHT;
const PRIMARY: [number, number, number] = [30, 58, 95];
const GRAY: [number, number, number] = [110, 110, 110];
const BLACK: [number, number, number] = [20, 20, 20];
const LIGHT_GRAY: [number, number, number] = [230, 230, 230];

function addHeaderFooter(doc: jsPDF, pageNum: number, totalPages: number, titulo?: string) {
  // ── Header ──────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY);
  doc.text('COMPETENCE', MARGIN_LEFT, 13);

  // Service list on the right (small, stacked)
  const services = ['Consultoria e Perícias', 'Avaliações de Imóveis', 'Ensaios Não Destrutivos', 'Inspeções e Laudos Técnicos'];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...GRAY);
  services.forEach((s, i) => doc.text(s, A4_W - MARGIN_RIGHT, 10 + i * 3.2, { align: 'right' }));

  // Header rule
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, 26, A4_W - MARGIN_RIGHT, 26);

  // ── Footer ──────────────────────────────────────────────────────
  doc.line(MARGIN_LEFT, A4_H - 14, A4_W - MARGIN_RIGHT, A4_H - 14);

  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  const today = new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${today}`, MARGIN_LEFT, A4_H - 9);
  if (titulo) {
    doc.text(titulo, A4_W / 2, A4_H - 9, { align: 'center', maxWidth: 90 });
  }
  doc.text(`Página ${pageNum} de ${totalPages}`, A4_W - MARGIN_RIGHT, A4_H - 9, { align: 'right' });
}

function stripHtml(text: string): string {
  return text
    .replace(/<b>/gi, '').replace(/<\/b>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
}

interface RichNode {
  type: 'text' | 'heading' | 'paragraph' | 'list-item' | 'image' | 'table' | 'hr';
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  level?: number;
  align?: string;
  listType?: 'ul' | 'ol';
  listIndex?: number;
  src?: string;
  rows?: string[][];
}

function parseRichHtml(html: string): RichNode[] {
  if (!html || html === '<p></p>') return [];
  const nodes: RichNode[] = [];
  const div = document.createElement('div');
  div.innerHTML = html;

  function walkChildren(el: Element, listType?: 'ul' | 'ol', listCounter?: { i: number }) {
    for (const child of Array.from(el.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const t = child.textContent?.trim();
        if (t) nodes.push({ type: 'text', text: t });
        continue;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      const tag = (child as Element).tagName.toLowerCase();
      const elem = child as HTMLElement;

      if (tag === 'h1' || tag === 'h2') {
        nodes.push({ type: 'heading', text: elem.textContent || '', level: tag === 'h1' ? 1 : 2, align: elem.style.textAlign || 'left' });
      } else if (tag === 'p') {
        if (elem.querySelector('img')) {
          for (const c of Array.from(elem.childNodes)) {
            if (c.nodeType === Node.ELEMENT_NODE && (c as Element).tagName === 'IMG') {
              nodes.push({ type: 'image', src: (c as HTMLImageElement).src });
            } else if (c.textContent?.trim()) {
              nodes.push({ type: 'paragraph', text: c.textContent?.trim() || '', align: elem.style.textAlign || '' });
            }
          }
        } else {
          nodes.push({ type: 'paragraph', text: elem.textContent || '', align: elem.style.textAlign || '', bold: !!elem.querySelector('strong, b'), italic: !!elem.querySelector('em, i'), underline: !!elem.querySelector('u') });
        }
      } else if (tag === 'ul' || tag === 'ol') {
        const counter = { i: 0 };
        walkChildren(elem, tag as 'ul' | 'ol', counter);
      } else if (tag === 'li') {
        if (listCounter) listCounter.i++;
        nodes.push({ type: 'list-item', text: elem.textContent || '', listType: listType || 'ul', listIndex: listCounter?.i || 1 });
      } else if (tag === 'img') {
        nodes.push({ type: 'image', src: (elem as HTMLImageElement).src });
      } else if (tag === 'table') {
        const rows: string[][] = [];
        elem.querySelectorAll('tr').forEach(tr => {
          const cells: string[] = [];
          tr.querySelectorAll('td, th').forEach(td => cells.push(td.textContent || ''));
          rows.push(cells);
        });
        nodes.push({ type: 'table', rows });
      } else if (tag === 'hr') {
        nodes.push({ type: 'hr' });
      } else {
        walkChildren(elem, listType, listCounter);
      }
    }
  }

  walkChildren(div);
  return nodes;
}

function writeRichContent(
  doc: jsPDF,
  html: string,
  startY: number,
  pageCounter: { current: number; total: number },
  getImage: (src: string) => string,
  titulo?: string
): number {
  const nodes = parseRichHtml(html);
  let y = startY;

  const ensureSpace = (needed: number) => {
    if (y + needed > A4_H - MARGIN_BOTTOM - 10) {
      doc.addPage();
      pageCounter.current++;
      addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
      y = MARGIN_TOP;
    }
  };

  for (const node of nodes) {
    switch (node.type) {
      case 'heading': {
        ensureSpace(12);
        const size = node.level === 1 ? 13 : 11;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(size);
        doc.setTextColor(...PRIMARY);
        const align = node.align === 'center' ? 'center' : node.align === 'right' ? 'right' : 'left';
        const xPos = align === 'center' ? A4_W / 2 : align === 'right' ? A4_W - MARGIN_RIGHT : MARGIN_LEFT;
        doc.text(node.text || '', xPos, y, { align: align as 'center' | 'right' | 'left' });
        y += size === 13 ? 7 : 6;
        break;
      }
      case 'paragraph': {
        if (!node.text?.trim()) { y += 3; break; }
        ensureSpace(6);
        doc.setFont('helvetica', node.bold ? 'bold' : node.italic ? 'italic' : 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...BLACK);
        const lines = doc.splitTextToSize(node.text || '', CONTENT_W);
        for (const line of lines) {
          ensureSpace(5);
          const align = node.align === 'center' ? 'center' : node.align === 'right' ? 'right' : 'left';
          const xPos = align === 'center' ? A4_W / 2 : align === 'right' ? A4_W - MARGIN_RIGHT : MARGIN_LEFT;
          doc.text(line, xPos, y, { align: align as 'center' | 'right' | 'left' });
          y += 5;
        }
        y += 1;
        break;
      }
      case 'list-item': {
        ensureSpace(6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...BLACK);
        const prefix = node.listType === 'ol' ? `${node.listIndex}. ` : '• ';
        const itemLines = doc.splitTextToSize(`${prefix}${node.text || ''}`, CONTENT_W - 8);
        for (const il of itemLines) {
          ensureSpace(5);
          doc.text(il, MARGIN_LEFT + 4, y);
          y += 5;
        }
        break;
      }
      case 'image': {
        if (node.src) {
          ensureSpace(80);
          try {
            const imgData = getImage(node.src);
            doc.addImage(imgData, 'JPEG', MARGIN_LEFT, y, CONTENT_W, 70);
            y += 75;
          } catch {}
        }
        break;
      }
      case 'table': {
        if (node.rows && node.rows.length > 0) {
          const cols = node.rows[0].length || 1;
          const colW = CONTENT_W / cols;
          for (let ri = 0; ri < node.rows.length; ri++) {
            ensureSpace(8);
            const row = node.rows[ri];
            const isHeader = ri === 0;
            if (isHeader) {
              doc.setFillColor(...PRIMARY);
              doc.rect(MARGIN_LEFT, y - 4, CONTENT_W, 7, 'F');
              doc.setFont('helvetica', 'bold');
              doc.setTextColor(255, 255, 255);
            } else {
              if (ri % 2 === 0) {
                doc.setFillColor(248, 250, 252);
                doc.rect(MARGIN_LEFT, y - 4, CONTENT_W, 7, 'F');
              }
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(...BLACK);
            }
            doc.setFontSize(8);
            for (let ci = 0; ci < row.length; ci++) {
              doc.text(row[ci] || '', MARGIN_LEFT + ci * colW + 2, y);
            }
            doc.setDrawColor(...LIGHT_GRAY);
            doc.setLineWidth(0.2);
            for (let ci = 0; ci <= cols; ci++) {
              doc.line(MARGIN_LEFT + ci * colW, y - 4, MARGIN_LEFT + ci * colW, y + 3);
            }
            doc.line(MARGIN_LEFT, y - 4, MARGIN_LEFT + CONTENT_W, y - 4);
            doc.line(MARGIN_LEFT, y + 3, MARGIN_LEFT + CONTENT_W, y + 3);
            y += 7;
          }
          y += 3;
        }
        break;
      }
      case 'hr': {
        doc.addPage();
        pageCounter.current++;
        addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
        y = MARGIN_TOP;
        break;
      }
      case 'text': {
        if (!node.text?.trim()) break;
        ensureSpace(5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...BLACK);
        const tLines = doc.splitTextToSize(node.text, CONTENT_W);
        for (const tl of tLines) {
          ensureSpace(5);
          doc.text(tl, MARGIN_LEFT, y);
          y += 5;
        }
        break;
      }
    }
  }

  return y;
}

function writeSectionContent(
  doc: jsPDF,
  content: string,
  startY: number,
  pageCounter: { current: number; total: number },
  titulo?: string
): number {
  let y = startY;
  const plainText = stripHtml(content);
  const lines = plainText.split('\n');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);

  for (const line of lines) {
    if (line.trim() === '') {
      y += 4;
      continue;
    }
    const wrappedLines = doc.splitTextToSize(line.trim(), CONTENT_W);
    for (const wl of wrappedLines) {
      if (y > A4_H - MARGIN_BOTTOM - 10) {
        doc.addPage();
        pageCounter.current++;
        addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
        y = MARGIN_TOP;
      }
      doc.text(wl, MARGIN_LEFT, y);
      y += 5;
    }
  }

  return y;
}

function drawSectionTitle(doc: jsPDF, title: string, y: number) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PRIMARY);
  doc.text(title.toUpperCase(), MARGIN_LEFT, y);
  // underline
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, y + 1.5, MARGIN_LEFT + doc.getTextWidth(title.toUpperCase()), y + 1.5);
  doc.setLineWidth(0.3);
  doc.setDrawColor(...LIGHT_GRAY);
}

function addTitlePage(doc: jsPDF, title: string, pageCounter: { current: number; total: number }, titulo?: string) {
  doc.addPage();
  pageCounter.current++;
  addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
  // Full-page section title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PRIMARY);
  doc.text(title.toUpperCase(), A4_W / 2, A4_H / 2, { align: 'center' });
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, A4_H / 2 + 4, A4_W - MARGIN_RIGHT, A4_H / 2 + 4);
}

export async function gerarPDF(laudo: Laudo) {
  // Pre-fetch all images
  const imageCache = new Map<string, string>();
  const urls: string[] = [];
  if (laudo.dadosCapa.fotoCapaUrl?.startsWith('http')) urls.push(laudo.dadosCapa.fotoCapaUrl);
  for (const lind of laudo.lindeiros) {
    for (const amb of lind.ambientes) {
      for (const foto of amb.fotos) {
        if (foto.dataUrl?.startsWith('http')) urls.push(foto.dataUrl);
      }
    }
  }
  for (const ci of (laudo.croquiImages || [])) {
    if (ci.url?.startsWith('http')) urls.push(ci.url);
  }
  for (const ai of (laudo.artImages || [])) {
    if (ai?.startsWith('http')) urls.push(ai);
  }
  for (const doc of (laudo.documentacoes || [])) {
    for (const img of doc.imagens) { if (img?.startsWith('http')) urls.push(img); }
  }
  for (const fic of (laudo.fichas || [])) {
    for (const img of fic.imagens) { if (img?.startsWith('http')) urls.push(img); }
  }

  await Promise.all(urls.map(async (url) => {
    const b64 = await fetchImageAsBase64(url);
    if (b64) imageCache.set(url, b64);
  }));

  const getImage = (src: string): string => imageCache.get(src) || src;
  const doc = new jsPDF('p', 'mm', 'a4');

  // Rough estimate for total pages
  let estimatedTotal = 2;
  estimatedTotal += 6; // text sections
  for (const lind of laudo.lindeiros) {
    estimatedTotal += 1;
    for (const amb of lind.ambientes) estimatedTotal += Math.ceil(amb.fotos.length / 4) + 1;
  }
  estimatedTotal += (laudo.croquiImages?.length || 0) + 2;
  estimatedTotal += (laudo.artImages?.length || 0) + 2;
  estimatedTotal += 4;

  const pageCounter = { current: 1, total: estimatedTotal };
  const titulo = laudo.titulo;

  // ═══════════════════════════════════════════════
  //  CAPA
  // ═══════════════════════════════════════════════
  // Logo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...PRIMARY);
  doc.text('COMPETENCE', A4_W / 2, 28, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    'Consultoria e Perícias · Avaliações de Imóveis · Ensaios Não Destrutivos · Inspeções e Laudos Técnicos',
    A4_W / 2, 35, { align: 'center' }
  );

  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.8);
  doc.line(MARGIN_LEFT, 39, A4_W - MARGIN_RIGHT, 39);

  // Cover image
  if (laudo.dadosCapa.fotoCapaUrl) {
    try {
      doc.addImage(getImage(laudo.dadosCapa.fotoCapaUrl), 'JPEG', MARGIN_LEFT, 44, CONTENT_W, 105);
    } catch {
      doc.setFillColor(240, 245, 250);
      doc.setDrawColor(...LIGHT_GRAY);
      doc.rect(MARGIN_LEFT, 44, CONTENT_W, 105, 'FD');
      doc.setFontSize(9); doc.setTextColor(...GRAY);
      doc.text('Foto do Empreendimento', A4_W / 2, 96, { align: 'center' });
    }
  } else {
    doc.setFillColor(240, 245, 250);
    doc.setDrawColor(...LIGHT_GRAY);
    doc.rect(MARGIN_LEFT, 44, CONTENT_W, 105, 'FD');
    doc.setFontSize(9); doc.setTextColor(...GRAY);
    doc.text('Foto do Empreendimento', A4_W / 2, 96, { align: 'center' });
  }

  // Document title block
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...PRIMARY);
  doc.text('LAUDO TÉCNICO CAUTELAR DE', A4_W / 2, 162, { align: 'center' });
  doc.text('VISTORIA DE LINDEIROS', A4_W / 2, 171, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  doc.text(`Volume ${laudo.dadosCapa.volumeAtual} de ${laudo.dadosCapa.totalVolumes}`, A4_W / 2, 179, { align: 'center' });

  // Info fields with separator lines
  let fY = 191;
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  const fields: [string, string][] = [
    ['Empreendimento:', laudo.dadosCapa.empreendimento || '—'],
    ['Local da Obra:', laudo.dadosCapa.localObra || '—'],
    ['Solicitante:', laudo.dadosCapa.solicitante || '—'],
    ['CNPJ:', laudo.dadosCapa.cnpj || '—'],
  ];
  for (const [label, value] of fields) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...PRIMARY);
    doc.text(label, MARGIN_LEFT, fY);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(value, MARGIN_LEFT + 37, fY);
    doc.line(MARGIN_LEFT, fY + 2, A4_W - MARGIN_RIGHT, fY + 2);
    fY += 8;
  }

  // Footer legal
  doc.setDrawColor(...LIGHT_GRAY);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, A4_H - 18, A4_W - MARGIN_RIGHT, A4_H - 18);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(
    'Este laudo é de uso exclusivo do solicitante, não podendo ser reproduzido parcial ou totalmente sem autorização.',
    A4_W / 2, A4_H - 12, { align: 'center', maxWidth: CONTENT_W }
  );

  // ═══════════════════════════════════════════════
  //  ÍNDICE (placeholder — rebuilt at end)
  // ═══════════════════════════════════════════════
  doc.addPage();
  pageCounter.current++;
  const indexPageNum = pageCounter.current;
  addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);

  // ═══════════════════════════════════════════════
  //  SEÇÕES DE TEXTO
  // ═══════════════════════════════════════════════
  const secoesTexto = ['introducao', 'objeto', 'objetivo', 'finalidade', 'responsabilidades', 'classificacao'] as const;
  const sectionLabels: Record<string, string> = {};
  SECOES_NAVEGAVEIS.forEach(s => { sectionLabels[s.id] = s.label; });

  const textSectionStartPages: Record<string, number> = {};

  for (const secId of secoesTexto) {
    doc.addPage();
    pageCounter.current++;
    textSectionStartPages[secId] = pageCounter.current;
    addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);

    const sTitle = sectionLabels[secId] || secId;
    drawSectionTitle(doc, sTitle, MARGIN_TOP);
    let sy = MARGIN_TOP + 9;

    const content = laudo.textos[secId] || '';
    const isRich = content.includes('<') && content.includes('>');
    if (isRich) {
      writeRichContent(doc, content, sy, pageCounter, getImage, titulo);
    } else {
      writeSectionContent(doc, content, sy, pageCounter, titulo);
    }
  }

  // ═══════════════════════════════════════════════
  //  LINDEIROS
  // ═══════════════════════════════════════════════
  const lindeirosStartPage = laudo.lindeiros.length > 0 ? pageCounter.current + 1 : 0;
  const ambientePages = new Map<string, { start: number; end: number }>();

  if (laudo.lindeiros.length > 0) {
    doc.addPage();
    pageCounter.current++;
    addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);

    drawSectionTitle(doc, 'VII. DESCRIÇÃO E VISTORIA DOS LINDEIROS', MARGIN_TOP);
    let ly = MARGIN_TOP + 12;

    for (let li = 0; li < laudo.lindeiros.length; li++) {
      const lind = laudo.lindeiros[li];

      if (ly > A4_H - 80) {
        doc.addPage();
        pageCounter.current++;
        addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
        ly = MARGIN_TOP;
      }

      // Lindeiro header bar
      doc.setFillColor(240, 245, 252);
      doc.setDrawColor(...LIGHT_GRAY);
      doc.setLineWidth(0.3);
      doc.rect(MARGIN_LEFT, ly - 4, CONTENT_W, 9, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...PRIMARY);
      doc.text(`LINDEIRO ${li + 1}: ${lind.tipoImovel.toUpperCase()} – ${lind.tipoUso.toUpperCase()}`, MARGIN_LEFT + 3, ly + 1);
      ly += 10;

      // Tabela de dados do lindeiro
      const infoRows: [string, string][] = [
        ['Endereço', lind.endereco || '—'],
        ['Responsável', lind.responsavel || '—'],
        ['Telefone', lind.telefone || '—'],
        ['Data da Vistoria', lind.dataVistoria || '—'],
        ['Estado de Conservação', lind.estadoConservacao || '—'],
      ];

      doc.setFontSize(8.5);
      for (const [k, v] of infoRows) {
        if (ly > A4_H - MARGIN_BOTTOM - 10) {
          doc.addPage(); pageCounter.current++;
          addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
          ly = MARGIN_TOP;
        }
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...PRIMARY);
        doc.text(`${k}:`, MARGIN_LEFT + 1, ly);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BLACK);
        const tw = doc.getTextWidth(`${k}:`);
        doc.text(v, MARGIN_LEFT + 1 + tw + 2, ly, { maxWidth: CONTENT_W - tw - 4 });
        ly += 5;
      }
      ly += 3;

      // Description
      if (lind.descricao) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...BLACK);
        const descLines = doc.splitTextToSize(lind.descricao, CONTENT_W);
        for (const dl of descLines) {
          if (ly > A4_H - MARGIN_BOTTOM - 10) {
            doc.addPage(); pageCounter.current++;
            addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
            ly = MARGIN_TOP;
          }
          doc.text(dl, MARGIN_LEFT, ly); ly += 4.5;
        }
        ly += 4;
      }

      // Ambientes + fotos
      for (let ai = 0; ai < lind.ambientes.length; ai++) {
        const amb = lind.ambientes[ai];
        const ambKey = `L${li + 1}-${ai}`;
        const GAP = 4;
        const photoW = (CONTENT_W - GAP) / 2;
        const captionH = 6;
        const photoH = 55;
        const cellH = photoH + captionH + GAP;
        const TITLE_H = 9;
        const minNeeded = TITLE_H + (amb.fotos.length > 0 ? cellH : 10);

        if (ly + minNeeded > A4_H - MARGIN_BOTTOM - 5) {
          doc.addPage(); pageCounter.current++;
          addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
          ly = MARGIN_TOP;
        }

        const drawAmbTitle = (atY: number) => {
          doc.setFillColor(245, 248, 252);
          doc.setDrawColor(...LIGHT_GRAY);
          doc.rect(MARGIN_LEFT, atY - 4, CONTENT_W, 7, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.setTextColor(...BLACK);
          doc.text(`▸ ${amb.nome || 'Ambiente'}`, MARGIN_LEFT + 3, atY);
        };

        drawAmbTitle(ly);
        const startPage = pageCounter.current;
        ly += TITLE_H;

        // Photo grid 2 columns
        if (amb.fotos.length > 0) {
          let fi = 0;
          while (fi < amb.fotos.length) {
            if (ly + cellH > A4_H - MARGIN_BOTTOM - 5) {
              doc.addPage(); pageCounter.current++;
              addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
              ly = MARGIN_TOP;
              drawAmbTitle(ly); ly += TITLE_H;
            }
            for (let col = 0; col < 2 && fi < amb.fotos.length; col++, fi++) {
              const px = MARGIN_LEFT + col * (photoW + GAP);
              const py = ly;
              const foto = amb.fotos[fi];

              // Photo border
              doc.setDrawColor(...LIGHT_GRAY);
              doc.setLineWidth(0.3);
              doc.rect(px, py, photoW, photoH);

              if (foto.dataUrl && foto.dataUrl.length > 10) {
                try {
                  doc.addImage(getImage(foto.dataUrl), 'JPEG', px, py, photoW, photoH);
                } catch {
                  doc.setFillColor(242, 244, 247);
                  doc.rect(px, py, photoW, photoH, 'F');
                }
              } else {
                doc.setFillColor(242, 244, 247);
                doc.rect(px, py, photoW, photoH, 'F');
              }

              // Caption with index
              const globalFotoIdx = amb.fotos.slice(0, fi).length;
              const legend = foto.legenda || `L${li + 1} - ${amb.nome || 'Amb.'} - Fig:${String(fi + 1).padStart(4, '0')}`;
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(7);
              doc.setTextColor(...GRAY);
              doc.text(legend, px + photoW / 2, py + photoH + 4.5, { align: 'center', maxWidth: photoW });
            }
            ly += cellH;
          }
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8.5);
          doc.setTextColor(...GRAY);
          doc.text('(Sem fotos registradas)', MARGIN_LEFT + 3, ly); ly += 6;
        }

        ambientePages.set(ambKey, { start: startPage, end: pageCounter.current });
        ly += 5;
      }

      ly += 10;
    }
  }

  const lindeirosEndPage = laudo.lindeiros.length > 0 ? pageCounter.current : 0;

  // ═══════════════════════════════════════════════
  //  CROQUI
  // ═══════════════════════════════════════════════
  const croquiImages = laudo.croquiImages || [];
  let croquiStartPage = 0;
  let croquiEndPage = 0;

  if (croquiImages.length > 0 || laudo.croquiRichText?.trim()) {
    addTitlePage(doc, 'VIII. Croqui de Localização', pageCounter, titulo);
    croquiStartPage = pageCounter.current;

    for (const ci of croquiImages) {
      doc.addPage(); pageCounter.current++;
      addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
      if (ci.url) {
        try {
          const imgData = getImage(ci.url);
          doc.addImage(imgData, 'JPEG', MARGIN_LEFT, MARGIN_TOP, CONTENT_W, 185);
        } catch {}
      }
      if (ci.legenda) {
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...GRAY);
        doc.text(ci.legenda, A4_W / 2, MARGIN_TOP + 190, { align: 'center', maxWidth: CONTENT_W });
      }
    }

    if (laudo.croquiRichText?.trim()) {
      doc.addPage(); pageCounter.current++;
      addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
      drawSectionTitle(doc, 'Croqui de Localização', MARGIN_TOP);
      writeRichContent(doc, laudo.croquiRichText, MARGIN_TOP + 10, pageCounter, getImage, titulo);
    }
    croquiEndPage = pageCounter.current;
  }

  // ═══════════════════════════════════════════════
  //  ART
  // ═══════════════════════════════════════════════
  const artImgs = laudo.artImages || [];
  let artStartPage = 0;
  let artEndPage = 0;

  if (artImgs.length > 0 || laudo.artRichText?.trim()) {
    addTitlePage(doc, 'IX. ART – Anotação de Responsabilidade Técnica', pageCounter, titulo);
    artStartPage = pageCounter.current;

    for (const ai of artImgs) {
      doc.addPage(); pageCounter.current++;
      addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
      try {
        doc.addImage(getImage(ai), 'JPEG', MARGIN_LEFT, MARGIN_TOP, CONTENT_W, 200);
      } catch {}
    }

    if (laudo.artRichText?.trim()) {
      doc.addPage(); pageCounter.current++;
      addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
      drawSectionTitle(doc, 'ART – Anotação de Responsabilidade Técnica', MARGIN_TOP);
      writeRichContent(doc, laudo.artRichText, MARGIN_TOP + 10, pageCounter, getImage, titulo);
    }
    artEndPage = pageCounter.current;
  }

  // ═══════════════════════════════════════════════
  //  DOCUMENTAÇÕES
  // ═══════════════════════════════════════════════
  const documentacoes = laudo.documentacoes || [];
  let docsStartPage = 0;
  let docsEndPage = 0;

  if (documentacoes.length > 0 || laudo.documentacoesRichText?.trim()) {
    addTitlePage(doc, 'X. Documentações', pageCounter, titulo);
    docsStartPage = pageCounter.current;

    for (const docItem of documentacoes) {
      for (const imgUrl of docItem.imagens) {
        doc.addPage(); pageCounter.current++;
        addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...PRIMARY);
        doc.text(docItem.nome || 'Documentação', MARGIN_LEFT, MARGIN_TOP - 3);
        try { doc.addImage(getImage(imgUrl), 'JPEG', MARGIN_LEFT, MARGIN_TOP + 2, CONTENT_W, 200); } catch {}
      }
    }

    if (laudo.documentacoesRichText?.trim()) {
      doc.addPage(); pageCounter.current++;
      addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
      drawSectionTitle(doc, 'Documentações', MARGIN_TOP);
      writeRichContent(doc, laudo.documentacoesRichText, MARGIN_TOP + 10, pageCounter, getImage, titulo);
    }
    docsEndPage = pageCounter.current;
  }

  // ═══════════════════════════════════════════════
  //  FICHAS
  // ═══════════════════════════════════════════════
  const fichas = laudo.fichas || [];
  let fichasStartPage = 0;
  let fichasEndPage = 0;

  if (fichas.length > 0 || laudo.fichasRichText?.trim()) {
    addTitlePage(doc, 'XI. Fichas de Vistoria', pageCounter, titulo);
    fichasStartPage = pageCounter.current;

    for (const fichaItem of fichas) {
      for (const imgUrl of fichaItem.imagens) {
        doc.addPage(); pageCounter.current++;
        addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...PRIMARY);
        doc.text(fichaItem.nome || 'Ficha de Vistoria', MARGIN_LEFT, MARGIN_TOP - 3);
        try { doc.addImage(getImage(imgUrl), 'JPEG', MARGIN_LEFT, MARGIN_TOP + 2, CONTENT_W, 200); } catch {}
      }
    }

    if (laudo.fichasRichText?.trim()) {
      doc.addPage(); pageCounter.current++;
      addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
      drawSectionTitle(doc, 'Fichas de Vistoria', MARGIN_TOP);
      writeRichContent(doc, laudo.fichasRichText, MARGIN_TOP + 10, pageCounter, getImage, titulo);
    }
    fichasEndPage = pageCounter.current;
  }

  // ═══════════════════════════════════════════════
  //  CONCLUSÃO
  // ═══════════════════════════════════════════════
  const conclusaoText = laudo.conclusao || '';
  let conclusaoStartPage = 0;
  let conclusaoEndPage = 0;

  if (conclusaoText.trim()) {
    doc.addPage(); pageCounter.current++;
    conclusaoStartPage = pageCounter.current;
    addHeaderFooter(doc, pageCounter.current, pageCounter.total, titulo);
    drawSectionTitle(doc, 'XII. Conclusão', MARGIN_TOP);
    let cy = MARGIN_TOP + 10;
    const isRich = conclusaoText.includes('<') && conclusaoText.includes('>');
    if (isRich) {
      writeRichContent(doc, conclusaoText, cy, pageCounter, getImage, titulo);
    } else {
      writeSectionContent(doc, conclusaoText, cy, pageCounter, titulo);
    }
    conclusaoEndPage = pageCounter.current;
  }

  // ═══════════════════════════════════════════════
  //  ATUALIZA TOTAL DE PÁGINAS E REBUILD ÍNDICE
  // ═══════════════════════════════════════════════
  const actualTotal = pageCounter.current;
  // Rerender all page numbers now that we know the total
  for (let p = 3; p <= actualTotal; p++) {
    doc.setPage(p);
    // Just update footer (overwrite old page counter with white rect)
    doc.setFillColor(255, 255, 255);
    doc.rect(A4_W / 2 - 20, A4_H - 13, 40, 5, 'F');
    doc.setFontSize(7); doc.setTextColor(...GRAY);
    doc.text(`Página ${p} de ${actualTotal}`, A4_W - MARGIN_RIGHT, A4_H - 9, { align: 'right' });
  }

  // ── Rebuild Index Page ───────────────────────────────────────
  doc.setPage(indexPageNum);
  doc.setFillColor(255, 255, 255);
  doc.rect(0, MARGIN_TOP - 5, A4_W, A4_H - MARGIN_TOP - MARGIN_BOTTOM + 5, 'F');

  // Update header/footer with correct total
  doc.setFillColor(255, 255, 255);
  doc.rect(A4_W / 2 - 20, A4_H - 13, 40, 5, 'F');
  doc.setFontSize(7); doc.setTextColor(...GRAY);
  doc.text(`Página 2 de ${actualTotal}`, A4_W - MARGIN_RIGHT, A4_H - 9, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY);
  doc.text('ÍNDICE', A4_W / 2, MARGIN_TOP + 4, { align: 'center' });

  // underline
  doc.setDrawColor(...PRIMARY);
  doc.setLineWidth(0.5);
  const idxTW = doc.getTextWidth('ÍNDICE');
  doc.line(A4_W / 2 - idxTW / 2, MARGIN_TOP + 6, A4_W / 2 + idxTW / 2, MARGIN_TOP + 6);

  let indexY = MARGIN_TOP + 18;

  const drawIndexLine = (label: string, pageStr: string, y: number, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...BLACK);
    doc.text(label, MARGIN_LEFT, y);
    const lw = doc.getTextWidth(label);
    const pw = doc.getTextWidth(pageStr);
    const ds = MARGIN_LEFT + lw + 2;
    const de = A4_W - MARGIN_RIGHT - pw - 2;
    doc.setTextColor(...GRAY);
    let dx = ds;
    while (dx < de) { doc.text('.', dx, y); dx += 1.5; }
    doc.setTextColor(...BLACK);
    doc.text(pageStr, A4_W - MARGIN_RIGHT, y, { align: 'right' });
  };

  // Text sections
  const textSections = SECOES_NAVEGAVEIS.filter(s => secoesTexto.includes(s.id as any));
  for (const s of textSections) {
    const pg = textSectionStartPages[s.id];
    if (pg) { drawIndexLine(s.label, String(pg), indexY); indexY += 7; }
  }

  // Lindeiros section
  if (lindeirosStartPage > 0) {
    indexY += 2;
    const lindPS = lindeirosStartPage === lindeirosEndPage ? String(lindeirosStartPage) : `${lindeirosStartPage} a ${lindeirosEndPage}`;
    drawIndexLine(sectionLabels['lindeiros'] || 'VII. Vistoria dos Lindeiros', lindPS, indexY, true);
    indexY += 6;

    doc.setFontSize(8.5);
    for (let li = 0; li < laudo.lindeiros.length; li++) {
      const lind = laudo.lindeiros[li];
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PRIMARY);
      doc.text(`  Lindeiro ${li + 1}: ${lind.endereco || 'Sem endereço'}`, MARGIN_LEFT + 4, indexY);
      indexY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...BLACK);
      for (let ai = 0; ai < lind.ambientes.length; ai++) {
        const amb = lind.ambientes[ai];
        const pages = ambientePages.get(`L${li + 1}-${ai}`);
        const pageStr = pages ? (pages.start === pages.end ? String(pages.start) : `${pages.start}–${pages.end}`) : '';
        if (indexY > A4_H - MARGIN_BOTTOM - 10) break;

        const fullLabel = `     ${amb.nome || 'Ambiente'}`;
        doc.setFontSize(8);
        doc.text(fullLabel, MARGIN_LEFT + 8, indexY);
        if (pageStr) {
          const lw = doc.getTextWidth(fullLabel);
          const pw = doc.getTextWidth(pageStr);
          const ds = MARGIN_LEFT + 8 + lw + 1;
          const de = A4_W - MARGIN_RIGHT - pw - 1;
          doc.setTextColor(...GRAY);
          let dx = ds; while (dx < de) { doc.text('.', dx, indexY); dx += 1.5; }
          doc.setTextColor(...BLACK);
          doc.text(pageStr, A4_W - MARGIN_RIGHT, indexY, { align: 'right' });
        }
        indexY += 4;
      }
      indexY += 2;
    }
  }

  indexY += 3;
  doc.setFontSize(9.5);
  if (croquiStartPage > 0) {
    const ps = croquiStartPage === croquiEndPage ? String(croquiStartPage) : `${croquiStartPage} a ${croquiEndPage}`;
    drawIndexLine('VIII. Croqui de Localização', ps, indexY); indexY += 7;
  }
  if (artStartPage > 0) {
    const ps = artStartPage === artEndPage ? String(artStartPage) : `${artStartPage} a ${artEndPage}`;
    drawIndexLine('IX. ART', ps, indexY); indexY += 7;
  }
  if (docsStartPage > 0) {
    const ps = docsStartPage === docsEndPage ? String(docsStartPage) : `${docsStartPage} a ${docsEndPage}`;
    drawIndexLine('X. Documentações', ps, indexY); indexY += 7;
  }
  if (fichasStartPage > 0) {
    const ps = fichasStartPage === fichasEndPage ? String(fichasStartPage) : `${fichasStartPage} a ${fichasEndPage}`;
    drawIndexLine('XI. Fichas de Vistoria', ps, indexY); indexY += 7;
  }
  if (conclusaoStartPage > 0) {
    const ps = conclusaoStartPage === conclusaoEndPage ? String(conclusaoStartPage) : `${conclusaoStartPage} a ${conclusaoEndPage}`;
    drawIndexLine('XII. Conclusão', ps, indexY); indexY += 7;
  }

  // Save
  const nomeArquivo = laudo.titulo
    ? `${laudo.titulo.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/ +/g, '_')}.pdf`
    : 'laudo_lindeiros.pdf';
  doc.save(nomeArquivo);
}
