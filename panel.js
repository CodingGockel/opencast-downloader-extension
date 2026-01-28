const statusDiv = document.getElementById('status');
const urlInput = document.getElementById('urlTemplateInput');
const downloadBtn = document.getElementById('downloadBtn');
const logContainer = document.getElementById('log-container');
let detectedUrlTemplate = null;

const BATCH_SIZE = 25; 
const SEGMENT_DURATION_SECONDS = 8;

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
