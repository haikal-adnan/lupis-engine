const _measureCaches = new WeakMap();

export default class FontMath {
    static clearCache(font) {
        if (font && typeof font === "object") {
            _measureCaches.delete(font);
        }
    }

    static measureText(font, str, size, options = {}) {
        if (!font || !font.chars || !font.info || str === undefined || str === null || str === "") {
            const fallbackW = Number(options.width) > 0 ? Number(options.width) : (Number(options.maxWidth) > 0 ? Number(options.maxWidth) : 0);
            return { 
                width: fallbackW, height: 0, boundsWidth: fallbackW, boundsHeight: 0, 
                xMin: 0, yMin: 0, xMax: 0, yMax: 0, 
                lines: [], lineWidths: [], wordCounts: [], lineH: 0 
            };
        }

        const limitWidth = (Number(options.width) > 0) 
            ? Number(options.width) 
            : ((Number(options.maxWidth) > 0) ? Number(options.maxWidth) : Infinity);

        const autoLine = options.autoLine !== false;
        const maxLine = Math.max(1, Number(options.maxLine ?? 1));
        const effectiveMaxLine = autoLine ? Infinity : maxLine;
        const isEllipsis = options.overflow === "ellipsis";
        const lineSpacing = Number(options.lineSpacing || 1.2);
        const letterSpacing = Number(options.letterSpacing || 0);
        const overflow = options.overflow || "";

        let fontCache = null;
        let cacheKey = null;

        if (typeof font === "object" && font !== null && !options.noCache) {
            fontCache = _measureCaches.get(font);
            if (!fontCache) {
                fontCache = new Map();
                _measureCaches.set(font, fontCache);
            }
            cacheKey = `${str}|${size}|${limitWidth}|${autoLine ? 1 : 0}|${effectiveMaxLine}|${lineSpacing}|${letterSpacing}|${overflow}`;
            const cached = fontCache.get(cacheKey);
            if (cached) {
                return cached;
            }
        }

        const scale = size / font.info.size;
        const lineH = (font.common?.lineHeight || 10) * scale * lineSpacing;
        const lSpacing = letterSpacing * scale;

        const getCharAdvance = (ch) => {
            const g = font.chars[ch.charCodeAt(0)];
            return g ? (g.adv * scale) + lSpacing : 0;
        };

        const getWordWidth = (word) => {
            let w = 0;
            for (let i = 0; i < word.length; i++) {
                w += getCharAdvance(word[i]);
            }
            return w;
        };

        const spaceW = getCharAdvance(' ');

        let lines = [];
        const rawLines = String(str).split(/\r\n|\r|\n/);
        let isTruncated = false;

        for (let p = 0; p < rawLines.length; p++) {
            if (lines.length >= effectiveMaxLine) {
                isTruncated = true;
                break;
            }

            const rLine = rawLines[p];
            if (limitWidth === Infinity) {
                lines.push(rLine);
                continue;
            }

            const words = rLine.split(' ');
            let currentLine = "";
            let currentLineW = 0;

            for (let i = 0; i < words.length; i++) {
                const word = words[i];

                if (word.length === 0) {
                    if (currentLine.length > 0) {
                        if (currentLineW + spaceW <= limitWidth) {
                            currentLine += " ";
                            currentLineW += spaceW;
                        } else {
                            if (lines.length + 1 < effectiveMaxLine) {
                                lines.push(currentLine);
                                currentLine = "";
                                currentLineW = 0;
                            } else {
                                isTruncated = true;
                                break;
                            }
                        }
                    }
                    continue;
                }

                const wordW = getWordWidth(word);
                const spaceNeeded = (currentLine.length > 0) ? spaceW : 0;

                if (currentLineW + spaceNeeded + wordW <= limitWidth) {
                    currentLine += (currentLine.length > 0 ? " " : "") + word;
                    currentLineW += spaceNeeded + wordW;
                    continue;
                }

                if (lines.length + 1 < effectiveMaxLine) {
                    if (currentLine.length > 0) {
                        lines.push(currentLine);
                        currentLine = "";
                        currentLineW = 0;
                    }

                    if (wordW <= limitWidth) {
                        currentLine = word;
                        currentLineW = wordW;
                    } else {
                        for (let c = 0; c < word.length; c++) {
                            const chW = getCharAdvance(word[c]);
                            if (currentLineW + chW <= limitWidth) {
                                currentLine += word[c];
                                currentLineW += chW;
                            } else {
                                if (lines.length + 1 < effectiveMaxLine) {
                                    lines.push(currentLine);
                                    currentLine = word[c];
                                    currentLineW = chW;
                                } else {
                                    isTruncated = true;
                                    break;
                                }
                            }
                        }
                    }
                } else {
                    isTruncated = true;
                    break;
                }
            }

            if (currentLine.length > 0) {
                lines.push(currentLine);
            } else if (words.length === 0 || rLine === "") {
                lines.push("");
            }
        }

        if (rawLines.length > lines.length) {
            isTruncated = true;
        }

        if (rawLines.length > 0 && lines.length === 0) {
            lines.push("");
        }

        if (lines.length > effectiveMaxLine) {
            lines = lines.slice(0, effectiveMaxLine);
            isTruncated = true;
        }

        if (isEllipsis && lines.length > 0 && isTruncated) {
            const ellipsisStr = "...";
            const ellipsisW = getWordWidth(ellipsisStr);
            let lastLine = lines[lines.length - 1];

            if (limitWidth !== Infinity) {
                while (lastLine.length > 0 && (getWordWidth(lastLine) + ellipsisW > limitWidth)) {
                    lastLine = lastLine.slice(0, -1);
                }
                lines[lines.length - 1] = lastLine.trimEnd() + ellipsisStr;
            } else {
                lines[lines.length - 1] = lastLine.trimEnd() + ellipsisStr;
            }
        } else {
            for (let i = 0; i < lines.length; i++) {
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

                const x0 = lineW + gdat.ox * scale;
                const x1 = x0 + gdat.w * scale;

                if (x0 < xMin) xMin = x0;
                if (x1 > xMax) xMax = x1;

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

        if (font.common && font.common.stdYMin !== undefined) {
            yMin = font.common.stdYMin * scale;
            const scaledStdYMax = font.common.stdYMax * scale;
            const totalLines = lines.length > 0 ? lines.length : 1;
            yMax = scaledStdYMax + ((totalLines - 1) * lineH);
        } else if (xMin === Infinity) {
            xMin = 0; xMax = cx; yMin = 0; yMax = lineH * (lines.length > 0 ? lines.length : 1);
        }

        const calculatedHeight = Math.max(0, yMax - yMin);
        const finalWidth = (limitWidth !== Infinity) ? limitWidth : Math.max(0, xMax - xMin);

        const result = {
            lines,
            lineWidths,
            wordCounts,
            width: finalWidth,
            boundsWidth: finalWidth,
            boundsHeight: calculatedHeight,
            xMin, yMin, xMax, yMax,
            baseline: (font.common?.base || 0) * scale,
            lineH
        };

        if (fontCache && cacheKey) {
            if (fontCache.size >= 1000) {
                const iter = fontCache.keys();
                for (let k = 0; k < 200; k++) {
                    const n = iter.next();
                    if (n.done) break;
                    fontCache.delete(n.value);
                }
            }
            fontCache.set(cacheKey, result);
        }

        return result;
    }
}