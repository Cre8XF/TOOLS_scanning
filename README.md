# 🛠️ Lagerkontroll - Etterfyllingsregistrering

Et enkelt, frittstående webverktøy for å registrere behov observert ved fysisk lagergjennomgang.

## 🎯 Formål

Dette verktøyet er designet for å registrere **behov** (ikke lagerbeholdning) under en fysisk lagergjennomgang på én lokasjon. Dataene eksporteres til CSV for videre behandling.

**Viktig:** Dette er registrert behov – ikke lagerbeholdning.

## ✨ Funksjoner

- **Offline-first**: Fungerer uten internettforbindelse (bruker localStorage)
- **Mobilvennlig**: Responsivt design som fungerer på alle enheter
- **Enkelt grensesnitt**: Lett å bruke under lagergjennomgang
- **CSV-eksport**: Enkelt å importere data i andre systemer
- **Automatisk metadata**: Dato og uke legges til automatisk

## 🚀 Komme i gang

### Installasjon

1. Last ned alle filene til en mappe på din enhet:
   - `index.html`
   - `style.css`
   - `app.js`

2. Åpne `index.html` i en nettleser (Chrome, Firefox, Safari, Edge)

Det er ingen avhengigheter eller serveroppsett nødvendig. Alt kjører lokalt i nettleseren.

### Bruk på mobil

For best mobilopplevelse:
- Legg til som app på hjemskjermen (iOS: Dele → Legg til på hjemskjerm)
- Åpne i fullskjerm for enklere bruk under lagergjennomgang
- Verktøyet fungerer offline etter første lasting

## 📖 Bruksanvisning

### 1️⃣ Start en ny runde

Når du åpner verktøyet, fyller du ut startskjemaet:

- **Lokasjon** * (obligatorisk): F.eks. "Lager A", "Verksted 2"
- **Avdeling** (valgfritt): F.eks. "Tools Molde"
- **CSV-filnavn** * (obligatorisk): Grunnlag for filnavnet, f.eks. "etterfylling"
- **Registrert av** (valgfritt): Ditt navn

Klikk **Start runde** for å begynne registreringen.

### 2️⃣ Registrer artikler

For hver artikkel du ønsker å registrere:

1. Skriv inn eller skann **Artikkelnummer**
2. Angi **Antall** (standard = 1)
3. Legg til **Kommentar** hvis nødvendig (valgfritt)
4. Klikk **Legg til**

Artikkelen legges til listen, og skjemaet tømmes automatisk for neste registrering.

**Tips:** Fokuset går automatisk tilbake til artikkelnummer-feltet for rask registrering.

### 3️⃣ Administrer linjer

- **Se alle linjer**: Registrerte linjer vises fortløpende under skjemaet
- **Slett linje**: Klikk på 🗑️ Slett-knappen på linjen du vil fjerne
- **Antall linjer**: Vises øverst i listen

### 4️⃣ Avslutt runde

Når du er ferdig med lagergjennomgangen:

1. Klikk **Avslutt runde og eksporter**
2. Bekreft eksporten
3. CSV-filen lastes ned automatisk til din enhet

**Filnavnformat:** `<csv-filnavn>_<lokasjon>_<YYYY-MM-DD>.csv`

Eksempel: `etterfylling_LagerA_2026-01-23.csv`

### 5️⃣ Avbryte eller starte på nytt

Hvis du vil avbryte den pågående runden:

1. Klikk **Slett runde / start på nytt**
2. Bekreft at du vil slette alle data
3. Du kommer tilbake til startskjemaet

**Advarsel:** Alle ulagrede linjer går tapt ved avbrudd!

## 📊 CSV-format

Eksporterte CSV-filer inneholder følgende kolonner:

| Kolonne | Beskrivelse | Eksempel |
|---------|-------------|----------|
| `dato` | Registreringsdato (YYYY-MM-DD) | 2026-01-23 |
| `uke` | ISO-ukenummer | 4 |
| `lokasjon` | Lokasjon angitt ved start | Lager A |
| `avdeling` | Avdeling angitt ved start | Tools Molde |
| `artikkelnummer` | Artikkelnummer | ABC-123 |
| `antall` | Antall enheter | 5 |
| `kommentar` | Valgfri kommentar | Kritisk lav |
| `registrert_av` | Person som registrerte | Ola Nordmann |

CSV-filen bruker UTF-8-encoding med BOM for kompatibilitet med Excel.

## 💾 Datalagring

- **localStorage**: Data lagres lokalt i nettleseren under en pågående runde
- **Automatisk gjenoppretting**: Hvis du lukker nettleseren under en runde, gjenopptas den automatisk ved neste åpning
- **Privacy**: Ingen data sendes til servere – alt er lokalt

### Slette lagrede data

For å slette lagrede data manuelt:

1. Åpne nettleserens utviklerverktøy (F12)
2. Gå til "Application" / "Storage"
3. Finn "Local Storage" → velg siden
4. Slett `currentRound`

Eller bruk "Slett runde / start på nytt"-knappen i appen.

## 📷 Strekkode-skanning

### Støttede metoder

1. **Kamera-skanning** (Chrome/Android anbefalt)
   - Trykk på "📷 Skann"-knappen ved artikkelfeltet
   - Pek kamera mot strekkode eller QR-kode
   - Koden registreres automatisk ved vellykket skanning
   - Støtter: EAN-13, EAN-8, Code 128, QR-koder

2. **USB/Bluetooth-skanner**
   - Koble til skanneren som vanlig
   - Skann direkte inn i artikkelfeltet
   - Fungerer som et vanlig tastatur

3. **Manuell inntasting**
   - Skriv inn artikkelnummer for hånd
   - Alltid tilgjengelig som backup

### Kamera-funksjonalitet

- **Automatisk zoom**: Kamera starter lett innzoomet (1.8x) for bedre lesbarhet
- **Timeout**: Kamera lukkes automatisk etter 30 sekunder uten treff
- **Feedback**: Vibrasjon og visuell bekreftelse ved vellykket skanning
- **Offline**: Fungerer uten internett etter første lasting

### Nettleserstøtte for kamera

| Nettleser | Støtte | Kommentar |
|-----------|--------|-----------|
| Chrome Android | ✅ Anbefalt | Full støtte inkl. zoom |
| Chrome Desktop | ✅ God | Krever webkamera |
| Safari iOS | ⚠️ Begrenset | Fungerer, men uten zoom |
| Firefox Android | ✅ God | Full støtte |
| Edge Desktop | ✅ God | Krever webkamera |

**Tips:** Hvis kamera-skanning ikke fungerer på din enhet, bruk USB-skanner eller manuell inntasting.

## 🔧 Teknisk informasjon

### Teknologi

- **HTML5**: Semantisk markup
- **CSS3**: Responsivt design med Flexbox/Grid
- **Vanilla JavaScript**: Ingen rammeverk eller avhengigheter
- **LocalStorage API**: Offline-lagring

### Nettleserstøtte

Verktøyet fungerer i alle moderne nettlesere:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Android)

### Filstruktur

```
lagerkontroll/
├── index.html      # Hovedside med HTML-struktur
├── style.css       # All styling og responsivt design
├── app.js          # All funksjonalitet og logikk
└── README.md       # Denne filen
```

## ❓ Vanlige spørsmål

**Q: Kan jeg bruke verktøyet uten internett?**
A: Ja! Etter første lasting fungerer verktøyet helt offline.

**Q: Hva skjer hvis jeg lukker nettleseren midt i en runde?**
A: Data lagres automatisk i localStorage. Åpne siden igjen, så fortsetter runden der du slapp.

**Q: Kan jeg redigere en linje etter at den er lagt til?**
A: Nei, men du kan slette linjen og legge den til på nytt med korrigerte verdier.

**Q: Støttes strekkodeskanning?**
A: Ja, bruk en USB/Bluetooth-strekkodeskanner eller mobilens kamera (avhengig av enhet). Skanneren vil fylle inn artikkelnummer-feltet automatisk.

**Q: Kan jeg ha flere runder samtidig?**
A: Nei, kun én aktiv runde om gangen. Du må avslutte eller avbryte gjeldende runde før du starter en ny.

**Q: Hvor kan jeg importere CSV-filen?**
A: CSV-filen kan importeres i Excel, Google Sheets, ERP-systemer eller andre verktøy som støtter CSV-import.

## 🛡️ Sikkerhet

- Ingen datainnsamling eller tracking
- Ingen eksterne API-kall
- All data lagres lokalt i nettleseren
- Ingen server-side kode
- XSS-beskyttelse gjennom HTML-escaping

## 📝 Lisens

Fri bruk for interne formål hos Tools-avdelinger.

## 🆘 Support

Ved spørsmål eller problemer, kontakt din IT-avdeling eller utvikler.

---

**Utviklet for Tools-avdelinger | Versjon 1.0 | Januar 2026**
