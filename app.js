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
let scannerTargetField = 'articleNumber'; // felt som fylles ved vellykket skanning

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
        // Fyll inn målfeltet og nullstill til standard
        document.getElementById(scannerTargetField).value = code;
        const wasArticleNumber = scannerTargetField === 'articleNumber';
        scannerTargetField = 'articleNumber';

        stopScanner();

        // Flytt fokus til antall-felt kun ved behovsregistrering
        if (wasArticleNumber) {
            document.getElementById('quantity').focus();
        }
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

/**
 * ========================================
 * FANE-NAVIGASJON
 * ========================================
 */

/**
 * Bytt mellom "behov" og "kartlegging"-fanen
 * @param {'behov'|'kartlegging'} tab
 */
function switchTab(tab) {
    const tabBehov = document.getElementById('tabBehov');
    const tabKartlegging = document.getElementById('tabKartlegging');
    const mappingView = document.getElementById('mappingView');
    const infoBox = document.getElementById('infoBoxBehov');

    if (tab === 'kartlegging') {
        tabBehov.classList.remove('tab-active');
        tabKartlegging.classList.add('tab-active');

        // Skjul behovsvisninger
        startView.classList.add('hidden');
        registrationView.classList.add('hidden');
        infoBox.classList.add('hidden');

        // Vis kartlegging
        mappingView.classList.remove('hidden');
        renderCatalogList();
    } else {
        tabKartlegging.classList.remove('tab-active');
        tabBehov.classList.add('tab-active');

        // Skjul kartlegging
        mappingView.classList.add('hidden');
        infoBox.classList.remove('hidden');

        // Vis korrekt behovsvisning
        if (currentRound) {
            registrationView.classList.remove('hidden');
        } else {
            startView.classList.remove('hidden');
        }
    }
}

/**
 * ========================================
 * ARTIKKELKATALOG
 * ========================================
 */

const CATALOG_KEY = 'articleCatalog';
const STALE_DAYS = 42;
const SHEETJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

/**
 * Last SheetJS dynamisk fra CDN (kun ved behov)
 * @returns {Promise<Object>} XLSX-objektet
 */
function loadSheetJS() {
    return new Promise((resolve, reject) => {
        if (window.XLSX) {
            resolve(window.XLSX);
            return;
        }
        const script = document.createElement('script');
        script.src = SHEETJS_CDN;
        script.onload = () => resolve(window.XLSX);
        script.onerror = () => reject(new Error('Kunne ikke laste SheetJS'));
        document.head.appendChild(script);
    });
}

/**
 * Konverter norsk datoformat DD.MM.YYYY til ISO YYYY-MM-DD
 * @param {string} str
 * @returns {string|null}
 */
function parseNorwegianDate(str) {
    if (!str) return null;
    const s = String(str).trim();
    const match = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    if (match) {
        const [, d, m, y] = match;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    return null;
}

/**
 * Last katalogen fra localStorage
 * @returns {Array}
 */
function loadCatalog() {
    try {
        return JSON.parse(localStorage.getItem(CATALOG_KEY)) || [];
    } catch (e) {
        return [];
    }
}

/**
 * Lagre katalogen til localStorage
 * @param {Array} catalog
 */
function saveCatalog(catalog) {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(catalog));
}

/**
 * Legg til eller oppdater en artikkel i katalogen
 * @param {Object} article - { toolsNr, saNr, ean, description, location }
 */
function upsertCatalogItem(article) {
    const catalog = loadCatalog();
    const today = new Date().toISOString().slice(0, 10);
    const idx = catalog.findIndex(
        c => c.toolsNr.toLowerCase() === article.toolsNr.toLowerCase()
    );

    if (idx >= 0) {
        catalog[idx] = {
            ...catalog[idx],
            saNr: article.saNr,
            ean: article.ean || '',
            description: article.description,
            location: article.location,
            lastSeen: today
        };
    } else {
        catalog.unshift({
            id: Date.now(),
            toolsNr: article.toolsNr,
            saNr: article.saNr,
            ean: article.ean || '',
            description: article.description,
            location: article.location,
            lastSeen: today
        });
    }

    saveCatalog(catalog);
}

/**
 * Slett en artikkel fra katalogen
 * @param {number} id
 */
function deleteCatalogItem(id) {
    if (!confirm('Slett denne artikkelen fra katalogen?')) return;
    const catalog = loadCatalog().filter(c => c.id !== id);
    saveCatalog(catalog);
    renderCatalogList();
}

/**
 * Beregn antall dager siden lastSeen
 * @param {string} lastSeen - ISO dato-streng YYYY-MM-DD
 * @returns {number}
 */
function daysSince(lastSeen) {
    const ms = Date.now() - new Date(lastSeen).getTime();
    return Math.floor(ms / 86400000);
}

/**
 * Renderer kataloglisten med valgfritt søkefilter
 */
function renderCatalogList() {
    const catalog = loadCatalog();
    const search = (document.getElementById('catalogSearch')?.value || '').toLowerCase();
    const listEl = document.getElementById('catalogList');
    const countEl = document.getElementById('catalogCount');

    const filtered = search
        ? catalog.filter(c =>
            c.toolsNr.toLowerCase().includes(search) ||
            (c.saNr || '').toLowerCase().includes(search) ||
            (c.ean || '').toLowerCase().includes(search) ||
            c.description.toLowerCase().includes(search)
          )
        : catalog;

    countEl.textContent = catalog.length;

    if (filtered.length === 0) {
        listEl.innerHTML = `<p class="empty-message">${search ? 'Ingen treff for søket.' : 'Ingen artikler i katalogen ennå.'}</p>`;
        return;
    }

    listEl.innerHTML = filtered.map(item => {
        const days = daysSince(item.lastSeen);
        const isStale = days >= STALE_DAYS;
        const safeId = item.id;
        const safeToolsNr = escapeHtml(item.toolsNr);
        return `
            <div class="catalog-item${isStale ? ' stale' : ''}">
                <div class="catalog-item-header">
                    <div class="catalog-item-title-row">
                        <span class="catalog-item-title">${safeToolsNr}</span>
                        ${item.saNr ? `<span class="catalog-item-sa"> · ${escapeHtml(item.saNr)}</span>` : ''}
                        <button class="catalog-copy-btn" onclick="copyCatalogItem('${safeToolsNr}', this)" title="Kopier Tools-nr">📋 Kopier</button>
                    </div>
                </div>
                <div class="catalog-item-desc">${escapeHtml(item.description)}</div>
                <div class="catalog-item-meta">
                    ${item.location ? `<span>📍 ${escapeHtml(item.location)}</span>` : ''}
                    ${item.ean ? `<span>🔖 EAN: ${escapeHtml(item.ean)}</span>` : ''}
                    <span>👁️ Sist sett: ${escapeHtml(item.lastSeen)}</span>
                </div>
                ${isStale ? `<div class="stale-warning">⚠️ Ikke sett på ${days} dager</div>` : ''}
                <div class="catalog-item-actions">
                    <button class="catalog-delete" onclick="deleteCatalogItem(${safeId})">🗑️ Slett</button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Kopier Tools-nr til utklippstavlen med visuell bekreftelse
 * @param {string} toolsNr
 * @param {HTMLElement} btn
 */
function copyCatalogItem(toolsNr, btn) {
    navigator.clipboard.writeText(toolsNr).then(() => {
        const original = btn.textContent;
        btn.textContent = '✓ Kopiert!';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = original;
            btn.disabled = false;
        }, 1500);
    }).catch(() => {
        alert('Kopiering ikke støttet i denne nettleseren.');
    });
}

/**
 * Eksporter katalogen som semikolondelt CSV med BOM
 */
function exportCatalog() {
    const catalog = loadCatalog();
    if (catalog.length === 0) {
        alert('Katalogen er tom – ingenting å eksportere.');
        return;
    }

    const headers = ['tools_nr', 'sa_nr', 'ean', 'beskrivelse', 'lokasjon', 'sist_sett'];
    const rows = catalog.map(c => [
        escapeCSV(c.toolsNr),
        escapeCSV(c.saNr || ''),
        escapeCSV(c.ean || ''),
        escapeCSV(c.description),
        escapeCSV(c.location || ''),
        escapeCSV(c.lastSeen)
    ].join(';'));

    const csvContent = [headers.join(';'), ...rows].join('\n');
    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(csvContent, `artikkelkatalog_${today}.csv`);
}

/**
 * Importer Jeeves kjøpshistorikk fra Excel (.xlsx)
 * Ark "Oversikt" hoppes over; alle andre ark er lokasjonsark.
 * Første 4 rader per ark hoppes over (tittel, blank, blank, kolonneheader).
 * Kolonner: Leveringssted | SA-nummer | Art.nr (Tools) | Artikkelnavn | Antall kjøp | Siste kjøp | Total antall
 * Rader uten SA-nummer hoppes over og telles.
 * @param {File} file
 */
async function importJeevesExcel(file) {
    let XLSX;
    try {
        XLSX = await loadSheetJS();
    } catch (err) {
        alert('Kunne ikke laste Excel-biblioteket. Sjekk internettforbindelsen og prøv igjen.');
        return;
    }

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: false });
    const catalog = loadCatalog();
    const today = new Date().toISOString().slice(0, 10);
    let added = 0, updated = 0, skipped = 0;

    for (const sheetName of workbook.SheetNames) {
        if (sheetName.trim().toLowerCase() === 'oversikt') continue;

        const sheet = workbook.Sheets[sheetName];
        // Les alle rader som arrays (tom celle = '')
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

        // Hopp over de 4 første radene (tittel, blank, blank, kolonneheader)
        for (let i = 4; i < rows.length; i++) {
            const row = rows[i];

            // Kolonner (0-indeksert):
            // 0: Leveringssted, 1: SA-nummer, 2: Art.nr (Tools),
            // 3: Artikkelnavn,  4: Antall kjøp, 5: Siste kjøp, 6: Total antall
            const leveringssted = String(row[0] || '').trim();
            const saNr         = String(row[1] || '').trim();
            const toolsNr      = String(row[2] || '').trim();
            const artikkelnavn  = String(row[3] || '').trim();
            const sisteKjøpRaw = row[5];

            // Rader uten SA-nummer hoppes over
            if (!saNr) { skipped++; continue; }
            // Rader uten Tools-nr hoppes over stille (ubrukelig nøkkel)
            if (!toolsNr) { skipped++; continue; }

            // Konverter dato
            const isoDate = parseNorwegianDate(String(sisteKjøpRaw || '')) || today;

            const newItem = {
                toolsNr,
                saNr,
                description: artikkelnavn,
                location: leveringssted,
                lastSeen: isoDate
            };

            const idx = catalog.findIndex(
                c => c.toolsNr.toLowerCase() === toolsNr.toLowerCase()
            );
            if (idx >= 0) {
                catalog[idx] = { ...catalog[idx], ...newItem };
                updated++;
            } else {
                catalog.unshift({ id: Date.now() + Math.random(), ...newItem });
                added++;
            }
        }
    }

    saveCatalog(catalog);
    renderCatalogList();
    alert(`Import fullført: ${added} nye artikler lagt til, ${updated} oppdatert, ${skipped} hoppet over (mangler SA-nr).`);
}

/**
 * Tøm hele katalogen (med bekreftelse)
 */
function clearCatalog() {
    const catalog = loadCatalog();
    if (catalog.length === 0) {
        alert('Katalogen er allerede tom.');
        return;
    }
    if (confirm(`Er du sikker på at du vil slette alle ${catalog.length} artikler fra katalogen? Dette kan ikke angres.`)) {
        saveCatalog([]);
        renderCatalogList();
    }
}

/**
 * Importer katalog fra CSV-fil (merger inn, Tools-nr som nøkkel)
 * @param {File} file
 */
function importCatalog(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result.replace(/^\uFEFF/, ''); // fjern BOM
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
            alert('CSV-filen er tom eller ugyldig.');
            return;
        }

        // Auto-detect delimiter fra første linje
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';

        const headerLine = firstLine.split(delimiter).map(h => h.trim().toLowerCase());
        const colToolsNr = headerLine.indexOf('tools_nr');
        const colSaNr = headerLine.indexOf('sa_nr');
        const colEan = headerLine.indexOf('ean');
        const colDesc = headerLine.indexOf('beskrivelse');
        const colLoc = headerLine.indexOf('lokasjon');
        const colLastSeen = headerLine.indexOf('sist_sett');

        if (colToolsNr === -1 || colDesc === -1) {
            alert('Filen mangler påkrevde kolonner (tools_nr, beskrivelse).');
            return;
        }

        const catalog = loadCatalog();
        const today = new Date().toISOString().slice(0, 10);
        let added = 0, updated = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = splitCSVLine(lines[i], delimiter);
            const toolsNr = (cols[colToolsNr] || '').trim();
            if (!toolsNr) continue;

            const newItem = {
                toolsNr,
                saNr: colSaNr >= 0 ? (cols[colSaNr] || '').trim() : '',
                ean: colEan >= 0 ? (cols[colEan] || '').trim() : '',
                description: colDesc >= 0 ? (cols[colDesc] || '').trim() : '',
                location: colLoc >= 0 ? (cols[colLoc] || '').trim() : '',
                lastSeen: colLastSeen >= 0 && cols[colLastSeen]?.trim()
                    ? cols[colLastSeen].trim()
                    : today
            };

            const idx = catalog.findIndex(c => c.toolsNr.toLowerCase() === toolsNr.toLowerCase());
            if (idx >= 0) {
                catalog[idx] = { ...catalog[idx], ...newItem };
                updated++;
            } else {
                catalog.unshift({ id: Date.now() + i, ...newItem });
                added++;
            }
        }

        saveCatalog(catalog);
        renderCatalogList();
        alert(`Import fullført: ${added} nye artikler lagt til, ${updated} oppdatert.`);
    };
    reader.readAsText(file, 'UTF-8');
}

/**
 * Del opp en CSV-linje med støtte for anførselstegn
 * @param {string} line
 * @param {string} delimiter
 * @returns {string[]}
 */
function splitCSVLine(line, delimiter) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}

/**
 * ========================================
 * AUTOCOMPLETE FOR ARTIKKELNUMMER
 * ========================================
 */

function initAutocomplete() {
    const input = document.getElementById('articleNumber');
    const listEl = document.getElementById('autocompleteList');
    if (!input || !listEl) return;

    input.addEventListener('input', function () {
        const val = this.value.trim().toLowerCase();
        if (val.length < 2) {
            listEl.classList.add('hidden');
            return;
        }

        const catalog = loadCatalog();

        // Eksakt EAN-treff: fyll inn toolsNr direkte uten å vise dropdown
        const eanExact = catalog.find(c => (c.ean || '').toLowerCase() === val);
        if (eanExact) {
            input.value = eanExact.toolsNr;
            listEl.classList.add('hidden');
            return;
        }

        const matches = catalog
            .filter(c =>
                c.toolsNr.toLowerCase().includes(val) ||
                (c.saNr || '').toLowerCase().includes(val) ||
                (c.ean || '').toLowerCase().includes(val)
            )
            .slice(0, 5);

        if (matches.length === 0) {
            listEl.classList.add('hidden');
            return;
        }

        listEl.innerHTML = matches.map(c => `
            <div class="autocomplete-item" data-value="${escapeHtml(c.toolsNr)}">
                <strong>${escapeHtml(c.toolsNr)}</strong>
                ${c.saNr ? ` · ${escapeHtml(c.saNr)}` : ''}
                <span style="color:#888; font-size:0.85rem"> — ${escapeHtml(c.description)}</span>
            </div>
        `).join('');
        listEl.classList.remove('hidden');

        listEl.querySelectorAll('.autocomplete-item').forEach(item => {
            item.addEventListener('mousedown', function (e) {
                e.preventDefault(); // forhindre blur
                input.value = this.dataset.value;
                listEl.classList.add('hidden');
                input.focus();
            });
        });
    });

    input.addEventListener('blur', function () {
        // Liten forsinkelse slik at mousedown på forslag rekker å kjøre
        setTimeout(() => listEl.classList.add('hidden'), 150);
    });

    input.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            listEl.classList.add('hidden');
        }
    });
}

/**
 * ========================================
 * INITIALISERING AV KATALOG
 * ========================================
 */

function initCatalog() {
    // Katalog-skjema
    const catalogForm = document.getElementById('catalogForm');
    if (catalogForm) {
        catalogForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const locSelect = document.getElementById('catLocation');
            const location = locSelect.value === '__custom__'
                ? document.getElementById('catLocationCustom').value.trim()
                : locSelect.value;

            upsertCatalogItem({
                toolsNr: document.getElementById('catToolsNr').value.trim(),
                saNr: document.getElementById('catSaNr').value.trim(),
                ean: document.getElementById('catEanNr').value.trim(),
                description: document.getElementById('catDescription').value.trim(),
                location
            });

            catalogForm.reset();
            document.getElementById('catLocationCustom').style.display = 'none';
            renderCatalogList();
            document.getElementById('catToolsNr').focus();
        });
    }

    // EAN-skanner for katalogskjema
    const catScanBtn = document.getElementById('catScanBtn');
    if (catScanBtn) {
        if (!isBarcodeDetectorSupported()) {
            catScanBtn.style.display = 'none';
        } else {
            catScanBtn.addEventListener('click', () => {
                scannerTargetField = 'catEanNr';
                startScanner();
            });
        }
    }

    // Lokasjon custom i katalogskjema
    const catLocSelect = document.getElementById('catLocation');
    if (catLocSelect) {
        catLocSelect.addEventListener('change', function () {
            const custom = document.getElementById('catLocationCustom');
            if (this.value === '__custom__') {
                custom.style.display = 'block';
                custom.required = true;
            } else {
                custom.style.display = 'none';
                custom.required = false;
                custom.value = '';
            }
        });
    }

    // Søk i katalog
    const searchEl = document.getElementById('catalogSearch');
    if (searchEl) {
        searchEl.addEventListener('input', renderCatalogList);
    }

    // Eksport
    const exportBtn = document.getElementById('exportCatalogBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCatalog);
    }

    // Import Jeeves Excel
    const importJeevesBtn = document.getElementById('importJeevesBtn');
    const importJeevesFile = document.getElementById('importJeevesFile');
    if (importJeevesBtn && importJeevesFile) {
        importJeevesBtn.addEventListener('click', () => importJeevesFile.click());
        importJeevesFile.addEventListener('change', function () {
            if (this.files[0]) {
                importJeevesExcel(this.files[0]);
                this.value = '';
            }
        });
    }

    // Import CSV
    const importCatalogBtn = document.getElementById('importCatalogBtn');
    const importFile = document.getElementById('importCatalogFile');
    if (importCatalogBtn && importFile) {
        importCatalogBtn.addEventListener('click', () => importFile.click());
        importFile.addEventListener('change', function () {
            if (this.files[0]) {
                importCatalog(this.files[0]);
                this.value = '';
            }
        });
    }

    // Tøm katalogen
    const clearBtn = document.getElementById('clearCatalogBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCatalog);
    }

    // Autocomplete
    initAutocomplete();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCatalog);
} else {
    initCatalog();
}
