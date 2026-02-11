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
const MARGIN_TOP = 35;
const MARGIN_BOTTOM = 20;
const CONTENT_W = A4_W - MARGIN_LEFT - MARGIN_RIGHT;
const CONTENT_H = A4_H - MARGIN_TOP - MARGIN_BOTTOM;
const PRIMARY_COLOR: [number, number, number] = [30, 58, 95]; // Competence dark blue
const GRAY: [number, number, number] = [120, 120, 120];
const BLACK: [number, number, number] = [0, 0, 0];

function addHeaderFooter(doc: jsPDF, pageNum: number, totalPages: number) {
  const currentPage = doc.getCurrentPageInfo().pageNumber;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('COMPETENCE', MARGIN_LEFT, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  const servicos = [
    'Consultoria e Perícias',
    'Avaliações de Imóveis',
    'Ensaios Não Destrutivos',
    'Inspeções e Laudos Técnicos',
  ];
  servicos.forEach((s, i) => {
    doc.text(s, A4_W - MARGIN_RIGHT, 12 + i * 3.5, { align: 'right' });
  });

  // Header line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, 28, A4_W - MARGIN_RIGHT, 28);

  // Footer line
  doc.line(MARGIN_LEFT, A4_H - 15, A4_W - MARGIN_RIGHT, A4_H - 15);

  // Footer text
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  const today = new Date().toLocaleDateString('pt-BR');
  doc.text(`Data: ${today}`, MARGIN_LEFT, A4_H - 10);
  doc.text(`Página ${pageNum} de ${totalPages}`, A4_W / 2, A4_H - 10, { align: 'center' });
}

function stripHtmlTags(text: string): string {
  return text
    .replace(/<b>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
}

interface BoldSegment {
  text: string;
  bold: boolean;
}

function parseBoldSegments(text: string): BoldSegment[] {
  const segments: BoldSegment[] = [];
  const regex = /<b>(.*?)<\/b>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const cleaned = text.replace(/<br\s*\/?>/gi, '\n').replace(/<(?!\/?b\b)[^>]*>/gi, '');

  const boldRegex = /<b>(.*?)<\/b>/gi;
  let idx = 0;
  let m: RegExpExecArray | null;

  while ((m = boldRegex.exec(cleaned)) !== null) {
    if (m.index > idx) {
      segments.push({ text: cleaned.substring(idx, m.index), bold: false });
    }
    segments.push({ text: m[1], bold: true });
    idx = m.index + m[0].length;
  }
  if (idx < cleaned.length) {
    segments.push({ text: cleaned.substring(idx), bold: false });
  }

  return segments.length > 0 ? segments : [{ text: cleaned, bold: false }];
}

function writeTextBlock(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number = 10,
  lineHeight: number = 5
): number {
  const lines = text.split('\n');
  let currentY = y;

  for (const line of lines) {
    if (line.trim() === '') {
      currentY += lineHeight * 0.8;
      continue;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(...BLACK);

    const wrappedLines = doc.splitTextToSize(line.trim(), maxWidth);
    for (const wl of wrappedLines) {
      if (currentY > A4_H - MARGIN_BOTTOM - 10) {
        return currentY; // signal page overflow
      }
      doc.text(wl, x, currentY);
      currentY += lineHeight;
    }
  }

  return currentY;
}

function writeSectionWithPageBreaks(
  doc: jsPDF,
  title: string,
  content: string,
  startY: number,
  pageCounter: { current: number; total: number }
): number {
  let y = startY;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(title.toUpperCase(), MARGIN_LEFT, y);
  y += 8;

  // Content
  const plainText = stripHtmlTags(content);
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
        // New page
        doc.addPage();
        pageCounter.current++;
        addHeaderFooter(doc, pageCounter.current, pageCounter.total);
        y = MARGIN_TOP;
      }
      doc.text(wl, MARGIN_LEFT, y);
      y += 5;
    }
  }

  return y;
}

export async function gerarPDF(laudo: Laudo) {
  // Pre-fetch all images as base64 for jsPDF
  const imageCache = new Map<string, string>();
  const urls: string[] = [];
  if (laudo.dadosCapa.fotoCapaUrl && laudo.dadosCapa.fotoCapaUrl.startsWith('http')) {
    urls.push(laudo.dadosCapa.fotoCapaUrl);
  }
  for (const lind of laudo.lindeiros) {
    for (const amb of lind.ambientes) {
      for (const foto of amb.fotos) {
        if (foto.dataUrl && foto.dataUrl.startsWith('http')) {
          urls.push(foto.dataUrl);
        }
      }
    }
  }
  await Promise.all(urls.map(async (url) => {
    const b64 = await fetchImageAsBase64(url);
    if (b64) imageCache.set(url, b64);
  }));

  const getImage = (src: string): string => imageCache.get(src) || src;
  const doc = new jsPDF('p', 'mm', 'a4');

  // Calculate total pages (estimate)
  const secoesTexto = ['introducao', 'objeto', 'objetivo', 'finalidade', 'responsabilidades', 'classificacao'] as const;
  let estimatedPages = 2; // cover + index
  estimatedPages += secoesTexto.length; // ~1 page per section
  estimatedPages += laudo.lindeiros.length || 1; // lindeiro pages

  // Count photo pages
  for (const lind of laudo.lindeiros) {
    for (const amb of lind.ambientes) {
      estimatedPages += Math.ceil(amb.fotos.length / 6); // 6 photos per page
    }
  }

  const pageCounter = { current: 1, total: estimatedPages };

  // ==================== COVER PAGE ====================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('COMPETENCE', A4_W / 2, 30, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text(
    'Consultoria e Perícias · Avaliações de Imóveis · Ensaios Não Destrutivos · Inspeções e Laudos Técnicos',
    A4_W / 2,
    38,
    { align: 'center' }
  );

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(MARGIN_LEFT, 42, A4_W - MARGIN_RIGHT, 42);

  // Cover image
  if (laudo.dadosCapa.fotoCapaUrl) {
    try {
      doc.addImage(getImage(laudo.dadosCapa.fotoCapaUrl), 'JPEG', MARGIN_LEFT, 50, CONTENT_W, 100);
    } catch {
      doc.setDrawColor(180, 180, 180);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(MARGIN_LEFT, 50, CONTENT_W, 100, 2, 2, 'FD');
    }
  } else {
    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(MARGIN_LEFT, 50, CONTENT_W, 100, 2, 2, 'FD');
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text('Foto do Empreendimento', A4_W / 2, 100, { align: 'center' });
  }

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('LAUDO TÉCNICO CAUTELAR DE', A4_W / 2, 170, { align: 'center' });
  doc.text('VISTORIA DE LINDEIROS', A4_W / 2, 180, { align: 'center' });

  // Volume
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...GRAY);
  doc.text(`Volume ${laudo.dadosCapa.volumeAtual} de ${laudo.dadosCapa.totalVolumes}`, A4_W / 2, 192, {
    align: 'center',
  });

  // Info fields
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  let fieldY = 210;
  const fields = [
    ['Empreendimento:', laudo.dadosCapa.empreendimento || '_______________'],
    ['Local da Obra:', laudo.dadosCapa.localObra || '_______________'],
    ['Solicitante:', laudo.dadosCapa.solicitante || '_______________'],
    ['CNPJ:', laudo.dadosCapa.cnpj || '_______________'],
  ];
  for (const [label, value] of fields) {
    doc.setFont('helvetica', 'bold');
    doc.text(label, MARGIN_LEFT, fieldY);
    doc.setFont('helvetica', 'normal');
    doc.text(value, MARGIN_LEFT + 35, fieldY);
    fieldY += 7;
  }

  // Legal text
  doc.setDrawColor(200, 200, 200);
  doc.line(MARGIN_LEFT, A4_H - 25, A4_W - MARGIN_RIGHT, A4_H - 25);
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text(
    'Este laudo é de uso exclusivo do solicitante, não podendo ser reproduzido parcial ou totalmente sem autorização.',
    A4_W / 2,
    A4_H - 18,
    { align: 'center', maxWidth: CONTENT_W }
  );

  // ==================== INDEX PAGE ====================
  doc.addPage();
  pageCounter.current++;
  addHeaderFooter(doc, pageCounter.current, pageCounter.total);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('ÍNDICE', A4_W / 2, MARGIN_TOP + 5, { align: 'center' });

  let indexY = MARGIN_TOP + 18;
  const indexSections = SECOES_NAVEGAVEIS.filter((s) => s.id !== 'capa' && s.id !== 'indice');
  doc.setFontSize(10);
  for (let i = 0; i < indexSections.length; i++) {
    const sec = indexSections[i];
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(sec.label, MARGIN_LEFT, indexY);

    // Dotted line
    const labelWidth = doc.getTextWidth(sec.label);
    const pageNumStr = String(i + 3);
    const pageNumWidth = doc.getTextWidth(pageNumStr);
    const dotsStart = MARGIN_LEFT + labelWidth + 2;
    const dotsEnd = A4_W - MARGIN_RIGHT - pageNumWidth - 2;
    doc.setTextColor(...GRAY);
    let dotX = dotsStart;
    while (dotX < dotsEnd) {
      doc.text('.', dotX, indexY);
      dotX += 1.5;
    }
    doc.text(pageNumStr, A4_W - MARGIN_RIGHT, indexY, { align: 'right' });
    indexY += 7;
  }

  // Add lindeiros to index if any
  if (laudo.lindeiros.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...BLACK);
    doc.text('VISTORIA DOS LINDEIROS', MARGIN_LEFT, indexY + 3);
    indexY += 10;
    doc.setFont('helvetica', 'normal');
    for (let i = 0; i < laudo.lindeiros.length; i++) {
      const lind = laudo.lindeiros[i];
      const label = `Lindeiro ${i + 1}: ${lind.endereco || 'Sem endereço'}`;
      doc.setTextColor(...BLACK);
      doc.text(label, MARGIN_LEFT + 5, indexY);
      indexY += 6;
    }
  }

  // ==================== SECTION PAGES ====================
  const sectionLabels: Record<string, string> = {};
  SECOES_NAVEGAVEIS.forEach((s) => {
    sectionLabels[s.id] = s.label;
  });

  for (const secId of secoesTexto) {
    doc.addPage();
    pageCounter.current++;
    addHeaderFooter(doc, pageCounter.current, pageCounter.total);

    const title = sectionLabels[secId] || secId;
    const content = laudo.textos[secId];
    writeSectionWithPageBreaks(doc, title, content, MARGIN_TOP, pageCounter);
  }

  // ==================== LINDEIROS PAGES ====================
  if (laudo.lindeiros.length > 0) {
    doc.addPage();
    pageCounter.current++;
    addHeaderFooter(doc, pageCounter.current, pageCounter.total);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('DESCRIÇÃO E VISTORIA DOS LINDEIROS', MARGIN_LEFT, MARGIN_TOP);

    let ly = MARGIN_TOP + 12;

    for (let li = 0; li < laudo.lindeiros.length; li++) {
      const lind = laudo.lindeiros[li];

      if (ly > A4_H - 80) {
        doc.addPage();
        pageCounter.current++;
        addHeaderFooter(doc, pageCounter.current, pageCounter.total);
        ly = MARGIN_TOP;
      }

      // Lindeiro header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text(
        `LINDEIRO ${li + 1}: ${lind.tipoImovel.toUpperCase()} ${lind.tipoUso.toUpperCase()}`,
        MARGIN_LEFT,
        ly
      );
      ly += 7;

      // Info
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...BLACK);
      doc.text(`Endereço: ${lind.endereco}`, MARGIN_LEFT, ly);
      ly += 5;
      doc.text(
        `Responsável: ${lind.responsavel}  |  Telefone: ${lind.telefone}  |  Data: ${lind.dataVistoria}`,
        MARGIN_LEFT,
        ly
      );
      ly += 5;
      doc.text(`Estado de Conservação: ${lind.estadoConservacao}`, MARGIN_LEFT, ly);
      ly += 7;

      // Description
      if (lind.descricao) {
        doc.setFontSize(9);
        const descLines = doc.splitTextToSize(lind.descricao, CONTENT_W);
        for (const dl of descLines) {
          if (ly > A4_H - MARGIN_BOTTOM - 10) {
            doc.addPage();
            pageCounter.current++;
            addHeaderFooter(doc, pageCounter.current, pageCounter.total);
            ly = MARGIN_TOP;
          }
          doc.text(dl, MARGIN_LEFT, ly);
          ly += 4.5;
        }
        ly += 4;
      }

      // Ambientes with photos
      for (const amb of lind.ambientes) {
        if (ly > A4_H - 60) {
          doc.addPage();
          pageCounter.current++;
          addHeaderFooter(doc, pageCounter.current, pageCounter.total);
          ly = MARGIN_TOP;
        }

        // Ambiente name
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...BLACK);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(MARGIN_LEFT, ly - 4, CONTENT_W, 7, 1, 1, 'F');
        doc.text(`📍 ${amb.nome || 'Sem nome'}`, MARGIN_LEFT + 2, ly);
        ly += 8;

        // Photos grid: 2 columns x 3 rows = 6 per page
        if (amb.fotos.length > 0) {
          const GAP = 4;
          const photoW = (CONTENT_W - GAP) / 2;
          const photoH = 60;
          const captionH = 6;
          const cellH = photoH + captionH + 2;
          const PHOTOS_PER_PAGE = 6;
          const COLS = 2;

          for (let fi = 0; fi < amb.fotos.length; fi++) {
            const posInPage = fi % PHOTOS_PER_PAGE;
            const col = posInPage % COLS;
            const row = Math.floor(posInPage / COLS);

            // New page when starting a new group of 6, or if first photo won't fit
            if (posInPage === 0) {
              if (fi > 0 || ly + cellH > A4_H - MARGIN_BOTTOM) {
                doc.addPage();
                pageCounter.current++;
                addHeaderFooter(doc, pageCounter.current, pageCounter.total);
                ly = MARGIN_TOP;
              }
            }

            const px = MARGIN_LEFT + col * (photoW + GAP);
            const py = ly + row * cellH;

            const foto = amb.fotos[fi];
            if (foto.dataUrl && foto.dataUrl.length > 10) {
              try {
                doc.addImage(getImage(foto.dataUrl), 'JPEG', px, py, photoW, photoH);
              } catch {
                doc.setDrawColor(200, 200, 200);
                doc.setFillColor(240, 240, 240);
                doc.rect(px, py, photoW, photoH, 'FD');
              }
            } else {
              doc.setDrawColor(200, 200, 200);
              doc.setFillColor(240, 240, 240);
              doc.rect(px, py, photoW, photoH, 'FD');
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.setTextColor(...GRAY);
            doc.text(
              foto.legenda || `Fig:${String(fi + 1).padStart(4, '0')}`,
              px + photoW / 2,
              py + photoH + 4,
              { align: 'center' }
            );

            // After last photo in group or very last photo, advance ly
            if (posInPage === PHOTOS_PER_PAGE - 1 || fi === amb.fotos.length - 1) {
              const rowsUsed = row + 1;
              ly = ly + rowsUsed * cellH + 2;
            }
          }
        }
         else {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          doc.text('(Sem fotos)', MARGIN_LEFT, ly);
          ly += 6;
        }

        ly += 4;
      }

      ly += 8;
    }
  }

  // Update total pages
  const actualTotal = pageCounter.current;
  // Go back and update footers with correct total
  for (let i = 2; i <= actualTotal; i++) {
    doc.setPage(i);
    // Clear old footer area
    doc.setFillColor(255, 255, 255);
    doc.rect(0, A4_H - 16, A4_W, 16, 'F');
    // Redraw footer
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(MARGIN_LEFT, A4_H - 15, A4_W - MARGIN_RIGHT, A4_H - 15);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    const today = new Date().toLocaleDateString('pt-BR');
    doc.text(`Data: ${today}`, MARGIN_LEFT, A4_H - 10);
    doc.text(`Página ${i} de ${actualTotal}`, A4_W / 2, A4_H - 10, { align: 'center' });
  }

  // Download
  const nomeArquivo = `Laudo_${laudo.dadosCapa.empreendimento || 'Cautelar'}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
  doc.save(nomeArquivo);
}
