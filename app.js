/**
 * Lagerkontroll - Etterfyllingsregistrering
 * Enkelt webverktøy for å registrere behov ved lagergjennomgang
 *
 * Funksjoner:
 * - Start ny runde med lokasjon, avdeling, etc.
 * - Registrer artikkellinjer med nummer, antall og kommentar
 * - Automatisk dato og uke
 * - Eksport til CSV
 * - Offline-first med localStorage
 */

// Global tilstand
let currentRound = null;

// DOM-elementer
const startView = document.getElementById('startView');
const registrationView = document.getElementById('registrationView');
const startForm = document.getElementById('startForm');
const itemForm = document.getElementById('itemForm');
const itemsList = document.getElementById('itemsList');
const itemCount = document.getElementById('itemCount');
const finishRoundBtn = document.getElementById('finishRoundBtn');
const cancelRoundBtn = document.getElementById('cancelRoundBtn');

// Visningselementer for rundeinfo
const displayLocation = document.getElementById('displayLocation');
const displayDepartment = document.getElementById('displayDepartment');
const displayDate = document.getElementById('displayDate');
const displayWeek = document.getElementById('displayWeek');

/**
 * Hent ISO-ukenummer for en gitt dato
 * @param {Date} date - Datoobjekt
 * @returns {number} ISO-ukenummer
 */
function getISOWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

/**
 * Formater dato til YYYY-MM-DD
 * @param {Date} date - Datoobjekt
 * @returns {string} Formatert dato
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Last inn runde fra localStorage
 */
function loadRoundFromStorage() {
    const stored = localStorage.getItem('currentRound');
    if (stored) {
        try {
            currentRound = JSON.parse(stored);
            showRegistrationView();
        } catch (e) {
            console.error('Feil ved lasting av runde:', e);
            localStorage.removeItem('currentRound');
        }
    }
}

/**
 * Lagre runde til localStorage
 */
function saveRoundToStorage() {
    if (currentRound) {
        localStorage.setItem('currentRound', JSON.stringify(currentRound));
    }
}

/**
 * Start en ny runde
 * @param {Event} e - Form submit event
 */
function startRound(e) {
    e.preventDefault();

    const locationSelect = document.getElementById('location');
    const location = locationSelect.value === '__custom__'
        ? document.getElementById('locationCustom').value.trim()
        : locationSelect.value;
    const department = document.getElementById('department').value.trim();
    const csvFilename = document.getElementById('csvFilename').value.trim();
    const registeredBy = document.getElementById('registeredBy').value.trim();

    const now = new Date();
    const date = formatDate(now);
    const week = getISOWeek(now);

    currentRound = {
        location: location,
        department: department || '',
        csvFilename: csvFilename,
        registeredBy: registeredBy || '',
        date: date,
        week: week,
        items: []
    };

    saveRoundToStorage();
    showRegistrationView();
    startForm.reset();
}

/**
 * Vis registreringsvisningen
 */
function showRegistrationView() {
    startView.classList.add('hidden');
    registrationView.classList.remove('hidden');

    // Oppdater visningselementer
    displayLocation.textContent = currentRound.location;
    displayDepartment.textContent = currentRound.department || '(ikke angitt)';
    displayDate.textContent = currentRound.date;
    displayWeek.textContent = currentRound.week;

    updateItemsList();
}

/**
 * Vis startvisningen
 */
function showStartView() {
    registrationView.classList.add('hidden');
    startView.classList.remove('hidden');
}

/**
 * Legg til en ny artikkel
 * @param {Event} e - Form submit event
 */
function addItem(e) {
    e.preventDefault();

    const articleNumber = document.getElementById('articleNumber').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const comment = document.getElementById('comment').value.trim();

    const item = {
        id: Date.now(), // Enkel ID basert på timestamp
        articleNumber: articleNumber,
        quantity: quantity,
        comment: comment || ''
    };

    currentRound.items.push(item);
    saveRoundToStorage();
    updateItemsList();
    itemForm.reset();

    // Vis sist registrerte linje
    const banner = document.getElementById('lastItemBanner');
    const lastText = document.getElementById('lastItemText');
    lastText.textContent = `${item.articleNumber}  ×${item.quantity}${item.comment ? '  – ' + item.comment : ''}`;
    banner.classList.remove('hidden');

    // Sett fokus tilbake til artikkelnummer-feltet
    document.getElementById('articleNumber').focus();
}

/**
 * Slett en artikkel
 * @param {number} itemId - ID til artikkelen som skal slettes
 */
function deleteItem(itemId) {
    if (confirm('Er du sikker på at du vil slette denne linjen?')) {
        currentRound.items = currentRound.items.filter(item => item.id !== itemId);
        saveRoundToStorage();
        updateItemsList();
    }
}

/**
 * Oppdater visningen av artikler
 */
function updateItemsList() {
    itemCount.textContent = currentRound.items.length;

    if (currentRound.items.length === 0) {
        itemsList.innerHTML = '<p class="empty-message">Ingen linjer registrert ennå.</p>';
        return;
    }

    itemsList.innerHTML = currentRound.items.map(item => `
        <div class="item">
            <div class="item-header">
                <span class="item-article">${escapeHtml(item.articleNumber)}</span>
                <span class="item-quantity">× ${item.quantity}</span>
            </div>
            ${item.comment ? `<div class="item-comment">${escapeHtml(item.comment)}</div>` : ''}
            <button class="item-delete" onclick="deleteItem(${item.id})">🗑️ Slett</button>
        </div>
    `).join('');
}

/**
 * Escape HTML for å unngå XSS
 * @param {string} text - Tekst som skal escapes
 * @returns {string} Escapet tekst
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Generer CSV-innhold
 * @returns {string} CSV-innhold
 */
function generateCSV() {
    // CSV-header
    const headers = ['dato', 'uke', 'lokasjon', 'avdeling', 'artikkelnummer', 'antall', 'kommentar', 'registrert_av'];

    // CSV-rader
    const rows = currentRound.items.map(item => {
        return [
            currentRound.date,
            currentRound.week,
            escapeCSV(currentRound.location),
            escapeCSV(currentRound.department),
            escapeCSV(item.articleNumber),
            item.quantity,
            escapeCSV(item.comment),
            escapeCSV(currentRound.registeredBy)
        ];
    });

    // Kombiner header og rader
    const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
    ].join('\n');

    return csvContent;
}

/**
 * Escape CSV-felt (håndterer komma, anførselstegn, linjeskift)
 * @param {string} field - Felt som skal escapes
 * @returns {string} Escapet felt
 */
function escapeCSV(field) {
    if (field === undefined || field === null) {
        return '';
    }

    const stringField = String(field);

    // Hvis feltet inneholder semikolon, anførselstegn eller linjeskift, må det omsluttes av anførselstegn
    if (stringField.includes(';') || stringField.includes('"') || stringField.includes('\n')) {
        // Doble anførselstegn må escapes
        return `"${stringField.replace(/"/g, '""')}"`;
    }

    return stringField;
}

/**
 * Generer filnavn for CSV
 * @returns {string} Filnavn
 */
function generateFilename() {
    // Format: <csv-filnavn>_<lokasjon>_<dato>.csv
    const safeCsvFilename = currentRound.csvFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeLocation = currentRound.location.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${safeCsvFilename}_${safeLocation}_${currentRound.date}.csv`;
}

/**
 * Last ned CSV-fil
 * @param {string} content - CSV-innhold
 * @param {string} filename - Filnavn
 */
function downloadCSV(content, filename) {
    // Legg til BOM for korrekt UTF-8-håndtering i Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Avslutt runde og eksporter til CSV
 */
function finishRound() {
    if (currentRound.items.length === 0) {
        alert('Du må registrere minst én linje før du kan avslutte runden.');
        return;
    }

    if (confirm(`Avslutt runde og eksporter ${currentRound.items.length} linjer til CSV?`)) {
        const csvContent = generateCSV();
        const filename = generateFilename();

        downloadCSV(csvContent, filename);

        // Rydd opp
        localStorage.removeItem('currentRound');
        currentRound = null;
        showStartView();

        alert(`CSV-fil "${filename}" er lastet ned!`);
    }
}

/**
 * Avbryt runde og slett data
 */
function cancelRound() {
    if (confirm('Er du sikker på at du vil slette hele runden og starte på nytt? Alle registrerte linjer vil gå tapt.')) {
        localStorage.removeItem('currentRound');
        currentRound = null;
        showStartView();
    }
}

/**
 * Initialiser app
 */
function init() {
    // Event listeners
    startForm.addEventListener('submit', startRound);
    itemForm.addEventListener('submit', addItem);
    finishRoundBtn.addEventListener('click', finishRound);
    cancelRoundBtn.addEventListener('click', cancelRound);

    // Lokasjon dropdown – vis fritekstfelt ved "Annet"
    document.getElementById('location').addEventListener('change', function () {
        const custom = document.getElementById('locationCustom');
        if (this.value === '__custom__') {
            custom.style.display = 'block';
            custom.required = true;
        } else {
            custom.style.display = 'none';
            custom.required = false;
            custom.value = '';
        }
    });

    // +/- knapper for antall
    document.getElementById('qtyMinus').addEventListener('click', () => {
        const qty = document.getElementById('quantity');
        if (parseInt(qty.value) > 1) qty.value = parseInt(qty.value) - 1;
    });
    document.getElementById('qtyPlus').addEventListener('click', () => {
        const qty = document.getElementById('quantity');
        qty.value = parseInt(qty.value) + 1;
    });

    // Last inn eksisterende runde hvis den finnes
    loadRoundFromStorage();
}

// Start appen når DOM er klar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * ========================================
 * STREKKODE-SKANNER MED KAMERA
 * ========================================
 */

let scannerStream = null;
let scannerActive = false;
let scannerTimeout = null;

const scanBtn = document.getElementById('scanBtn');
const closeScanBtn = document.getElementById('closeScanBtn');
const scannerOverlay = document.getElementById('scannerOverlay');
const scannerVideo = document.getElementById('scannerVideo');

/**
 * Sjekk om BarcodeDetector er støttet
 */
function isBarcodeDetectorSupported() {
    return 'BarcodeDetector' in window;
}

/**
 * Start kamera-skanning
 */
async function startScanner() {
    if (!isBarcodeDetectorSupported()) {
        alert('⚠️ Strekkode-skanning støttes ikke i denne nettleseren. Vennligst bruk Chrome på Android eller skriv inn artikkelnummer manuelt.');
        return;
    }

    try {
        // Be om kamera-tilgang
        scannerStream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: 'environment', // Bruk bakkamera
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        scannerVideo.srcObject = scannerStream;
        scannerOverlay.classList.remove('hidden');
        scannerActive = true;

        // Anvend zoom hvis støttet
        await applyZoom();

        // Automatisk skanning er deaktivert – bruker trykker selv på "Les kode"-knappen
        // detectBarcode();

        // Timeout etter 30 sekunder
        scannerTimeout = setTimeout(() => {
            stopScanner();
            alert('⏱️ Skanning tidsavbrutt. Prøv igjen eller skriv inn manuelt.');
        }, 30000);

    } catch (error) {
        console.error('Feil ved start av kamera:', error);
        if (error.name === 'NotAllowedError') {
            alert('❌ Kamera-tilgang ble nektet. Vennligst gi tillatelse i nettleserinnstillingene.');
        } else if (error.name === 'NotFoundError') {
            alert('❌ Fant ikke kamera. Sørg for at enheten har et kamera.');
        } else {
            alert('❌ Kunne ikke starte kamera. Prøv igjen eller bruk manuell inntasting.');
        }
    }
}

/**
 * Anvend zoom hvis støttet
 */
async function applyZoom() {
    if (!scannerStream) return;

    const track = scannerStream.getVideoTracks()[0];
    const capabilities = track.getCapabilities?.();

    if (capabilities?.zoom) {
        const minZoom = capabilities.zoom.min || 1;
        const maxZoom = capabilities.zoom.max || 3;
        const desiredZoom = Math.min(maxZoom, Math.max(minZoom, 1.8));

        try {
            await track.applyConstraints({
                advanced: [{ zoom: desiredZoom }]
            });
            console.log(`✓ Zoom anvendt: ${desiredZoom}x`);
        } catch (error) {
            console.warn('Kunne ikke anvende zoom:', error);
        }
    } else {
        console.log('ℹ️ Zoom ikke støttet på denne enheten');
    }
}

/**
 * Detekter strekkode kontinuerlig
 */
async function detectBarcode() {
    if (!scannerActive) return;

    try {
        const barcodeDetector = new BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'qr_code']
        });

        const barcodes = await barcodeDetector.detect(scannerVideo);

        if (barcodes.length > 0) {
            const code = barcodes[0].rawValue;
            handleScanSuccess(code);
            return; // Stopp skanning etter første treff
        }
    } catch (error) {
        console.error('Feil ved strekkode-deteksjon:', error);
    }

    // Automatisk gjentagelse er deaktivert – scan kjøres kun på brukertrykk
    // if (scannerActive) {
    //     requestAnimationFrame(detectBarcode);
    // }
}

/**
 * Håndter vellykket skanning
 */
function handleScanSuccess(code) {
    // Vibrasjon på mobil
    if (navigator.vibrate) {
        navigator.vibrate(200);
    }

    // Visuell feedback
    scannerOverlay.classList.add('scan-success');

    setTimeout(() => {
        // Fyll inn artikkelnummer
        document.getElementById('articleNumber').value = code;

        // Lukk kamera
        stopScanner();

        // Flytt fokus til antall-felt
        document.getElementById('quantity').focus();
    }, 300);
}

/**
 * Stopp kamera-skanning
 */
function stopScanner() {
    scannerActive = false;

    // Stopp alle streams
    if (scannerStream) {
        scannerStream.getTracks().forEach(track => track.stop());
        scannerStream = null;
    }

    // Skjul overlay
    scannerOverlay.classList.add('hidden');
    scannerOverlay.classList.remove('scan-success');

    // Clear timeout
    if (scannerTimeout) {
        clearTimeout(scannerTimeout);
        scannerTimeout = null;
    }
}

/**
 * Vis kortvarig feilmelding i overlay uten å lukke kamera
 * @param {string} message - Melding som vises i 2 sekunder
 */
function showScanFeedback(message) {
    const el = document.getElementById('scanFeedback');
    el.textContent = message;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 2000);
}

/**
 * Event listeners for skanner
 */
function initScanner() {
    // Skjul scan-knapp hvis ikke støttet
    if (!isBarcodeDetectorSupported()) {
        if (scanBtn) {
            scanBtn.style.display = 'none';
        }
        return;
    }

    // Start skanning
    if (scanBtn) {
        scanBtn.addEventListener('click', startScanner);
    }

    // Manuell utløser – kjør BarcodeDetector én gang på gjeldende videoframe
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', async () => {
            const detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] });
            try {
                const barcodes = await detector.detect(scannerVideo);
                if (barcodes.length > 0) {
                    handleScanSuccess(barcodes[0].rawValue);
                } else {
                    showScanFeedback('Ingen kode funnet – prøv igjen');
                }
            } catch (err) {
                showScanFeedback('Feil ved lesing – prøv igjen');
            }
        });
    }

    // Lukk skanning
    if (closeScanBtn) {
        closeScanBtn.addEventListener('click', stopScanner);
    }

    // Lukk ved tab-skjuling
    document.addEventListener('visibilitychange', () => {
        if (document.hidden && scannerActive) {
            stopScanner();
        }
    });
}

// Initialiser skanner når DOM er klar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScanner);
} else {
    initScanner();
}
