import { extractRawHtml, decodeEmailBody } from '../utils/email';
import AIRPORTS_DATABASE from '../data/airports';

// ─── Airport validation ──────────────────────────────────────────────────────

const AIRPORT_CODE_SET = new Set(AIRPORTS_DATABASE.map(a => a.code));

// Extra known airports not yet in the local DB (safety net)
const EXTRA_IATA = new Set([
  // North America
  'JFK','LGA','EWR','LAX','SFO','ORD','MDW','ATL','DFW','DEN','SEA','PHX','MIA','FLL','MCO',
  'BOS','IAD','DCA','BWI','PHL','MSP','DTW','CLT','LAS','SAN','SJC','OAK','PDX','IAH','HOU',
  'AUS','SLC','TPA','HNL','ANC','YYZ','YVR','YUL','YYC','MEX','CUN','GDL','MTY',
  // Europe
  'LHR','LGW','STN','LTN','LCY','MAN','BHX','EDI','GLA','BRS','BHD',
  'CDG','ORY','NCE','LYS','MRS','TLS','BOD','NTE',
  'FRA','MUC','BER','DUS','HAM','CGN','STR','NUE','HAJ',
  'AMS','BRU','ZRH','GVA','VIE','PRG','WAW','KRK','BUD','OTP','SOF','SKP',
  'FCO','CIA','MXP','LIN','BGY','VCE','TSF','NAP','BLQ','CTA','PSA','PMO','BRI','GOA','TRN','CAG',
  'MAD','BCN','PMI','AGP','VLC','SVQ','BIO','IBZ',
  'LIS','OPO','FAO','ATH','HER','SKG','IST','SAW','ESB','ADB',
  'DUB','SNN','CPH','OSL','TRF','ARN','GOT','HEL','TMP','RVN',
  'SVO','DME','LED','KZN','SVX',
  'BEG','ZAG','LJU','DBV',
  // Middle East
  'DXB','DWC','AUH','SHJ','DOH','KWI','BAH','MCT','SLL','ADE',
  'TLV','BEY','AMM','BGW','IKA','THR','MHD','SYZ','RUH','JED','DMM','MED','AHB',
  // Asia
  'SIN','KUL','LGK','PEN','BKK','DMK','HKT','CNX','USM','HKG','MFM',
  'TPE','TSA','NRT','HND','KIX','CTS','OKA','NGO','ICN','GMP','PUS',
  'PEK','PKX','PVG','SHA','CAN','SZX','CTU','KMG','CSX','WUH','XIY',
  'HAN','SGN','DAD','PQC','RGN','MDL','BKI','KCH','PEN',
  'DEL','BOM','BLR','MAA','CCU','HYD','COK','AMD','JAI','GOI','PAT','LKO','IXC',
  'CMB','HRI','KTM','DAC','CGP','RGN','MNL','CEB','DVO','ILO',
  'CGK','SUB','DPS','UPG','PLM','SOC','BPN',
  'PNH','REP','VTE','RGN',
  // Oceania
  'SYD','MEL','BNE','PER','ADL','OOL','CBR','TSV','CNS','AKL','CHC','WLG','ZQN',
  // South America
  'GRU','CGH','GIG','SDU','EZE','AEP','SCL','PMC','LIM','CUZ','BOG','MDE','CLO','GYE','UIO',
  'CCS','PTY','SJO','GUA','SAL','MGA','TGU','BZE','HAV','SDQ','SJU','AUA','CUR',
  // Africa
  'JNB','HLA','CPT','PLZ','DUR','NBO','MBA','ADD','ACC','ABV','LOS','KAN','PHC',
  'DKR','ABJ','ACC','LFW','OUA','BKO','NIM','LOS','CBQ','PHC',
  'DAR','ZNZ','EBB','KGL','JRO','HAH','MRU','SEZ',
  'CMN','RAK','FEZ','TNG','ALG','TUN','SFA','TLM',
  'CAI','HRG','SSH','LXR','ASW','KRT','ADD',
  'MPM','LAD','DLA','NSI','LBV','BZV','FBM','HRE','BUQ','WVB',
]);

const isValidAirportCode = (code) =>
  AIRPORT_CODE_SET.has(code) || EXTRA_IATA.has(code);

// Codes that must never be treated as airports
const EXCLUDE_CODES = new Set([
  'THE','AND','FOR','ARE','BUT','NOT','YOU','ALL','CAN','HAS','WAS','ONE','OUR','OUT',
  'DAY','GET','HIM','HIS','HOW','ITS','MAY','NEW','NOW','OLD','SEE','TWO','WHO','WAY',
  'ANY','FEW','GOT','HER','LET','PUT','SAY','SHE','TOO','USE','AGO','BIG','END','FAR',
  'MAN','OWN','RUN','SET','TOP','TRY','WHY','YES','YET','ADD','AIR','BAD','BAG',
  'BED','BOX','BOY','BUS','BUY','CAR','CUT','DID','DOG','EAT','EYE','FUN','GAS','HAD',
  'HAT','HIT','HOT','ICE','JOB','KEY','KID','LAW','LAY','LED','LOT','LOW','MAP','MEN',
  'MET','MIX','OIL','PAY','PER','PIE','POP','RAN','RAW','RED','SIT','SIX','SKY',
  'SON','SUM','TAX','TEA','TEN','TIP','VAN','WAR','WET','WIN','WON','YEA',
  'FRI','SAT','SUN','MON','TUE','WED','THU','JAN','FEB','MAR','APR','JUN','JUL',
  'AUG','SEP','OCT','NOV','DEC',
  'USD','EUR','GBP','CAD','AUD','JPY','CNY','INR','KRW','MXN','BRL','CHF','SEK','NOK',
  'DKK','NZD','SGD','HKD','TWD','THB','MYR','PHP','IDR','VND','PLN','CZK','HUF','RUB',
  'ZAR','AED','SAR','ILS','EGP','QAR','KWD','BHD','OMR','JOD','TRY',
  'LBS','OZS','KGS','GMS','MLS','QTS','PTS','GLS',
  'PDF','APP','WWW','COM','ORG','NET','GOV','EDU','MIL','BIZ','HTML','CSS','XML',
  'API','URL','SSL','VPN','DNS','FTP','SQL','PHP','JSP','ASP','DOC','XLS','PPT','ZIP',
  'RAR','TAR','GIF','PNG','JPG','SVG','BMP','TXT','CSV','LOG','BAK','TMP','EXE','DLL',
  'SYS','BAT','CMD','REG','INI','CFG','DAT','BIN','ISO','IMG','DMG','APK','IPA',
  'EST','PST','CST','MST','GMT','UTC','EDT','PDT','CDT','MDT','BST','CET','EET','JST',
  'KST','IST','ICT','PKT','HKT','SGT','AEDT','AEST',
  'INC','LLC','LTD','PLC','LLP','CEO','CFO','COO','CTO','CIO','CMO',
  'EVP','SVP','AVP','MGR','DIR','REP','REF','FAQ','TBD','TBA','ETA','ETD','ROI','KPI',
  'SLA','NDA','MOU','LOI','RFP','RFQ','POC','MVP','UAT',
  'FWD','BCC','EOM','EOD','EOY','YTD','FYI','BTW','IMO','TBH','IDK','OMG','LOL','THX',
  'VIP','TSA','CBP','ICE','DHS','DOT','FAA','CAA','PNR','SSR','OSI',
  'RES','CNF','CNL','CHG','ADV','ACK','REQ','TKT','EMD','PTA','ITN',
  'NON','OFF','PRO','VIA','MAX','MIN','AVG','TOT','SUB','DEL','UPD',
  'FIX','BUG','SRC','DST','OBJ','ARR','DEP','RET','ALT','OPT',
  // Common false positives from city-name abbreviations
  'LOS','LAS','SAN','NEW','OLD','BAY',
]);

// Month name → 2-digit number
const MONTH_MAP = {
  jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
  jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
  january:'01',february:'02',march:'03',april:'04',june:'06',
  july:'07',august:'08',september:'09',october:'10',november:'11',december:'12',
};

// ─── Phase 1 helpers ─────────────────────────────────────────────────────────

const AIRLINE_DOMAINS = {
  'united.com':'United Airlines','delta.com':'Delta Air Lines','aa.com':'American Airlines',
  'southwest.com':'Southwest Airlines','jetblue.com':'JetBlue','alaskaair.com':'Alaska Airlines',
  'britishairways.com':'British Airways','lufthansa.com':'Lufthansa','airfrance.com':'Air France',
  'klm.com':'KLM','emirates.com':'Emirates','qatarairways.com':'Qatar Airways',
  'singaporeair.com':'Singapore Airlines','cathaypacific.com':'Cathay Pacific',
  'turkishairlines.com':'Turkish Airlines','thy.com':'Turkish Airlines',
  'aircanada.com':'Air Canada','qantas.com':'Qantas','iberia.com':'Iberia',
  'vueling.com':'Vueling','tap.pt':'TAP Air Portugal','ana.co.jp':'ANA',
  'jal.com':'Japan Airlines','thaiairways.com':'Thai Airways','koreanair.com':'Korean Air',
  'evaair.com':'EVA Air','virginatlantic.com':'Virgin Atlantic','swiss.com':'Swiss',
  'austrian.com':'Austrian','finnair.com':'Finnair','sas.se':'SAS',
  'ryanair.com':'Ryanair','easyjet.com':'easyJet','wizzair.com':'Wizz Air',
  'spirit.com':'Spirit Airlines','flyfrontier.com':'Frontier Airlines',
  'norwegian.com':'Norwegian','flypgs.com':'Pegasus Airlines',
  'pegasusairlines.com':'Pegasus Airlines','sunexpress.com':'SunExpress',
  'flypeach.com':'Peach Aviation','airasia.com':'AirAsia','lionair.co.id':'Lion Air',
  'ethiopianairlines.com':'Ethiopian Airlines','egyptair.com':'EgyptAir',
  'saudia.com':'Saudia','airarabia.com':'Air Arabia','flydubai.com':'flydubai',
  'flynas.com':'flynas','goindigo.in':'IndiGo','airindigo.com':'IndiGo',
  'airindia.in':'Air India','spicejet.com':'SpiceJet','vistara.com':'Vistara',
  'aeromexico.com':'Aeroméxico','copaair.com':'Copa Airlines',
  'avianca.com':'Avianca','latam.com':'LATAM','tam.com.br':'LATAM Brasil',
  'gol.com':'GOL','azul.com.br':'Azul','aeroflot.ru':'Aeroflot',
  'transavia.com':'Transavia','volotea.com':'Volotea','eurowings.com':'Eurowings',
  'brusselsairlines.com':'Brussels Airlines','lot.com':'LOT Polish Airlines',
  'airserbia.com':'Air Serbia','airmalta.com':'Air Malta','aegeanair.com':'Aegean Airlines',
  'silkair.com':'SilkAir','kenyanairways.com':'Kenya Airways',
  'airnewzealand.com':'Air New Zealand','garuda-indonesia.com':'Garuda Indonesia',
  'expedia.com':'','booking.com':'','kayak.com':'','priceline.com':'','orbitz.com':'',
  'travelocity.com':'','tripadvisor.com':'','edreams.com':'','opodo.com':'',
  'lastminute.com':'','gotogate.com':'','volagratis.com':'','bravofly.com':'',
  'skyscanner.com':'','momondo.com':'','travelport.com':'','amadeus.com':'',
};

// Airline name patterns for body-text detection (catches emails from OTAs / forwarded bookings)
const AIRLINE_NAME_RE = /\b(united airlines?|delta air lines?|american airlines?|southwest|jetblue|alaska airlines?|british airways?|lufthansa|air france|klm|emirates|qatar airways?|singapore airlines?|cathay pacific|turkish airlines?|air canada|qantas|iberia|vueling|tap air|tap portugal|swiss|austrian|finnair|scandinavian|norwegian|ryanair|easyjet|wizz air|wizz|spirit airlines?|frontier airlines?|pegasus|flypgs|peach aviation|airasia|air asia|lion air|ethiopian airlines?|egypt\s*air|saudia|air arabia|flydubai|flynas|indigo|air india|spicejet|vistara|aerom[eé]xico|copa airlines?|avianca|latam|gol|azul|aeroflot|transavia|volotea|eurowings|brussels airlines?|lot polish|air serbia|air malta|aegean|sunexpress|garuda|kenya airways?|south african|thai airways?|malaysia airlines?|vietnam airlines?|china eastern|china southern|air china|japan airlines?|all nippon|flydubai|middle east airlines?|royal jordanian|oman air|gulf air|etihad)/i;

// Broad flight-email keywords (any one of these is enough to flag an email for parsing)
const FLIGHT_KEYWORDS_RE = /\b(e-?ticket|eticket|itinerary|boarding\s*pass|flight\s+confirm|booking\s+confirm|trip\s+confirm|check-?in|your\s+flight|your\s+trip|reservation|confirmation|ticket\s+number|booking\s+ref|booking\s+reference|passenger\s+name|flight\s+number|departure\s+date|departure\s+time|pnr|locator|reservation\s+number|travel\s+itinerary|flight\s+receipt|travel\s+confirmation)\b/i;

// ─── Phase 2 helpers ─────────────────────────────────────────────────────────

// Returns true if code appears as a standalone token (not flanked by other uppercase letters)
// This prevents matching "LOS" from "LOS ANGELES" or "SAN" from "SAN FRANCISCO"
const isStandaloneCode = (text, matchIndex, code) => {
  const before = text[matchIndex - 1];
  const after = text[matchIndex + code.length];
  const flankedLeft = before && /[A-Z]/.test(before);
  const flankedRight = after && /[A-Z]/.test(after);
  return !flankedLeft && !flankedRight;
};

const isGoodCode = (code) =>
  isValidAirportCode(code) && !EXCLUDE_CODES.has(code);

// ─── Aircraft detection ───────────────────────────────────────────────────────

// Normalise a raw aircraft string to a clean display name
const normaliseAircraft = (raw) => {
  if (!raw) return '';
  // Strip fare/booking-class suffixes (e.g. "A340-600FARE" → "A340-600")
  // No word-boundary anchors: FARE is never a valid part of any aircraft name
  const s = raw.trim().replace(/FARE/gi, '').replace(/\s+/g, ' ').trim();
  // Airbus: "AIRBUS INDUSTRIE A380-800" → "Airbus A380-800"
  let m = s.match(/airbus\s+(?:industrie\s+)?a?\s*(3\d{2}[a-z0-9\-]*(?:neo|ceo|xwb|lr|er|f)?)/i);
  if (m) return 'Airbus A' + m[1].toUpperCase();
  // Boeing: "BOEING B777-200LR" → "Boeing 777-200LR"
  m = s.match(/boeing\s+b?\s*(7\d{2}[a-z0-9\-]*)/i);
  if (m) return 'Boeing ' + m[1].toUpperCase();
  // Short Airbus codes: "A320", "A380-800", "A321neo"
  m = s.match(/\b(A3\d{2}[a-z0-9\-]*(?:neo|ceo|xwb)?)\b/i);
  if (m) return 'Airbus ' + m[1].toUpperCase();
  // Short Boeing codes: "B737", "B777-300ER"
  m = s.match(/\b(B7\d{2}[a-z0-9\-]*)\b/i);
  if (m) return 'Boeing ' + m[1].toUpperCase();
  // Embraer: "Embraer 190", "E190", "ERJ 145"
  m = s.match(/embraer\s+e?\s*(1\d{2}[a-z0-9\-]*)/i);
  if (m) return 'Embraer ' + m[1];
  m = s.match(/\b(E[12]\d{2}[a-z]?)\b/i);
  if (m) return 'Embraer ' + m[1].toUpperCase();
  // Bombardier CRJ / Dash 8 / Q series
  m = s.match(/\b(CRJ[\s\-]?\d{3}[a-z]*)\b/i);
  if (m) return m[1].replace(/\s/, '-').toUpperCase();
  m = s.match(/\b(Q\s*\d{3}|Dash\s*8[\s\-]\d{3})\b/i);
  if (m) return m[1];
  // ATR
  m = s.match(/\b(ATR[\s\-]?\d{2})\b/i);
  if (m) return m[1].replace(/\s/, '-').toUpperCase();
  return '';
};

// Extract all aircraft type mentions from text, in document order (allows duplicates)
const extractAllAircraftTypes = (text) => {
  const hits = []; // { pos, type }
  const addHit = (re, transform) => {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      const type = transform(m);
      if (type) hits.push({ pos: m.index, type });
    }
  };

  addHit(/\bboeing\s+b?\s*(7\d{2}[a-z0-9\-]*)/gi,     m => 'Boeing '   + m[1].toUpperCase());
  addHit(/\bairbus\s+(?:industrie\s+)?a?\s*(3\d{2}[a-z0-9\-]*(?:neo|ceo|xwb|lr|er|f)?)/gi,
                                                         m => 'Airbus A'  + m[1].toUpperCase());
  addHit(/\bembraer\s+e?\s*(1\d{2}[a-z0-9\-]*)/gi,     m => 'Embraer '  + m[1]);
  addHit(/\b(CRJ[\s\-]?\d{3}[a-z]*)\b/gi,              m => m[1].replace(/\s/,'-').toUpperCase());
  addHit(/\b(ATR[\s\-]?\d{2})\b/gi,                    m => m[1].replace(/\s/,'-').toUpperCase());

  // If no full-name matches, try short codes
  if (hits.length === 0) {
    addHit(/\b(A3\d{2}[a-z0-9\-]*(?:neo|ceo|xwb)?)\b/gi, m => 'Airbus ' + m[1].toUpperCase());
    addHit(/\b(B7\d{2}[a-z0-9\-]*)\b/gi,                  m => 'Boeing ' + m[1].toUpperCase());
    addHit(/\b(E[12]\d{2}[a-z]?)\b/gi,                    m => 'Embraer '+ m[1].toUpperCase());
  }

  return hits.sort((a, b) => a.pos - b.pos).map(h => h.type.replace(/FARE/gi, '').replace(/-$/, '').trim());
};

// Convenience: first aircraft type in text, or ''
const extractAircraftType = (text) => extractAllAircraftTypes(text)[0] || '';

// ─── Flight number helpers ────────────────────────────────────────────────────

// Extract all IATA flight numbers from text in document order.
// Handles standard 2-letter codes (EK788) and numeric-prefix codes (6E123).
// Deduplicates while preserving order.
const extractAllFlightNumbers = (text) => {
  const hits = [];
  const seen = new Set();
  // Pattern: 1-2 uppercase letters OR a digit + 1 uppercase letter, then 1-4 digits
  // Covers: AA123, EK788, PC706, B6234, 6E123, U2345, W6678
  const re = /\b([A-Z]{1,2}|\d[A-Z])\s?(\d{1,4})\b/g;
  for (const m of text.matchAll(re)) {
    const fn = m[1].replace(/\s/, '') + m[2];
    if (!seen.has(fn)) { seen.add(fn); hits.push({ pos: m.index, fn }); }
  }
  return hits.sort((a, b) => a.pos - b.pos).map(h => h.fn);
};

// Extract all (CODE) parenthesised airport codes from text in order
const extractParenCodes = (text) => {
  const codes = [];
  const re = /\(([A-Z]{3})\)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const code = m[1];
    if (isGoodCode(code)) codes.push(code);
  }
  return codes;
};

// Parse a date string into YYYY-MM-DD; returns '' on failure or out-of-range
const parseDate = (raw) => {
  if (!raw) return '';
  const s = raw.trim();

  const patterns = [
    // ISO: 2025-02-27
    { re: /^(\d{4})-(\d{2})-(\d{2})$/, fn: m => `${m[1]}-${m[2]}-${m[3]}` },
    // 27/02/2025 or 02/27/2025 — treat as DD/MM/YYYY for European emails
    { re: /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/, fn: m => `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}` },
    // 27Feb2025 or 27FEB25
    { re: /^(\d{1,2})([A-Za-z]{3})(\d{2,4})$/, fn: m => {
      const yr = m[3].length === 2 ? (parseInt(m[3]) > 50 ? '19'+m[3] : '20'+m[3]) : m[3];
      return `${yr}-${MONTH_MAP[m[2].toLowerCase()]||'01'}-${m[1].padStart(2,'0')}`;
    }},
    // Feb 27 2025 / February 27, 2025
    { re: /^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$/, fn: m => `${m[3]}-${MONTH_MAP[m[1].toLowerCase().substring(0,3)]||'01'}-${m[2].padStart(2,'0')}` },
    // 27 Feb 2025
    { re: /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/, fn: m => `${m[3]}-${MONTH_MAP[m[2].toLowerCase().substring(0,3)]||'01'}-${m[1].padStart(2,'0')}` },
  ];

  for (const { re, fn } of patterns) {
    const m = s.match(re);
    if (m) {
      try {
        const d = fn(m);
        const yr = parseInt(d.split('-')[0]);
        if (yr >= 1990 && yr <= 2040) return d;
      } catch (_) { /* skip */ }
    }
  }
  return '';
};

// Find best flight date in free-form text
const findDate = (text) => {
  const searches = [
    /\b(\d{4}-\d{2}-\d{2})\b/,
    /\b(\d{1,2}[A-Z]{3}\d{4})\b/i,
    /\b(\d{1,2}[A-Z]{3}\d{2})\b/i,
    /\b((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s+\d{1,2}[A-Z]{3}\d{2,4})\b/i,
    /\b((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/i,
    /\b(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/i,
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/,
  ];
  for (const re of searches) {
    const m = text.match(re);
    if (m) {
      // Strip leading day-name if present
      const raw = m[1].replace(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s*/i, '');
      const d = parseDate(raw);
      if (d) return d;
    }
  }
  return '';
};

// ─── Main export ─────────────────────────────────────────────────────────────

export const extractFlightInfo = (message) => {
  const headers = message.payload.headers;
  const subject = headers.find(h => h.name === 'Subject')?.value || '';
  const from    = headers.find(h => h.name === 'From')?.value || '';
  const dateHeader = headers.find(h => h.name === 'Date')?.value || '';

  const rawHtml  = extractRawHtml(message.payload);
  const bodyText = decodeEmailBody(message.payload);
  const fullText = (subject + ' ' + bodyText).replace(/\s+/g, ' ');

  // ── PRIMARY: JSON-LD (Schema.org FlightReservation) ──────────────────────
  const jsonLdFlights = [];
  try {
    const jsonLdRe = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m;
    while ((m = jsonLdRe.exec(rawHtml)) !== null) {
      try {
        const data = JSON.parse(m[1].trim());
        for (const item of (Array.isArray(data) ? data : [data])) {
          const check = (obj, reservationNumber) => {
            const dep = obj.departureAirport;
            const arr = obj.arrivalAirport;
            if (dep?.iataCode && arr?.iataCode) {
              jsonLdFlights.push({
                id: `${message.id}-${jsonLdFlights.length}`,
                origin: dep.iataCode.toUpperCase(),
                destination: arr.iataCode.toUpperCase(),
                date: obj.departureTime ? obj.departureTime.split('T')[0] : '',
                flightNumber: (obj.airline?.iataCode || '') + (obj.flightNumber || ''),
                airline: obj.airline?.name || '',
                aircraftType: (obj.aircraft?.name || obj.aircraft?.model || 'Unknown').replace(/FARE/gi, '').trim(),
                serviceClass: item.reservedTicket?.ticketedSeat?.seatingType || 'Economy',
                confirmationNumber: reservationNumber || item.reservationNumber || '',
                snippet: `${dep.name || dep.iataCode} → ${arr.name || arr.iataCode}`,
                source: 'json-ld',
              });
            }
          };
          if (item['@type'] === 'FlightReservation' && item.reservationFor)
            check(item.reservationFor, item.reservationNumber);
          if (item['@type'] === 'Flight')
            check(item, '');
        }
      } catch (_) { /* malformed JSON-LD */ }
    }
  } catch (_) { /* no JSON-LD */ }

  if (jsonLdFlights.length > 0) {
    const valid = jsonLdFlights.filter(f => f.origin && f.destination && f.origin !== f.destination);
    if (valid.length > 0) {
      console.log(`JSON-LD: ${valid.length} flight(s) in "${subject}"`);
      return valid;
    }
  }

  // ── PHASE 1: Is this a flight email? ─────────────────────────────────────
  // Check from-domain
  let isFromAirline = false;
  let detectedAirline = '';
  let airlineCode = '';

  for (const [domain, name] of Object.entries(AIRLINE_DOMAINS)) {
    const dp = domain.replace('.', '\\.');
    if (new RegExp(`[.@]${dp}`, 'i').test(from) || from.toLowerCase().includes(domain)) {
      isFromAirline = true;
      detectedAirline = name;
      // Derive 2-letter IATA code from the known mapping
      const codeMap = {
        'united airlines':'UA','delta air lines':'DL','american airlines':'AA',
        'southwest airlines':'WN','jetblue':'B6','alaska airlines':'AS',
        'british airways':'BA','lufthansa':'LH','air france':'AF','klm':'KL',
        'emirates':'EK','qatar airways':'QR','singapore airlines':'SQ',
        'cathay pacific':'CX','turkish airlines':'TK','air canada':'AC',
        'qantas':'QF','iberia':'IB','vueling':'VY','tap air portugal':'TP',
        'ana':'NH','japan airlines':'JL','thai airways':'TG','korean air':'KE',
        'eva air':'BR','virgin atlantic':'VS','swiss':'LX','austrian':'OS',
        'finnair':'AY','sas':'SK','ryanair':'FR','easyjet':'U2','wizz air':'W6',
        'spirit airlines':'NK','frontier airlines':'F9','norwegian':'DY',
        'pegasus airlines':'PC','sunexpress':'XQ','peach aviation':'MM',
        'airasia':'AK','lion air':'JT','ethiopian airlines':'ET','egyptair':'MS',
        'saudia':'SV','air arabia':'G9','flydubai':'FZ','flynas':'XY',
        'indigo':'6E','air india':'AI','spicejet':'SG','vistara':'UK',
        'aeroméxico':'AM','copa airlines':'CM','avianca':'AV','latam':'LA',
        'gol':'G3','azul':'AD','aeroflot':'SU','eurowings':'EW',
        'brussels airlines':'SN','lot polish airlines':'LO','aegean airlines':'A3',
      };
      airlineCode = codeMap[name.toLowerCase()] || '';
      break;
    }
  }

  // Check for airline name anywhere in body (catches OTA-forwarded bookings)
  const airlineNameMatch = AIRLINE_NAME_RE.exec(fullText);
  if (airlineNameMatch && !detectedAirline) {
    detectedAirline = airlineNameMatch[0];
  }

  const hasFlightIndicator = FLIGHT_KEYWORDS_RE.test(subject + ' ' + fullText);

  // Skip if there's truly no flight signal at all
  if (!isFromAirline && !airlineNameMatch && !hasFlightIndicator) {
    return null;
  }

  // ── PHASE 2: Extract route data ───────────────────────────────────────────

  // Helper: detect airline name from body if not already known
  if (!detectedAirline) {
    const airlinePatterns = [
      [/\bunited\s*airlines?\b/i,'United Airlines'],[/\bdelta\s*air\s*lines?\b/i,'Delta Air Lines'],
      [/\bamerican\s*airlines?\b/i,'American Airlines'],[/\bsouthwest\b/i,'Southwest Airlines'],
      [/\bjetblue\b/i,'JetBlue'],[/\bbritish\s*airways?\b/i,'British Airways'],
      [/\blufthansa\b/i,'Lufthansa'],[/\bair\s*france\b/i,'Air France'],
      [/\bklm\b/i,'KLM'],[/\bemirates\b/i,'Emirates'],[/\bqatar\b/i,'Qatar Airways'],
      [/\bsingapore\s*air/i,'Singapore Airlines'],[/\bturkish\b/i,'Turkish Airlines'],
      [/\biberia\b/i,'Iberia'],[/\btap\s*(portugal|air)?\b/i,'TAP'],
      [/\bswiss\b/i,'Swiss'],[/\bryanair\b/i,'Ryanair'],[/\beasyjet\b/i,'easyJet'],
      [/\bpegasus\b/i,'Pegasus Airlines'],[/\bwizz\s*air\b/i,'Wizz Air'],
      [/\blatam\b/i,'LATAM'],[/\bgol\b/i,'GOL'],[/\bazul\b/i,'Azul'],
      [/\bavianca\b/i,'Avianca'],[/\baeroflo[tc]\b/i,'Aeroflot'],
      [/\bethiopian\b/i,'Ethiopian Airlines'],[/\begyptair\b/i,'EgyptAir'],
      [/\bair\s*india\b/i,'Air India'],[/\bindigo\b/i,'IndiGo'],
      [/\baerom[eé]xico\b/i,'Aeroméxico'],[/\bcopa\s*airlines?\b/i,'Copa Airlines'],
      [/\bqantas\b/i,'Qantas'],[/\bair\s*canada\b/i,'Air Canada'],
      [/\bair\s*arabia\b/i,'Air Arabia'],[/\bflydubai\b/i,'flydubai'],
      [/\bairasia\b/i,'AirAsia'],[/\bcathay\b/i,'Cathay Pacific'],
    ];
    for (const [re, name] of airlinePatterns) {
      if (re.test(fullText)) { detectedAirline = name; break; }
    }
  }

  // Extract confirmation number
  let confirmationNumber = '';
  const confM = fullText.match(/(?:confirm(?:ation)?|booking|pnr|locator|reference|reservation)\s*(?:number|code|no|#|:)?\s*[:\s]*([A-Z0-9]{5,8})\b/i);
  if (confM) confirmationNumber = confM[1].toUpperCase();

  // ── Strategy A: multi-segment extraction ──────────────────────────────────
  const extractSegments = (text) => {
    const segs = [];
    let m;

    // A1. Standard: DayDate ... FlightNum ... (CODE) ... (CODE)
    const reA1 = /((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s*\d{1,2}[A-Z]{3}\d{2,4})[^]{0,500}?([A-Z]{2}\d{2,4})[^]{0,300}?\(([A-Z]{3})\)[^]{0,400}?\(([A-Z]{3})\)/gi;
    while ((m = reA1.exec(text)) !== null) {
      const [,date,fn,c1,c2] = m;
      if (isGoodCode(c1) && isGoodCode(c2) && c1 !== c2)
        segs.push({ date, flightNumber: fn, origin: c1, destination: c2 });
    }

    // A2. FlightNum-first: FlightNum DayDate ... (CODE) ... (CODE)  (Emirates/Gulf style)
    if (segs.length === 0) {
      const reA2 = /([A-Z]{2}\d{2,4})\s*((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s*\d{1,2}[A-Z]{3}\d{2,4})[^]{0,600}?\(([A-Z]{3})\)[^]{0,600}?\(([A-Z]{3})\)/gi;
      while ((m = reA2.exec(text)) !== null) {
        const [,fn,date,c1,c2] = m;
        if (isGoodCode(c1) && isGoodCode(c2) && c1 !== c2)
          segs.push({ date, flightNumber: fn, origin: c1, destination: c2 });
      }
    }

    // A3. All (CODE) pairs in document order — simplest and most universal.
    // Only start a new leg from an airport that is either (a) the first airport
    // in the sequence, or (b) a genuine transit — meaning it appeared twice
    // consecutively in the sequence (arrival code immediately followed by the
    // same departure code). This prevents "FLL → JFK → [status text mentions
    // FLL again]" from generating a phantom JFK→FLL return leg.
    if (segs.length === 0) {
      const parenCodes = extractParenCodes(text);
      // Find transit airports: those that appear consecutively (arr then dep)
      const transitAirports = new Set();
      for (let i = 0; i < parenCodes.length - 1; i++) {
        if (parenCodes[i] === parenCodes[i + 1]) transitAirports.add(parenCodes[i]);
      }
      for (let i = 0; i < parenCodes.length - 1; i++) {
        const orig = parenCodes[i], dest = parenCodes[i + 1];
        if (orig === dest) continue;
        const origIsStart = i === 0;
        const origIsTransit = transitAirports.has(orig);
        if ((origIsStart || origIsTransit) && !segs.some(s => s.origin === orig && s.destination === dest))
          segs.push({ date: '', flightNumber: '', aircraftType: '', origin: orig, destination: dest });
      }
    }

    // For segments that lack flight numbers (A3 path), try to assign in-order
    // from all flight numbers found in the text (e.g. EK788, EK404, EK355…)
    if (segs.length > 0 && segs.every(s => !s.flightNumber)) {
      const allFns = extractAllFlightNumbers(text);
      segs.forEach((s, i) => { if (allFns[i]) s.flightNumber = allFns[i]; });
    }

    // Similarly assign aircraft types in-order when not already set
    if (segs.length > 0 && segs.every(s => !s.aircraftType)) {
      const allAircraft = extractAllAircraftTypes(text);
      if (allAircraft.length === segs.length) {
        // Perfect match — assign 1:1
        segs.forEach((s, i) => { s.aircraftType = allAircraft[i]; });
      } else if (allAircraft.length > 0) {
        // Use whatever we found; repeat last value if short
        segs.forEach((s, i) => { s.aircraftType = allAircraft[i] || allAircraft[allAircraft.length - 1]; });
      }
    }

    return segs;
  };

  const segments = extractSegments(fullText);
  if (segments.length > 0) {
    console.log(`Segments (${segments.length}) in "${subject}"`);
    const emailDate = (() => { try { return new Date(dateHeader).toISOString().split('T')[0]; } catch(_){return '';} })();
    const emailAircraftTypes = extractAllAircraftTypes(fullText);
    return segments.map((seg, idx) => ({
      id: `${message.id}-seg${idx}`,
      origin: seg.origin,
      destination: seg.destination,
      date: (seg.date ? parseDate(seg.date.replace(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s*/i,'')) : '') || findDate(fullText) || emailDate,
      flightNumber: seg.flightNumber || '',
      airline: detectedAirline,
      aircraftType: seg.aircraftType || emailAircraftTypes[idx] || emailAircraftTypes[0] || '',
      serviceClass: 'Economy',
      confirmationNumber,
      snippet: `${seg.origin} → ${seg.destination}`,
      source: 'multi-segment',
    }));
  }

  // ── Strategy B: single-route patterns ────────────────────────────────────
  let origin = '', destination = '';

  const routePatterns = [
    // "from JFK to LAX" / "flight from JFK to LAX"
    /(?:flight|flying|from|depart(?:ing|ure)?|route)\s+(?:from\s+)?([A-Z]{3})\s+(?:to|→|->|–)\s+([A-Z]{3})/gi,
    // Arrow: JFK → LAX  or  JFK -> LAX
    /\b([A-Z]{3})\s*(?:→|->|=>|➔|»)\s*([A-Z]{3})\b/g,
    // City (CODE) to City (CODE)
    /\b[A-Za-z\s,]+-?\s*\(([A-Z]{3})\)\s+(?:to|→|->)\s+[A-Za-z\s,]+-?\s*\(([A-Z]{3})\)/gi,
    // Flight number + two codes close together: EK788 ACC DXB  or  EK788 ACC/DXB
    /\b[A-Z]{2}\d{1,4}\s+([A-Z]{3})\s*[\/\-\s]\s*([A-Z]{3})\b/g,
    // "departure: JFK  …  arrival: LAX"
    /(?:departure|depart|origin)\s*[:\s]+([A-Z]{3})[\s\S]{0,200}?(?:arrival|arrive|destination)\s*[:\s]+([A-Z]{3})/gi,
    // Slash route: JFK/LAX
    /\b([A-Z]{3})\/([A-Z]{3})\b/g,
    // Dash route with flight context nearby: "route JFK-LAX" or "itinerary JFK-LAX"
    /(?:route|itinerary|flight).{0,30}\b([A-Z]{3})\s*[-–]\s*([A-Z]{3})\b/gi,
  ];

  for (const re of routePatterns) {
    re.lastIndex = 0;
    for (const m of fullText.matchAll(re)) {
      const c1 = m[1]?.toUpperCase(), c2 = m[2]?.toUpperCase();
      if (c1 && c2 && isGoodCode(c1) && isGoodCode(c2) && c1 !== c2) {
        origin = c1; destination = c2; break;
      }
    }
    if (origin) break;
  }

  // ── Strategy C: context-proximity scan ───────────────────────────────────
  if (!origin) {
    const contextRe = /(?:flight|depart|arrive|from|to|origin|destination|airport).{0,50}([A-Z]{3})/gi;
    const found = [];
    for (const m of fullText.matchAll(contextRe)) {
      const code = m[1];
      if (isGoodCode(code) && isStandaloneCode(fullText, m.index + m[0].length - 3, code) && !found.includes(code))
        found.push(code);
    }
    if (found.length >= 2) { origin = found[0]; destination = found[1]; }
  }

  // ── Strategy D: last resort — any parenthesised codes ────────────────────
  if (!origin) {
    // Deduplicate to prevent (FLL)…(FLL)…(JFK) producing FLL→FLL
    const paren = [...new Set(extractParenCodes(fullText).filter(c => !EXCLUDE_CODES.has(c)))];
    if (paren.length >= 2) { origin = paren[0]; destination = paren[1]; }
  }

  // ── Strategy E: last resort — any standalone 3-letter codes (airline email only)
  if (!origin && isFromAirline) {
    const allRe = /\b([A-Z]{3})\b/g;
    const found = [];
    for (const m of fullText.matchAll(allRe)) {
      const code = m[1];
      if (isGoodCode(code) && isStandaloneCode(fullText, m.index, code) && !found.includes(code))
        found.push(code);
    }
    if (found.length >= 2) {
      origin = found[0]; destination = found[1];
      console.log(`Last resort bare codes: ${origin} → ${destination}`);
    }
  }

  if (!origin || !destination || origin === destination) return null;

  // ── Extract flight number ─────────────────────────────────────────────────
  let flightNumber = '';
  if (airlineCode) {
    // Escape special regex chars in airline code (e.g. "6E" has a digit prefix)
    const escaped = airlineCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const fnM = fullText.match(new RegExp(`\\b${escaped}\\s?(\\d{1,4})\\b`, 'i'));
    if (fnM) flightNumber = airlineCode + fnM[1];
  }
  if (!flightNumber) {
    // Broader pattern: 1-2 uppercase letters or digit+letter + 1-4 digits
    const allFns = extractAllFlightNumbers(fullText);
    if (allFns.length > 0) flightNumber = allFns[0];
  }

  // ── Extract service class ─────────────────────────────────────────────────
  let serviceClass = 'Economy';
  if (/\bfirst\s*class\b/i.test(fullText)) serviceClass = 'First';
  else if (/\bbusiness\s*class\b/i.test(fullText)) serviceClass = 'Business';
  else if (/\bpremium\s*economy\b/i.test(fullText)) serviceClass = 'Premium Economy';

  // ── Extract date ──────────────────────────────────────────────────────────
  let flightDate = findDate(fullText);
  if (!flightDate) {
    try { flightDate = new Date(dateHeader).toISOString().split('T')[0]; }
    catch(_) { flightDate = new Date().toISOString().split('T')[0]; }
  }

  console.log(`Regex fallback: ${origin} → ${destination} (${detectedAirline || 'unknown'})`);

  return [{
    id: message.id,
    origin,
    destination,
    date: flightDate,
    flightNumber,
    airline: detectedAirline,
    aircraftType: extractAircraftType(fullText),
    serviceClass,
    confirmationNumber,
    snippet: message.snippet?.substring(0, 80) + '...',
    source: 'regex-fallback',
  }];
};
