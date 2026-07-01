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
    // Clean up url (e.g. replace spaces or double slashes if any)
    const cleanUrl = url.trim();
    const parsedUrl = new URL(cleanUrl);

    // 1. Try direct search params (vVal, vValTot, chNFe)
    const directVal = parsedUrl.searchParams.get('vVal') || 
                      parsedUrl.searchParams.get('vValTot') || 
                      parsedUrl.searchParams.get('vTotal');
    const directKey = parsedUrl.searchParams.get('chNFe') || 
                      parsedUrl.searchParams.get('chave') || 
                      parsedUrl.searchParams.get('c');

    let amount: number | undefined;
    let key: string | undefined;
    let date: string | undefined;

    if (directVal) {
      const parsedNum = parseFloat(directVal);
      if (!isNaN(parsedNum)) {
        amount = parsedNum;
      }
    }

    if (directKey && (directKey.length === 44 || directKey.length === 40)) {
      key = directKey;
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
          const parsedNum = parseFloat(parts[5]);
          if (!isNaN(parsedNum)) {
            amount = parsedNum;
          }
        }

        // Try to decode date from parts[4] (dhEmi)
        const dhEmiRaw = parts[4];
        if (dhEmiRaw) {
          let decodedDhEmi = dhEmiRaw;
          // If it's hex, decode it
          if (/^[0-9a-fA-F]{8,}$/.test(dhEmiRaw)) {
            decodedDhEmi = hexToString(dhEmiRaw);
          }

          if (decodedDhEmi && decodedDhEmi.includes('-')) {
            // Usually YYYY-MM-DDThh:mm:ssTZD or YYYY-MM-DD
            date = decodedDhEmi.split('T')[0];
          }
        }
      } else if (parts.length > 0 && parts[0] && (parts[0].length === 44 || parts[0].length === 40)) {
        // Fallback: the first part is often the chave de acesso (44 digits)
        if (!key) {
          key = parts[0];
        }
      }
    }

    return { amount, date, key };
  } catch (_) {
    // If URL parsing fails, check if the string contains a 44-digit key pattern
    const keyMatch = url.match(/\b\d{44}\b/);
    if (keyMatch) {
      return { key: keyMatch[0] };
    }
  }

  return {};
}
