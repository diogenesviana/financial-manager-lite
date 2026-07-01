import { parseNfceUrl } from '../../src/lib/nfce';

describe('NFC-e Parser Utility', () => {
  it('should parse direct query parameter amount and key', () => {
    const url = 'https://www.fazenda.pr.gov.br/nfce/qrcode?chNFe=41200192785400013965003000287955110196884615&vVal=154.30&vICMS=0.00';
    const result = parseNfceUrl(url);
    expect(result.amount).toBe(154.30);
    expect(result.key).toBe('41200192785400013965003000287955110196884615');
    expect(result.date).toBeUndefined();
  });

  it('should parse standard pipe-separated parameters v2.0', () => {
    // 35200210579609000128650010003075731110023403 (chave - 44 chars)
    // versao=2
    // ambiente=1
    // dest= (empty)
    // dhEmi=323032362d30352d31355431323a33303a30302d30333a3030 (hex for 2026-05-15T12:30:00-03:00)
    // vVal=85.50
    const url = 'https://www.nfce.fazenda.sp.gov.br/qrcode?p=35200210579609000128650010003075731110023403|2|1||323032362d30352d31355431323a33303a30302d30333a3030|85.50|32C98D743EDF6F8C1619E4A962E3B13C6D3356E9';
    const result = parseNfceUrl(url);
    expect(result.amount).toBe(85.50);
    expect(result.key).toBe('35200210579609000128650010003075731110023403');
    expect(result.date).toBe('2026-05-15');
  });

  it('should fallback to extracting only key if no amount is present in pipe format', () => {
    const url = 'https://www.sefaz.rs.gov.br/NFCE/NFCE-COM.aspx?p=43201192785400013965003000287955110196884615|2|1|1|C9F06E985FE65C4DC06E7104F5E68C6A32F1A0FF';
    const result = parseNfceUrl(url);
    expect(result.amount).toBeUndefined();
    expect(result.key).toBe('43201192785400013965003000287955110196884615');
    expect(result.date).toBeUndefined();
  });

  it('should find 44-digit access key anywhere in the text as a fallback', () => {
    const text = 'Chave de acesso da nota fiscal: 35200210579609000128650010003075731110023403. Verifique no site.';
    const result = parseNfceUrl(text);
    expect(result.amount).toBeUndefined();
    expect(result.key).toBe('35200210579609000128650010003075731110023403');
  });

  it('should return empty object for invalid values', () => {
    const result = parseNfceUrl('random text with no valid URL or key');
    expect(result).toEqual({});
  });
});
