const statusDiv = document.getElementById('status');
const urlInput = document.getElementById('urlTemplateInput');
const downloadBtn = document.getElementById('downloadBtn');
const logContainer = document.getElementById('log-container');
let detectedUrlTemplate = null;

const CONCURRENCY = 25;
const SEGMENT_DURATION_SECONDS = 8;
const CONCURRENT_LIMIT = 6

function formatTime(totalSeconds) {
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        return "00:00";
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const paddedSeconds = String(seconds).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');

    if (hours > 0) {
        const paddedHours = String(hours).padStart(2, '0');
        return `${paddedHours}:${paddedMinutes}:${paddedSeconds}`;
    } else {
        return `${paddedMinutes}:${paddedSeconds}`;
    }
}

function log(message) {
    logContainer.textContent += message + '\n';
    logContainer.scrollTop = logContainer.scrollHeight;
}

function updateUIForFound(urlTemplate) {
    detectedUrlTemplate = urlTemplate;
    statusDiv.textContent = 'Video erkannt!';
    urlInput.value = urlTemplate;
    downloadBtn.disabled = false;
    downloadBtn.textContent = "Download starten";
}
chrome.runtime.sendMessage({ type: 'get_status' }, (response) => {
    if (response && response.type === 'URL_FOUND') {
        updateUIForFound(response.payload);
    }
});
chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'URL_FOUND') {
        updateUIForFound(message.payload);
    }
});
downloadBtn.addEventListener('click', () => {
    if (!detectedUrlTemplate) { log("Fehler: Konnte keine URL-Vorlage finden."); return; }
    logContainer.textContent = `Starte Download-Prozess \n`;
    downloadBtn.disabled = true;
    downloadBtn.textContent = "Download läuft...";
    startDownload(detectedUrlTemplate);
});

async function findTotalSegmentsFast(urlTemplate) {
    log("Ermittle Segment-Anzahl...");
    
    async function segmentExists(index) {
        const url = urlTemplate.replace('{}', index);
        try {
            const res = await fetch(url, { method: 'HEAD' });
            return res.ok;
        } catch {
            return false;
        }
    }

    // Parallel mehrere Punkte checken für schnellere obere Grenze
    const checkPoints = [100, 500, 1000, 2000, 5000];
    const results = await Promise.all(checkPoints.map(segmentExists));
    
    let upper = checkPoints[results.lastIndexOf(true) + 1] || checkPoints[0];
    let lower = checkPoints[results.lastIndexOf(true)] || 0;
    
    // Falls alle existieren, weiter suchen
    if (results.every(Boolean)) {
        upper = 10000;
        while (await segmentExists(upper)) upper *= 2;
        lower = 5000;
    }
    
    // Binary Search
    while (lower < upper) {
        const mid = Math.floor((lower + upper) / 2);
        if (await segmentExists(mid)) {
            lower = mid + 1;
        } else {
            upper = mid;
        }
    }

    log(`Gefunden: ${lower} Segmente`);
    return lower;
}
async function startDownload(urlTemplate) {

    const totalSegments = await findTotalSegmentsFast(urlTemplate);

    try {
        const fileHandle = await self.showSaveFilePicker({
            suggestedName: 'video.ts',
            types: [{ description: 'MPEG Transport Stream', accept: { 'video/mp2t': ['.ts'] } }],
        });

        const writableStream = await fileHandle.createWritable();
        log(`Starte Download von ${totalSegments} Segmenten mit ${CONCURRENCY} parallelen Downloads...`);

        const results = new Map();
        let nextWrite = 0;
        let downloadedCount = 0;
        
        // --- OPTIMIERUNG 1: Einen einfachen Zähler statt eines Arrays verwenden ---
        // Dies ist eine O(1) Operation und extrem schnell, egal wie viele Segmente es gibt.
        let nextSegmentToFetch = 0;

        // Schreibt Segmente in der richtigen Reihenfolge in die Datei
        async function processWriteQueue() {
            while (results.has(nextWrite)) {
                const data = results.get(nextWrite);
                await writableStream.write(data);
                results.delete(nextWrite);
                
                downloadedCount++;
                
                // --- OPTIMIERUNG 2: Fortschritt seltener aktualisieren ---
                // Loggt nur alle 100 Segmente oder am Ende, um UI-Updates zu reduzieren.
                if (downloadedCount % 100 === 0 || downloadedCount === totalSegments) {
                    log(`Fortschritt: ${downloadedCount} / ${totalSegments} Segmente geschrieben.`);
                }
                
                nextWrite++;
            }
        }

        // Ein "Worker" holt sich den nächsten Segment-Index, lädt ihn herunter und stößt das Schreiben an
        async function worker() {
            while (true) {
                const segmentIndex = nextSegmentToFetch++; // Hol dir die nächste Indexnummer
                if (segmentIndex >= totalSegments) {
                    break; // Keine Segmente mehr übrig
                }

                try {
                    const url = urlTemplate.replace('{}', segmentIndex);
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`HTTP-Fehler ${res.status}`);
                    
                    const data = new Uint8Array(await res.arrayBuffer());
                    results.set(segmentIndex, data);
                    
                    await processWriteQueue();

                } catch (error) {
                    log(`Fehler bei Segment ${segmentIndex}: ${error.message}. Das Segment wird übersprungen.`);
                }
            }
        }

        // Erstellen und Starten aller Worker
        const workerPromises = Array.from({ length: CONCURRENCY }, () => worker());
        await Promise.all(workerPromises);

        // Sicherstellen, dass alle verbleibenden Segmente geschrieben werden
        await processWriteQueue();

        await writableStream.close();
        log(`--- DOWNLOAD ERFOLGREICH (${downloadedCount}/${totalSegments} geschrieben) ---`);

    } catch (error) {
        if (error.name !== 'AbortError') log(`FEHLER: ${error.message}`);
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = "Download starten";
    }
}

//old
/*
async function startDownload(urlTemplate) {
    let writableStream;
    try {
        log("Öffne 'Speichern unter...'");
        const fileHandle = await self.showSaveFilePicker({
            suggestedName: 'video.ts',
            types: [{ description: 'MPEG Transport Stream', accept: { 'video/mp2t': ['.ts'] } }],
        });

        writableStream = await fileHandle.createWritable();
        const writer = writableStream.getWriter();

        log("Starte Download...");
        let segmentIndex = 0;
        let downloadSuccess = false;

        while (true) {
            const promises = [];
            for (let i = 0; i < BATCH_SIZE; i++) {
                const currentSegmentNum = segmentIndex + i;
                const url = urlTemplate.replace('{}', currentSegmentNum);
                promises.push(fetch(url));
            }

            try {
                const responses = await Promise.all(promises);
                let endOfStream = false;
                const buffersToWrite = [];

                for (let i = 0; i < responses.length; i++) {
                    const res = responses[i];
                    const currentSegmentNum = segmentIndex + i;
                    if (!res.ok) {
                        log(`Letzts file ${currentSegmentNum} gelesen. Beende Download...`);
                        endOfStream = true;
                        break;
                    }
                    const segmentData = await res.arrayBuffer();
                    buffersToWrite.push({ num: currentSegmentNum, data: new Uint8Array(segmentData) });
                }

                for (const buffer of buffersToWrite) {
                    await writer.write(buffer.data);
                    const currentTotalSeconds = (buffer.num + 1) * SEGMENT_DURATION_SECONDS;
                    const formattedTime = formatTime(currentTotalSeconds);
                    log(`Current minutes downloaded: ${formattedTime}`);
                }

                if (endOfStream) {
                    downloadSuccess = true;
                    break;
                }
            } catch (networkError) {
                log(`FEHLER im Batch ab Segment ${segmentIndex}: ${networkError.message}`);
                downloadSuccess = false;
                break;
            }
            
            segmentIndex += BATCH_SIZE;
        }

        if (downloadSuccess) {
            await writer.close();
            log("--- DOWNLOAD ERFOLGREICH ABGESCHLOSSEN ---");
        } else {
            await writer.abort();
            log("--- DOWNLOAD FEHLGESCHLAGEN ---");
        }
    } catch (error) {
        if (error.name !== 'AbortError') { log(`FATALER FEHLER: ${error.message}`); }
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.textContent = "Download starten";
    }
}
*/
