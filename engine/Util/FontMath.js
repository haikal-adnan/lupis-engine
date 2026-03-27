export default class FontMath {
    static measureText(font, str, size, options = {}) {
        if (!font || !font.chars || !font.info || !str) {
            return { 
                width: 0, height: 0, boundsWidth: 0, boundsHeight: 0, 
                xMin: 0, yMin: 0, xMax: 0, yMax: 0, 
                lines: [], lineWidths: [], wordCounts: [], lineH: 0 
            };
        }

        const scale = size / font.info.size;
        const lineH = (font.common?.lineHeight || 10) * scale * (options.lineSpacing || 1.2);
        const lSpacing = (options.letterSpacing || 0) * scale;
        
        const maxWidth = (options.maxWidth > 0) ? options.maxWidth : Infinity;
        let maxLine = (options.maxLine > 0) ? options.maxLine : Infinity;
        const isEllipsis = options.overflow === "ellipsis";

        if (isEllipsis && maxLine === Infinity) {
            maxLine = 1;
        }

        let lines = [];
        const rawLines = String(str).split('\n');
        
        const getCharAdvance = (ch) => {
            const g = font.chars[ch.charCodeAt(0)];
            return g ? (g.adv * scale) + lSpacing : 0;
        };

        const spaceW = getCharAdvance(' ');

        for (const rLine of rawLines) {
            if (maxWidth === Infinity) {
                lines.push(rLine);
                continue;
            }

            const words = rLine.split(' ');
            let currentLine = "";
            let currentLineW = 0;

            for (let i = 0; i < words.length; i++) {
                const word = words[i];
                let wordW = 0;
                for (const ch of word) {
                    wordW += getCharAdvance(ch);
                }

                const addedW = (currentLine.length > 0) ? wordW + spaceW : wordW;
                const connector = (currentLine.length > 0) ? " " : "";

                if (currentLineW + addedW > maxWidth && currentLine.length > 0) {
                    lines.push(currentLine); 
                    currentLine = word;
                    currentLineW = wordW;
                } else {
                    currentLine += connector + word;
                    currentLineW += addedW;
                }
            }
            if (currentLine.length > 0) {
                lines.push(currentLine);
            } else if (words.length === 0 || rLine === "") {
                lines.push("");
            }
        }

        let isTruncated = false;
        if (lines.length > maxLine) {
            lines = lines.slice(0, maxLine);
            isTruncated = true;
        }

        if (isTruncated && isEllipsis && lines.length > 0) {
            const ellipsisStr = "...";
            let ellipsisW = 0;
            
            for (const ch of ellipsisStr) {
                ellipsisW += getCharAdvance(ch);
            }

            let lastLine = lines[lines.length - 1];
            let lineW = 0;
            
            for (const ch of lastLine) {
                 lineW += getCharAdvance(ch);
            }
            
            if (maxWidth !== Infinity) {
                while (lastLine.length > 0 && (lineW + ellipsisW > maxWidth)) {
                    const removedCh = lastLine[lastLine.length - 1];
                    lineW -= getCharAdvance(removedCh);
                    lastLine = lastLine.slice(0, -1);
                }
            }
            lines[lines.length - 1] = lastLine.trimEnd() + ellipsisStr;
            
        } else {
            for(let i = 0; i < lines.length; i++){
                lines[i] = lines[i].trimEnd();
            }
        }

        let cx = 0, cy = 0;
        let xMin = Infinity, yMin = Infinity, xMax = -Infinity, yMax = -Infinity;
        const lineWidths = [];
        const wordCounts = []; 

        for (const line of lines) {
            let lineW = 0;
            let spaces = 0;
            
            for (let i = 0; i < line.length; i++) {
                const ch = line[i];
                if (ch === ' ') spaces++;

                const gdat = font.chars[ch.charCodeAt(0)];
                if (!gdat) continue;

                // Hitung batas X secara normal berdasarkan karakter yang ada
                const x0 = lineW + gdat.ox * scale;
                const x1 = x0 + gdat.w * scale;

                if (x0 < xMin) xMin = x0;
                if (x1 > xMax) xMax = x1;

                // Kita tetap bisa menghitung Y murni sebagai cadangan,
                // tapi nanti akan di-override oleh nilai standar jika tersedia.
                const y0 = cy + gdat.oy * scale;
                const y1 = y0 + gdat.h * scale;
                if (y0 < yMin) yMin = y0;
                if (y1 > yMax) yMax = y1;

                lineW += (gdat.adv * scale) + lSpacing;
            }
            
            if (line.length > 0) lineW -= lSpacing;

            lineWidths.push(lineW);
            wordCounts.push(spaces);
            if (lineW > cx) cx = lineW;
            cy += lineH;
        }

        // ========================================================
        // MODIFIKASI: LANGSUNG AKTIFKAN STANDARD HEIGHT
        // ========================================================
        if (font.common && font.common.stdYMin !== undefined) {
            // Override nilai Y dengan nilai standar dari GLFontResource
            yMin = font.common.stdYMin * scale;
            const scaledStdYMax = font.common.stdYMax * scale;
            
            const totalLines = lines.length > 0 ? lines.length : 1;
            // yMax memperhitungkan jumlah baris teks saat ini
            yMax = scaledStdYMax + ((totalLines - 1) * lineH);
        } else if (xMin === Infinity) {
            // Fallback jika string kosong dan tidak ada data standar
            xMin = 0; xMax = cx; yMin = 0; yMax = lineH * (lines.length > 0 ? lines.length : 1);
        }
        // ========================================================

        return {
            lines,
            lineWidths,
            wordCounts,
            width: cx,
            boundsWidth: Math.max(0, xMax - xMin),
            boundsHeight: Math.max(0, yMax - yMin), // Dijamin stabil!
            xMin, yMin, xMax, yMax,
            baseline: (font.common?.base || 0) * scale,
            lineH
        };
    }
}