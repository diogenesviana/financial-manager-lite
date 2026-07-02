/**
 * Helper to decode a hex string into a UTF-8 string (client and server compatible).
 */
function hexToString(hex: string): string {
  try {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const code = parseInt(hex.substring(i, i + 2), 16);
      if (isNaN(code)) return '';
      str += String.fromCharCode(code);
    }
    return str;
  } catch (_) {
    return '';
  }
}

/**
 * Parses a Brazilian NFC-e (Nota Fiscal de Consumidor Eletrônica) QR Code URL.
 * Extracts the total amount, emission date, and access key.
 */
export function parseNfceUrl(url: string): { amount?: number; date?: string; key?: string } {
  if (!url) return {};

  try {
    const cleanUrl = url.trim();
    const parsedUrl = new URL(cleanUrl);

    let amount: number | undefined;
    let key: string | undefined;
    let date: string | undefined;

    // 1. Scan all search params case-insensitively
    for (const [sKey, sVal] of parsedUrl.searchParams.entries()) {
      const lowerKey = sKey.toLowerCase();
      
      if (
        lowerKey === 'vval' || 
        lowerKey === 'vvaltot' || 
        lowerKey === 'vtotal' || 
        lowerKey === 'valor' || 
        lowerKey === 'val' ||
        lowerKey === 'vvaltribut'
      ) {
        const cleanVal = sVal.replace(',', '.');
        const parsedNum = parseFloat(cleanVal);
        if (!isNaN(parsedNum)) {
          amount = parsedNum;
        }
      }
      
      if (lowerKey === 'chnfe' || lowerKey === 'chave' || lowerKey === 'c') {
        if (sVal.length === 44 || sVal.length === 40) {
          key = sVal;
        }
      }

      if (lowerKey === 'dhemi' || lowerKey === 'data' || lowerKey === 'dt') {
        let decodedDate = sVal;
        if (/^[0-9a-fA-F]{8,}$/.test(sVal)) {
          decodedDate = hexToString(sVal);
        }
        if (decodedDate.includes('-')) {
          date = decodedDate.split('T')[0];
        } else if (decodedDate.includes('/')) {
          const partsDate = decodedDate.split('/');
          if (partsDate.length === 3) {
            date = `${partsDate[2]}-${partsDate[1].padStart(2, '0')}-${partsDate[0].padStart(2, '0')}`;
          }
        }
      }
    }

    // 2. Try to parse the standard 'p' parameter containing pipe-separated values
    const p = parsedUrl.searchParams.get('p');
    if (p) {
      const parts = p.split('|');
      
      // Standard NFC-e QR Code v2.0 parameters format:
      // parts[0] = chNFe (44 digits)
      // parts[1] = versao
      // parts[2] = ambiente
      // parts[3] = cDest
      // parts[4] = dhEmi (date of emission in hex or YYYY-MM-DD...)
      // parts[5] = vVal (total value)
      if (parts.length >= 6) {
        if (!key && parts[0] && (parts[0].length === 44 || parts[0].length === 40)) {
          key = parts[0];
        }

        if (!amount && parts[5]) {
          const cleanVal = parts[5].replace(',', '.');
          const parsedNum = parseFloat(cleanVal);
          if (!isNaN(parsedNum)) {
            amount = parsedNum;
          }
        }

        // Try to decode date from parts[4] (dhEmi)
        const dhEmiRaw = parts[4];
        if (dhEmiRaw && !date) {
          let decodedDhEmi = dhEmiRaw;
          if (/^[0-9a-fA-F]{8,}$/.test(dhEmiRaw)) {
            decodedDhEmi = hexToString(dhEmiRaw);
          }

          if (decodedDhEmi && decodedDhEmi.includes('-')) {
            date = decodedDhEmi.split('T')[0];
          } else if (decodedDhEmi && decodedDhEmi.includes('/')) {
            const partsDate = decodedDhEmi.split('/');
            if (partsDate.length === 3) {
              date = `${partsDate[2]}-${partsDate[1].padStart(2, '0')}-${partsDate[0].padStart(2, '0')}`;
            }
          }
        }
      } else if (parts.length > 0 && parts[0] && (parts[0].length === 44 || parts[0].length === 40)) {
        if (!key) {
          key = parts[0];
        }
      }

      // 3. Heuristic Fallback: search for any part looking like a price with decimals (e.g. 15.50 or 15,50)
      if (!amount && parts.length > 3) {
        for (let i = 3; i < parts.length; i++) {
          const part = parts[i].trim();
          if (!part) continue;
          
          const cleanPart = part.replace(',', '.');
          // Match digits followed by a dot and exactly 2 decimal digits
          if (/^\d+\.\d{2}$/.test(cleanPart)) {
            const parsedNum = parseFloat(cleanPart);
            if (!isNaN(parsedNum) && parsedNum > 0) {
              amount = parsedNum;
              break;
            }
          }
        }
      }
    }

    return { amount, date, key };
  } catch (_) {
    const keyMatch = url.match(/\b\d{44}\b/);
    if (keyMatch) {
      return { key: keyMatch[0] };
    }
  }

  return {};
}
