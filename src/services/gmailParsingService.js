import { extractRawHtml, decodeEmailBody } from '../utils/email';
import AIRPORTS_DATABASE from '../data/airports';

// Gmail-style flight extractor - primarily uses JSON-LD Schema.org data
// This is the same approach Gmail uses to show flight cards
export const extractFlightInfo = (message) => {
    const headers = message.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const dateHeader = headers.find(h => h.name === 'Date')?.value || '';
    
    // Get raw HTML to extract JSON-LD
    const rawHtml = extractRawHtml(message.payload);
    const bodyText = decodeEmailBody(message.payload);
    
    // ===== PRIMARY METHOD: Parse JSON-LD (Schema.org FlightReservation) =====
    // This is exactly how Gmail extracts flight data
    const extractedFlights = [];
    
    try {
      // Find all JSON-LD script tags
      const jsonLdRegex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
      let match;
      
      while ((match = jsonLdRegex.exec(rawHtml)) !== null) {
        try {
          const jsonContent = match[1].trim();
          const data = JSON.parse(jsonContent);
          
          // Handle both single objects and arrays
          const items = Array.isArray(data) ? data : [data];
          
          for (const item of items) {
            // Check for FlightReservation type
            if (item['@type'] === 'FlightReservation' && item.reservationFor) {
              const flight = item.reservationFor;
              const departureAirport = flight.departureAirport;
              const arrivalAirport = flight.arrivalAirport;
              
              if (departureAirport?.iataCode && arrivalAirport?.iataCode) {
                extractedFlights.push({
                  id: `${message.id}-${extractedFlights.length}`,
                  origin: departureAirport.iataCode.toUpperCase(),
                  destination: arrivalAirport.iataCode.toUpperCase(),
                  date: flight.departureTime ? flight.departureTime.split('T')[0] : '',
                  flightNumber: (flight.airline?.iataCode || '') + (flight.flightNumber || ''),
                  airline: flight.airline?.name || '',
                  aircraftType: flight.aircraft?.name || flight.aircraft?.model || 'Unknown',
                  serviceClass: item.reservedTicket?.ticketedSeat?.seatingType || 'Economy',
                  confirmationNumber: item.reservationNumber || '',
                  snippet: `${departureAirport.name || departureAirport.iataCode} → ${arrivalAirport.name || arrivalAirport.iataCode}`,
                  source: 'json-ld'
                });
              }
            }
            
            // Also check for direct Flight type
            if (item['@type'] === 'Flight') {
              const departureAirport = item.departureAirport;
              const arrivalAirport = item.arrivalAirport;
              
              if (departureAirport?.iataCode && arrivalAirport?.iataCode) {
                extractedFlights.push({
                  id: `${message.id}-${extractedFlights.length}`,
                  origin: departureAirport.iataCode.toUpperCase(),
                  destination: arrivalAirport.iataCode.toUpperCase(),
                  date: item.departureTime ? item.departureTime.split('T')[0] : '',
                  flightNumber: (item.airline?.iataCode || '') + (item.flightNumber || ''),
                  airline: item.airline?.name || '',
                  aircraftType: item.aircraft?.name || 'Unknown',
                  serviceClass: 'Economy',
                  confirmationNumber: '',
                  snippet: `${departureAirport.name || departureAirport.iataCode} → ${arrivalAirport.name || arrivalAirport.iataCode}`,
                  source: 'json-ld'
                });
              }
            }
          }
        } catch (parseError) {
          // JSON parse failed for this script tag, continue to next
          console.log('JSON-LD parse error:', parseError.message);
        }
      }
    } catch (e) {
      console.log('JSON-LD extraction error:', e.message);
    }
    
    // If we found flights via JSON-LD, return them (most reliable)
    if (extractedFlights.length > 0) {
      console.log(`Found ${extractedFlights.length} flight(s) via JSON-LD in email:`, subject);
      return extractedFlights;
    }
    
    // ===== FALLBACK METHOD: Regex parsing for older email systems =====
    // Only used when JSON-LD is not present
    
    const fullText = (subject + ' ' + bodyText).replace(/\s+/g, ' ');
    
    // Check if sender is from a known airline domain (high confidence)
    const airlineDomains = {
      'united.com': { name: 'United Airlines', code: 'UA' },
      'delta.com': { name: 'Delta Air Lines', code: 'DL' },
      'aa.com': { name: 'American Airlines', code: 'AA' },
      'southwest.com': { name: 'Southwest Airlines', code: 'WN' },
      'jetblue.com': { name: 'JetBlue', code: 'B6' },
      'alaskaair.com': { name: 'Alaska Airlines', code: 'AS' },
      'britishairways.com': { name: 'British Airways', code: 'BA' },
      'lufthansa.com': { name: 'Lufthansa', code: 'LH' },
      'airfrance.com': { name: 'Air France', code: 'AF' },
      'klm.com': { name: 'KLM', code: 'KL' },
      'emirates.com': { name: 'Emirates', code: 'EK' },
      'qatarairways.com': { name: 'Qatar Airways', code: 'QR' },
      'singaporeair.com': { name: 'Singapore Airlines', code: 'SQ' },
      'cathaypacific.com': { name: 'Cathay Pacific', code: 'CX' },
      'turkishairlines.com': { name: 'Turkish Airlines', code: 'TK' },
      'aircanada.com': { name: 'Air Canada', code: 'AC' },
      'qantas.com': { name: 'Qantas', code: 'QF' },
      'iberia.com': { name: 'Iberia', code: 'IB' },
      'vueling.com': { name: 'Vueling', code: 'VY' },
      'tap.pt': { name: 'TAP Air Portugal', code: 'TP' },
      'ana.co.jp': { name: 'ANA', code: 'NH' },
      'jal.com': { name: 'Japan Airlines', code: 'JL' },
      'thaiairways.com': { name: 'Thai Airways', code: 'TG' },
      'koreanair.com': { name: 'Korean Air', code: 'KE' },
      'evaair.com': { name: 'EVA Air', code: 'BR' },
      'virginatlantic.com': { name: 'Virgin Atlantic', code: 'VS' },
      'swiss.com': { name: 'Swiss', code: 'LX' },
      'austrian.com': { name: 'Austrian', code: 'OS' },
      'finnair.com': { name: 'Finnair', code: 'AY' },
      'sas.se': { name: 'SAS', code: 'SK' },
      'ryanair.com': { name: 'Ryanair', code: 'FR' },
      'easyjet.com': { name: 'easyJet', code: 'U2' },
      'wizzair.com': { name: 'Wizz Air', code: 'W6' },
      'spirit.com': { name: 'Spirit Airlines', code: 'NK' },
      'flyfrontier.com': { name: 'Frontier Airlines', code: 'F9' },
      'norwegian.com': { name: 'Norwegian', code: 'DY' },
      'expedia.com': { name: '', code: '' },
      'booking.com': { name: '', code: '' },
      'kayak.com': { name: '', code: '' },
    };
    
    let isFromAirline = false;
    let detectedAirline = '';
    let airlineCode = '';
    
    for (const [domain, info] of Object.entries(airlineDomains)) {
      // Check for domain in From header - handles subdomains like info.email.aa.com
      const domainPattern = domain.replace('.', '\\.');
      const regex = new RegExp(`[.@]${domainPattern}`, 'i');
      if (regex.test(from) || from.toLowerCase().includes(domain)) {
        isFromAirline = true;
        detectedAirline = info.name;
        airlineCode = info.code;
        break;
      }
    }
    
    // Subject or content indicators
    const hasFlightIndicator = /\b(e-?ticket|itinerary|boarding\s*pass|flight\s*confirm|booking\s*confirm|trip\s*confirm|check-?in|your\s*flight|your\s*trip|reservation|confirmation)\b/i.test(subject + ' ' + fullText);
    
    // If not from airline/booking site and no flight indicators, skip
    if (!isFromAirline && !hasFlightIndicator) {
      return null;
    }
    
    // Valid IATA codes - only major airports that are very unlikely to be false positives
    // This is a curated set of the most common airports worldwide
    const validIata = new Set([
      // North America - Major hubs only
      'JFK','LGA','EWR','LAX','SFO','ORD','ATL','DFW','DEN','SEA','PHX','MIA','FLL','MCO',
      'BOS','IAD','DCA','PHL','MSP','DTW','CLT','LAS','IAH','HOU','AUS','SLC','TPA','HNL',
      'YYZ','YVR','YUL','MEX','CUN',
      // Europe - Major hubs only
      'LHR','LGW','CDG','ORY','FRA','MUC','BER','AMS','BRU','ZRH','VIE','PRG','WAW',
      'FCO','MXP','BCN','MAD','LIS','ATH','IST','DUB','CPH','OSL','ARN','HEL',
      // Middle East - Major hubs only
      'DXB','AUH','DOH','TLV','CAI',
      // Asia - Major hubs only
      'SIN','KUL','BKK','HKG','TPE','NRT','HND','ICN','PEK','PVG','DEL','BOM',
      // Oceania
      'SYD','MEL','AKL',
      // South America - Major hubs only
      'GRU','GIG','EZE','SCL','LIM','BOG',
      // Africa - Major hubs only
      'JNB','CPT','NBO','CAI','CMN','RAK',
    ]);
    
    // Check against our local airport database (most reliable)
    const isInAirportDatabase = (code) => {
      return AIRPORTS_DATABASE.some(a => a.code === code);
    };
    
    // Strict validation: must be in our database OR in the curated validIata set
    const isValidAirportCode = (code) => {
      return isInAirportDatabase(code) || validIata.has(code);
    };
    
    // Route patterns - more permissive but still require context
    const routePatterns = [
      // Explicit route with context words
      /(?:flight|flying|from|depart|route)\s+(?:from\s+)?([A-Z]{3})\s+(?:to|→|->|–|-)\s+([A-Z]{3})/gi,
      // Departure/Arrival labels
      /(?:departure|depart|origin)\s*[:\s]+([A-Z]{3})[\s\S]{0,150}?(?:arrival|arrive|destination)\s*[:\s]+([A-Z]{3})/gi,
      // Arrow patterns
      /\b([A-Z]{3})\s*(?:→|->|=>|➔|»)\s*([A-Z]{3})\b/g,
      // Dash between codes (with flight context nearby)
      /(?:flight|route|itinerary).{0,30}?\b([A-Z]{3})\s*[-–]\s*([A-Z]{3})\b/gi,
      // Flight number followed by route
      /\b[A-Z]{2}\d{1,4}\s+([A-Z]{3})\s*[-–\/]\s*([A-Z]{3})\b/g,
      // City (CODE) format: "New York (JFK) to Los Angeles (LAX)"
      /\b\w+\s*\(([A-Z]{3})\)\s*(?:to|→|->|–|-)\s*\w+\s*\(([A-Z]{3})\)/gi,
      // United baggage table format: "City (CODE) to City (CODE)"
      /\b[A-Za-z\s,]+\(([A-Z]{3})\)\s+to\s+[A-Za-z\s,]+\(([A-Z]{3})\)/gi,
      // American Airlines style: CODE followed by city name, then another CODE followed by city name
      /\b([A-Z]{3})\b[^A-Z]{0,30}(?:Newark|New York|Los Angeles|Chicago|Dallas|Houston|Miami|Boston|Denver|Seattle|Phoenix|Atlanta|San Francisco|Washington|Philadelphia|Detroit|Minneapolis|Charlotte|Orlando|Tampa|Austin|San Diego|Portland|Las Vegas|Baltimore|Fort Lauderdale|Salt Lake|Honolulu|Fort Worth|Cleveland|St\.? Louis|Pittsburgh|Indianapolis|Kansas City|Columbus|Cincinnati|Milwaukee|Nashville|Raleigh|San Antonio|Sacramento)[^A-Z]{0,200}?\b([A-Z]{3})\b/gi,
    ];
    
    // Additional pattern: Extract routes from HTML with CITY <BR />(CODE) format (United old style)
    const extractUnitedStyleRoutes = (text) => {
      // Pattern: CITY NAME <BR />(CODE) followed later by another CITY NAME <BR />(CODE)
      const cityCodePattern = /([A-Z][A-Za-z\s,]+?)(?:<BR\s*\/?>|\n)\s*\(([A-Z]{3})\)/gi;
      const matches = [...text.matchAll(cityCodePattern)];
      const codes = [];
      
      for (const match of matches) {
        const code = match[2].toUpperCase();
        if (isValidAirportCode(code) && !codes.includes(code)) {
          codes.push(code);
        }
      }
      return codes;
    };
    
    // Extract all flight segments from multi-segment itineraries
    const extractFlightSegments = (text) => {
      const segments = [];
      
      // Method 1: Look for flight rows with Date + Flight# + Origin(CODE) + Destination(CODE)
      // Handles: "Tue, 12MAR13 ... TG565 ... HANOI VN (HAN) ... BANGKOK, THAILAND (BKK)"
      
      // First, extract all rows that contain a date and flight number pattern
      const rowPattern = /((?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s*\d{1,2}[A-Z]{3}\d{2,4})[^<>]{0,500}?([A-Z]{2}\d{2,4})[^<>]{0,300}?\(([A-Z]{3})\)[^<>]{0,200}?\(([A-Z]{3})\)/gi;
      
      let match;
      while ((match = rowPattern.exec(text)) !== null) {
        const dateStr = match[1];
        const flightNum = match[2];
        const code1 = match[3].toUpperCase();
        const code2 = match[4].toUpperCase();
        
        if (isValidAirportCode(code1) && isValidAirportCode(code2) && code1 !== code2) {
          segments.push({
            date: dateStr,
            flightNumber: flightNum,
            origin: code1,
            destination: code2
          });
        }
      }
      
      // Method 2: Simpler - find all (CODE) pairs in sequence with flight context
      if (segments.length === 0) {
        const codeSequence = [];
        const allCodes = /\(([A-Z]{3})\)/g;
        let codeMatch;
        while ((codeMatch = allCodes.exec(text)) !== null) {
          const code = codeMatch[1];
          if (isValidAirportCode(code)) {
            codeSequence.push(code);
          }
        }
        
        // Create segments from consecutive unique pairs
        for (let i = 0; i < codeSequence.length - 1; i++) {
          const orig = codeSequence[i];
          const dest = codeSequence[i + 1];
          if (orig !== dest && !segments.some(s => s.origin === orig && s.destination === dest)) {
            segments.push({
              date: '',
              flightNumber: '',
              origin: orig,
              destination: dest
            });
          }
        }
      }
      
      return segments;
    };
    
    // Additional: Try to find two IATA codes that appear as standalone with city context
    // This handles emails where codes appear in separate visual sections
    const findCodesWithCityContext = (text) => {
      // Look for patterns like "CODE" followed by city name
      const codeWithCity = /\b([A-Z]{3})\b[\s\n]{0,20}(Newark|New York|JFK|LaGuardia|Los Angeles|LAX|Chicago|O'Hare|Midway|Dallas|Fort Worth|DFW|Houston|Hobby|Bush|Miami|Boston|Logan|Denver|Seattle|Tacoma|Phoenix|Atlanta|Hartsfield|San Francisco|SFO|Washington|Dulles|Reagan|National|Philadelphia|Detroit|Minneapolis|St\.? Paul|Charlotte|Douglas|Orlando|Tampa|Austin|San Diego|Portland|Las Vegas|McCarran|Baltimore|BWI|Fort Lauderdale|Hollywood|Salt Lake|Honolulu|Cleveland|Hopkins|St\.? Louis|Lambert|Pittsburgh|Indianapolis|Kansas City|Columbus|Cincinnati|Milwaukee|Nashville|Raleigh|Durham|San Antonio|Sacramento|Anchorage|Toronto|Pearson|Vancouver|Montreal|Trudeau|Mexico City|Cancun|London|Heathrow|Gatwick|Paris|CDG|Orly|Frankfurt|Munich|Berlin|Amsterdam|Schiphol|Brussels|Zurich|Geneva|Vienna|Prague|Warsaw|Budapest|Rome|Fiumicino|Milan|Malpensa|Barcelona|Madrid|Barajas|Lisbon|Athens|Istanbul|Dubai|Doha|Singapore|Changi|Kuala Lumpur|Bangkok|Hong Kong|Tokyo|Narita|Haneda|Seoul|Incheon|Beijing|Shanghai|Pudong|Sydney|Melbourne|Auckland|Hanoi|Buenos Aires|Sao Paulo|Guarulhos)/gi;
      
      const matches = [...text.matchAll(codeWithCity)];
      const codesFound = [];
      
      for (const match of matches) {
        const code = match[1].toUpperCase();
        if (isValidAirportCode(code) && !codesFound.includes(code)) {
          codesFound.push(code);
        }
      }
      
      return codesFound;
    };
    
    let origin = '', destination = '';
    
    for (const pattern of routePatterns) {
      pattern.lastIndex = 0;
      const matches = [...fullText.matchAll(pattern)];
      
      for (const match of matches) {
        const code1 = match[1]?.toUpperCase();
        const code2 = match[2]?.toUpperCase();
        if (code1 && code2 && isValidAirportCode(code1) && isValidAirportCode(code2) && code1 !== code2) {
          origin = code1;
          destination = code2;
          break;
        }
      }
      if (origin && destination) break;
    }
    
    // Try extracting multi-segment itinerary (for emails with multiple flights)
    const segments = extractFlightSegments(fullText);
    if (segments.length > 0) {
      console.log(`Found ${segments.length} flight segment(s) in multi-segment itinerary`);
      
      const flights = segments.map((seg, idx) => {
        // Parse date from formats like "12MAR13" or "12 March 2013"
        let segDate = '';
        const dateMatch = seg.date.match(/(\d{1,2})([A-Z]{3})(\d{2,4})/i);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const monthStr = dateMatch[2].toLowerCase();
          const year = dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3];
          segDate = `${year}-${monthNames[monthStr] || '01'}-${day}`;
        }
        
        return {
          id: `${message.id}-seg${idx}`,
          origin: seg.origin,
          destination: seg.destination,
          date: segDate || flightDate || new Date(dateHeader).toISOString().split('T')[0],
          flightNumber: seg.flightNumber,
          airline: detectedAirline,
          aircraftType: 'Unknown',
          serviceClass: 'Economy',
          confirmationNumber,
          snippet: `${seg.origin} → ${seg.destination}`,
          source: 'multi-segment'
        };
      });
      
      return flights;
    }
    
    // If no route found, try United-style HTML parsing
    if (!origin || !destination) {
      const unitedCodes = extractUnitedStyleRoutes(rawHtml || fullText);
      if (unitedCodes.length >= 2) {
        origin = unitedCodes[0];
        destination = unitedCodes[unitedCodes.length - 1]; // First origin to last destination
        console.log(`Found codes via United-style HTML: ${origin} → ${destination}`);
      }
    }
    
    // If no route found, try finding codes with city name context
    if (!origin || !destination) {
      const codesWithCities = findCodesWithCityContext(fullText);
      if (codesWithCities.length >= 2) {
        origin = codesWithCities[0];
        destination = codesWithCities[1];
        console.log(`Found codes via city context: ${origin} → ${destination}`);
      }
    }
    
    // Comprehensive list of common non-airport 3-letter codes to exclude (used in multiple places)
    const excludeCodes = new Set([
      // Common English words
      'THE','AND','FOR','ARE','BUT','NOT','YOU','ALL','CAN','HAS','WAS','ONE','OUR','OUT',
      'DAY','GET','HIM','HIS','HOW','ITS','MAY','NEW','NOW','OLD','SEE','TWO','WHO','WAY',
      'ANY','FEW','GOT','HER','LET','PUT','SAY','SHE','TOO','USE','AGO','BIG','END','FAR',
      'MAN','OWN','RUN','SET','TOP','TRY','WHY','YES','YET','ADD','AIR','BAD','BAG',
      'BED','BOX','BOY','BUS','BUY','CAR','CUT','DID','DOG','EAT','EYE','FUN','GAS','HAD',
      'HAT','HIT','HOT','ICE','JOB','KEY','KID','LAW','LAY','LED','LOT','LOW','MAP','MEN',
      'MET','MIX','OIL','PAY','PER','PIE','POP','RAN','RAW','RED','SIT','SIX','SKY',
      'SON','SUM','TAX','TEA','TEN','TIP','VAN','WAR','WET','WIN','WON','YEA',
      // Days and months
      'FRI','SAT','SUN','MON','TUE','WED','THU','JAN','FEB','MAR','APR','JUN','JUL',
      'AUG','SEP','OCT','NOV','DEC',
      // Currency and units
      'USD','EUR','GBP','CAD','AUD','JPY','CNY','INR','KRW','MXN','BRL','CHF','SEK','NOK',
      'DKK','NZD','SGD','HKD','TWD','THB','MYR','PHP','IDR','VND','PLN','CZK','HUF','RUB',
      'ZAR','AED','SAR','ILS','EGP','QAR','KWD','BHD','OMR','JOD',
      'LBS','OZS','KGS','GMS','MLS','QTS','PTS','GLS',
      // Tech and web
      'PDF','APP','WWW','COM','ORG','NET','GOV','EDU','MIL','BIZ','HTML','CSS','XML',
      'API','URL','SSL','VPN','DNS','FTP','SQL','PHP','JSP','ASP','DOC','XLS','PPT','ZIP',
      'RAR','TAR','GIF','PNG','JPG','SVG','BMP','TXT','CSV','LOG','BAK','TMP','EXE','DLL',
      'SYS','BAT','CMD','REG','INI','CFG','DAT','BIN','ISO','IMG','DMG','APK','IPA','AAB',
      // Time zones
      'EST','PST','CST','MST','GMT','UTC','EDT','PDT','CDT','MDT','BST','CET','EET','JST',
      'KST','IST',
      // Business
      'INC','LLC','LTD','PLC','LLP','GBH','CEO','CFO','COO','CTO','CIO','CMO',
      'EVP','SVP','AVP','MGR','DIR','REP','REF','FAQ','TBD','TBA','ETA','ETD','ROI','KPI',
      'SLA','NDA','MOU','LOI','RFP','RFQ','POC','MVP','UAT',
      // Common abbreviations in emails
      'FWD','BCC','EOM','EOD','EOW','EOY','YTD','MTD','WTD','QTD','MOM','YOY','WOW','POV',
      'IMO','FYI','BTW','TBH','IDK','OMG','LOL','THX','PLS','MSG',
      // Email/travel specific
      'VIP','TSA','CBP','ICE','DHS','DOT','FAA','CAA','PNR','TST','SSR','OSI',
      'RES','CNF','CNL','CHG','ADV','ACK','REQ','TKT','EMD','PTA','ITN',
      // Miscellaneous
      'NON','OFF','PRO','VIA','MAX','MIN','AVG','TOT','SUB','DEL','UPD',
      'FIX','BUG','SRC','DST','OBJ','ARR','DEP','RET','ALT',
      'OPT'
    ]);
    
    // If still no route, try to find two IATA codes in close proximity with flight context
    if (!origin || !destination) {
      const contextPattern = /(?:flight|depart|arrive|from|to|origin|destination|airport).{0,40}?\b([A-Z]{3})\b/gi;
      const contextMatches = [...fullText.matchAll(contextPattern)];
      const foundCodes = [];
      
      for (const match of contextMatches) {
        const code = match[1].toUpperCase();
        if (isValidAirportCode(code) && !excludeCodes.has(code) && !foundCodes.includes(code)) {
          foundCodes.push(code);
        }
      }
      
      if (foundCodes.length >= 2) {
        origin = foundCodes[0];
        destination = foundCodes[1];
      }
    }
    
    // Last resort: if email is from airline, find any two valid IATA codes in the text
    if ((!origin || !destination) && isFromAirline) {
      const allCodesPattern = /\b([A-Z]{3})\b/g;
      const allMatches = [...fullText.matchAll(allCodesPattern)];
      const validCodes = [];
      
      for (const match of allMatches) {
        const code = match[1].toUpperCase();
        if (isValidAirportCode(code) && !excludeCodes.has(code) && !validCodes.includes(code)) {
          validCodes.push(code);
        }
      }
      
      if (validCodes.length >= 2) {
        origin = validCodes[0];
        destination = validCodes[1];
        console.log(`Found codes from airline email (last resort): ${origin} → ${destination}`);
      }
    }
    
    if (!origin || !destination) {
      return null;
    }
    
    // Extract date - handle various formats
    let flightDate = '';
    const monthNames = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',
                        jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12',
                        january:'01',february:'02',march:'03',april:'04',june:'06',
                        july:'07',august:'08',september:'09',october:'10',november:'11',december:'12'};
    
    const datePatterns = [
      // ISO format: 2025-02-27
      { regex: /\b(\d{4})-(\d{2})-(\d{2})\b/, parse: m => m[0] },
      // Full day name: Thursday, February 27, 2025
      { regex: /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})/i, 
        parse: m => `${m[3]}-${monthNames[m[1].toLowerCase()]}-${m[2].padStart(2,'0')}` },
      // Short day name + DDMMMYY: Tue, 12MAR13
      { regex: /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,?\s*(\d{1,2})([A-Z]{3})(\d{2})\b/i, 
        parse: m => {
          const day = m[1].padStart(2,'0');
          const monthStr = m[2].toLowerCase();
          const year = parseInt(m[3]) > 50 ? '19' + m[3] : '20' + m[3];
          return `${year}-${monthNames[monthStr] || '01'}-${day}`;
        }},
      // Month DD, YYYY: February 27, 2025
      { regex: /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i, 
        parse: m => `${m[3]}-${monthNames[m[1].toLowerCase().substring(0,3)]}-${m[2].padStart(2,'0')}` },
      // DD Month YYYY: 27 February 2025
      { regex: /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i,
        parse: m => `${m[3]}-${monthNames[m[2].toLowerCase().substring(0,3)]}-${m[1].padStart(2,'0')}` },
      // DDMMMYYYY: 12MAR2013
      { regex: /\b(\d{1,2})([A-Z]{3})(\d{4})\b/i,
        parse: m => `${m[3]}-${monthNames[m[2].toLowerCase()] || '01'}-${m[1].padStart(2,'0')}` },
      // MM/DD/YYYY or DD/MM/YYYY (assume US format)
      { regex: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/, 
        parse: m => `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}` },
    ];
    
    for (const {regex, parse} of datePatterns) {
      const match = fullText.match(regex);
      if (match) {
        try {
          flightDate = parse(match);
          const d = new Date(flightDate);
          if (d.getFullYear() >= 2020 && d.getFullYear() <= 2030) break;
          flightDate = '';
        } catch (e) { flightDate = ''; }
      }
    }
    
    if (!flightDate) {
      try {
        flightDate = new Date(dateHeader).toISOString().split('T')[0];
      } catch (e) {
        flightDate = new Date().toISOString().split('T')[0];
      }
    }
    
    // Detect airline from content if not from sender
    if (!detectedAirline) {
      const airlinePatterns = [
        [/\bunited\s*(airlines?)?\b/i, 'United Airlines'],
        [/\bdelta\s*(air\s*lines?)?\b/i, 'Delta Air Lines'],
        [/\bamerican\s*airlines?\b/i, 'American Airlines'],
        [/\bsouthwest\b/i, 'Southwest Airlines'],
        [/\bjetblue\b/i, 'JetBlue'],
        [/\bbritish\s*airways?\b/i, 'British Airways'],
        [/\blufthansa\b/i, 'Lufthansa'],
        [/\bair\s*france\b/i, 'Air France'],
        [/\bklm\b/i, 'KLM'],
        [/\bemirates\b/i, 'Emirates'],
        [/\bqatar\b/i, 'Qatar Airways'],
        [/\bsingapore\s*air/i, 'Singapore Airlines'],
        [/\bturkish\b/i, 'Turkish Airlines'],
        [/\biberia\b/i, 'Iberia'],
        [/\btap\s*(portugal)?\b/i, 'TAP'],
        [/\bswiss\b/i, 'Swiss'],
        [/\bryanair\b/i, 'Ryanair'],
        [/\beasyjet\b/i, 'easyJet'],
        [/\blatam\b/i, 'LATAM'],
        [/\bgol\b/i, 'GOL'],
        [/\bazul\b/i, 'Azul'],
        [/\bavianca\b/i, 'Avianca'],
      ];
      
      for (const [pattern, name] of airlinePatterns) {
        if (pattern.test(fullText)) {
          detectedAirline = name;
          break;
        }
      }
    }
    
    // Extract flight number
    let flightNumber = '';
    if (airlineCode) {
      const fnMatch = fullText.match(new RegExp(`\\b${airlineCode}\\s?(\\d{1,4})\\b`, 'i'));
      if (fnMatch) flightNumber = airlineCode + fnMatch[1];
    }
    if (!flightNumber) {
      const genericFn = fullText.match(/\b([A-Z]{2})\s?(\d{3,4})\b/);
      if (genericFn) flightNumber = genericFn[1] + genericFn[2];
    }
    
    // Extract confirmation number
    let confirmationNumber = '';
    const confMatch = fullText.match(/(?:confirm|booking|pnr|locator|reference)\s*(?:number|code|#)?\s*[:\s]*([A-Z0-9]{5,8})\b/i);
    if (confMatch) confirmationNumber = confMatch[1].toUpperCase();
    
    console.log(`Regex fallback found: ${origin} → ${destination} (${detectedAirline || 'unknown'})`);
    
    return [{
      id: message.id,
      origin,
      destination,
      date: flightDate,
      flightNumber,
      airline: detectedAirline,
      aircraftType: 'Unknown',
      serviceClass: 'Economy',
      confirmationNumber,
      snippet: message.snippet?.substring(0, 80) + '...',
      source: 'regex-fallback'
    }];
  };

