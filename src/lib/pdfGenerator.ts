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
  // Croqui images
  for (const ci of (laudo.croquiImages || [])) {
    if (ci.url && ci.url.startsWith('http')) urls.push(ci.url);
  }
  // ART images
  for (const ai of (laudo.artImages || [])) {
    if (ai && ai.startsWith('http')) urls.push(ai);
  }
  // Documentações images
  for (const doc of (laudo.documentacoes || [])) {
    for (const img of doc.imagens) {
      if (img && img.startsWith('http')) urls.push(img);
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

  // ==================== INDEX PAGE (placeholder - rebuilt at end) ====================
  doc.addPage();
  pageCounter.current++;
  const indexPageNum = pageCounter.current; // remember which page is the index
  addHeaderFooter(doc, pageCounter.current, pageCounter.total);

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
  // Track page numbers for each ambiente for the index
  const ambientePages: Map<string, { start: number; end: number }> = new Map();

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

      // Description with automatic page breaks
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
      for (let ai = 0; ai < lind.ambientes.length; ai++) {
        const amb = lind.ambientes[ai];
        const ambKey = `L${li + 1}-${ai}`;
        const ambTitle = `> ${amb.nome || 'Sem nome'}`;
        const TITLE_H = 10; // height of title block

        // Helper to draw the ambiente title bar
        const drawAmbienteTitle = (atY: number) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...BLACK);
          doc.setFillColor(245, 245, 245);
          doc.roundedRect(MARGIN_LEFT, atY - 4, CONTENT_W, 7, 1, 1, 'F');
          doc.text(ambTitle, MARGIN_LEFT + 2, atY);
        };

        // Ensure title + at least one photo row fit; otherwise new page
        const GAP = 4;
        const photoW = (CONTENT_W - GAP) / 2;
        const captionH = 6;
        const photoH = 55;
        const cellH = photoH + captionH + GAP;
        const minNeeded = TITLE_H + (amb.fotos.length > 0 ? cellH : 10);

        if (ly + minNeeded > A4_H - MARGIN_BOTTOM - 5) {
          doc.addPage();
          pageCounter.current++;
          addHeaderFooter(doc, pageCounter.current, pageCounter.total);
          ly = MARGIN_TOP;
        }

        // Draw title
        drawAmbienteTitle(ly);
        const startPage = pageCounter.current;
        ly += TITLE_H;

        // Photos grid
        if (amb.fotos.length > 0) {
          let fi = 0;
          while (fi < amb.fotos.length) {
            // Check if we need a new page for the next row
            if (ly + cellH > A4_H - MARGIN_BOTTOM - 5) {
              doc.addPage();
              pageCounter.current++;
              addHeaderFooter(doc, pageCounter.current, pageCounter.total);
              ly = MARGIN_TOP;
              // Repeat ambiente title on new page
              drawAmbienteTitle(ly);
              ly += TITLE_H;
            }

            // Print a row of 2 photos
            for (let col = 0; col < 2 && fi < amb.fotos.length; col++, fi++) {
              const px = MARGIN_LEFT + col * (photoW + GAP);
              const py = ly;

              const foto = amb.fotos[fi];
              if (foto.dataUrl && foto.dataUrl.length > 10) {
                try {
                  const imgData = getImage(foto.dataUrl);
                  doc.addImage(imgData, 'JPEG', px, py, photoW, photoH);
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
                foto.legenda || `Foto ${fi + 1}`,
                px + photoW / 2,
                py + photoH + 4,
                { align: 'center' }
              );
            }
            ly += cellH;
          }
        } else {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(...GRAY);
          doc.text('(Sem fotos)', MARGIN_LEFT, ly);
          ly += 6;
        }

        ambientePages.set(ambKey, { start: startPage, end: pageCounter.current });
        ly += 4;
      }

      ly += 8;
    }
  }

  // ==================== CROQUI PAGES ====================
  const croquiImages = laudo.croquiImages || [];
  const croquiStartPage = croquiImages.length > 0 ? pageCounter.current + 1 : 0;
  if (croquiImages.length > 0) {
    for (const ci of croquiImages) {
      doc.addPage();
      pageCounter.current++;
      addHeaderFooter(doc, pageCounter.current, pageCounter.total);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text('CROQUI DE LOCALIZAÇÃO', MARGIN_LEFT, MARGIN_TOP);

      if (ci.url) {
        try {
          const imgData = getImage(ci.url);
          doc.addImage(imgData, 'JPEG', MARGIN_LEFT, MARGIN_TOP + 8, CONTENT_W, 180);
        } catch {}
      }

      if (ci.legenda) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...GRAY);
        doc.text(ci.legenda, A4_W / 2, MARGIN_TOP + 195, { align: 'center', maxWidth: CONTENT_W });
      }
    }
  }
  const croquiEndPage = croquiImages.length > 0 ? pageCounter.current : 0;

  // ==================== ART PAGES ====================
  const artImgs = laudo.artImages || [];
  const artStartPage = artImgs.length > 0 ? pageCounter.current + 1 : 0;
  if (artImgs.length > 0) {
    for (let aidx = 0; aidx < artImgs.length; aidx++) {
      doc.addPage();
      pageCounter.current++;
      addHeaderFooter(doc, pageCounter.current, pageCounter.total);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...PRIMARY_COLOR);
      doc.text('ART - ANOTAÇÃO DE RESPONSABILIDADE TÉCNICA', MARGIN_LEFT, MARGIN_TOP);

      try {
        const imgData = getImage(artImgs[aidx]);
        doc.addImage(imgData, 'JPEG', MARGIN_LEFT, MARGIN_TOP + 8, CONTENT_W, 200);
      } catch {}
    }
  }
  const artEndPage = artImgs.length > 0 ? pageCounter.current : 0;

  // ==================== DOCUMENTAÇÕES PAGES ====================
  const documentacoes = laudo.documentacoes || [];
  const docsStartPage = documentacoes.length > 0 ? pageCounter.current + 1 : 0;
  if (documentacoes.length > 0) {
    doc.addPage();
    pageCounter.current++;
    addHeaderFooter(doc, pageCounter.current, pageCounter.total);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...PRIMARY_COLOR);
    doc.text('DOCUMENTAÇÕES', MARGIN_LEFT, MARGIN_TOP);

    let docsY = MARGIN_TOP + 12;
    for (const docItem of documentacoes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...BLACK);
      doc.text(`• ${docItem.nome || 'Documentação sem título'}`, MARGIN_LEFT + 5, docsY);
      docsY += 7;
    }

    for (const docItem of documentacoes) {
      for (const imgUrl of docItem.imagens) {
        doc.addPage();
        pageCounter.current++;
        addHeaderFooter(doc, pageCounter.current, pageCounter.total);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...PRIMARY_COLOR);
        doc.text(docItem.nome || 'Ficha de Vistoria', MARGIN_LEFT, MARGIN_TOP);

        try {
          const imgData = getImage(imgUrl);
          doc.addImage(imgData, 'JPEG', MARGIN_LEFT, MARGIN_TOP + 8, CONTENT_W, 200);
        } catch {}
      }
    }
  }
  const docsEndPage = documentacoes.length > 0 ? pageCounter.current : 0;

  // ==================== CONCLUSÃO PAGE ====================
  const conclusaoText = laudo.conclusao || '';
  const conclusaoStartPage = conclusaoText.trim() ? pageCounter.current + 1 : 0;
  if (conclusaoText.trim()) {
    doc.addPage();
    pageCounter.current++;
    addHeaderFooter(doc, pageCounter.current, pageCounter.total);
    writeSectionWithPageBreaks(doc, 'XI. CONCLUSÃO', conclusaoText, MARGIN_TOP, pageCounter);
  }
  const conclusaoEndPage = conclusaoText.trim() ? pageCounter.current : 0;

  // Update total pages
  const actualTotal = pageCounter.current;

  // ==================== REBUILD INDEX PAGE ====================
  doc.setPage(indexPageNum);
  // Clear entire content area
  doc.setFillColor(255, 255, 255);
  doc.rect(0, MARGIN_TOP - 5, A4_W, A4_H - MARGIN_TOP - MARGIN_BOTTOM + 5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text('ÍNDICE', A4_W / 2, MARGIN_TOP + 5, { align: 'center' });

  let indexY = MARGIN_TOP + 18;
  const indexSections = SECOES_NAVEGAVEIS.filter((s) => s.id !== 'capa' && s.id !== 'indice');
  doc.setFontSize(10);

  const drawIndexLine = (label: string, pageStr: string, y: number) => {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...BLACK);
    doc.text(label, MARGIN_LEFT, y);
    const labelWidth = doc.getTextWidth(label);
    const pageNumWidth = doc.getTextWidth(pageStr);
    const dotsStart = MARGIN_LEFT + labelWidth + 2;
    const dotsEnd = A4_W - MARGIN_RIGHT - pageNumWidth - 2;
    doc.setTextColor(...GRAY);
    let dotX = dotsStart;
    while (dotX < dotsEnd) {
      doc.text('.', dotX, y);
      dotX += 1.5;
    }
    doc.text(pageStr, A4_W - MARGIN_RIGHT, y, { align: 'right' });
  };

  // Text sections use simple page numbering (page 3 onwards)
  const textSectionIds = ['introducao', 'objeto', 'objetivo', 'finalidade', 'responsabilidades', 'classificacao', 'lindeiros'];
  const textSections = indexSections.filter(s => textSectionIds.includes(s.id));
  for (let i = 0; i < textSections.length; i++) {
    drawIndexLine(textSections[i].label, String(i + 3), indexY);
    indexY += 7;
  }

  // Add lindeiros + ambientes with page ranges
  if (laudo.lindeiros.length > 0) {
    indexY += 3;
    for (let li = 0; li < laudo.lindeiros.length; li++) {
      const lind = laudo.lindeiros[li];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...BLACK);
      doc.text(`  Lindeiro ${li + 1}: ${lind.endereco || 'Sem endereço'}`, MARGIN_LEFT + 5, indexY);
      indexY += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      for (let ai = 0; ai < lind.ambientes.length; ai++) {
        const amb = lind.ambientes[ai];
        const ambKey = `L${li + 1}-${ai}`;
        const pages = ambientePages.get(ambKey);
        const ambLabel = amb.nome || 'Sem nome';
        let pageStr = '';
        if (pages) {
          pageStr = pages.start === pages.end ? `${pages.start}` : `${pages.start} a ${pages.end}`;
        }
        doc.setTextColor(...BLACK);
        const fullLabel = `     ${ambLabel}`;
        doc.text(fullLabel, MARGIN_LEFT + 10, indexY);
        if (pageStr) {
          const lw = doc.getTextWidth(fullLabel);
          const pw = doc.getTextWidth(pageStr);
          const ds = MARGIN_LEFT + 10 + lw + 2;
          const de = A4_W - MARGIN_RIGHT - pw - 2;
          doc.setTextColor(...GRAY);
          let dx = ds;
          while (dx < de) { doc.text('.', dx, indexY); dx += 1.5; }
          doc.text(pageStr, A4_W - MARGIN_RIGHT, indexY, { align: 'right' });
        }
        indexY += 4.5;
      }
      indexY += 2;
    }
  }

  // New sections in index
  indexY += 3;
  doc.setFontSize(10);
  if (croquiStartPage > 0) {
    const ps = croquiStartPage === croquiEndPage ? `${croquiStartPage}` : `${croquiStartPage} a ${croquiEndPage}`;
    drawIndexLine('VIII. Croqui', ps, indexY);
    indexY += 7;
  }
  if (artStartPage > 0) {
    const ps = artStartPage === artEndPage ? `${artStartPage}` : `${artStartPage} a ${artEndPage}`;
    drawIndexLine('IX. ART', ps, indexY);
    indexY += 7;
  }
  if (docsStartPage > 0) {
    const ps = docsStartPage === docsEndPage ? `${docsStartPage}` : `${docsStartPage} a ${docsEndPage}`;
    drawIndexLine('X. Documentações', ps, indexY);
    indexY += 7;
  }
  if (conclusaoStartPage > 0) {
    const ps = conclusaoStartPage === conclusaoEndPage ? `${conclusaoStartPage}` : `${conclusaoStartPage} a ${conclusaoEndPage}`;
    drawIndexLine('XI. Conclusão', ps, indexY);
    indexY += 7;
  }

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
