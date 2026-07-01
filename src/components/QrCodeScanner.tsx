import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, AlertCircle } from 'lucide-react';

interface QrCodeScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export const QrCodeScanner: React.FC<QrCodeScannerProps> = ({ onScanSuccess, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<any>(null);
  const elementId = "qr-reader-container";

  useEffect(() => {
    let active = true;
    let html5QrcodeInstance: any = null;

    const startScanner = async () => {
      try {
        // Dynamically import html5-qrcode on client side to avoid Next.js SSR error
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!active) return;

        // Request camera permissions and list cameras
        const devices = await Html5Qrcode.getCameras();
        if (!active) return;

        if (devices && devices.length > 0) {
          setHasPermission(true);
          // Try to select the back camera
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('traseira') ||
            device.label.toLowerCase().includes('environment') ||
            device.label.toLowerCase().includes('traseiro')
          ) || devices[0];

          html5QrcodeInstance = new Html5Qrcode(elementId);
          scannerRef.current = html5QrcodeInstance;

          await html5QrcodeInstance.start(
            backCamera.id,
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
              aspectRatio: 1.0
            },
            (decodedText: string) => {
              if (active) {
                onScanSuccess(decodedText);
              }
            },
            () => {
              // Verbose scanning logs - ignored to avoid noise
            }
          );
        } else {
          setHasPermission(false);
          setError("Nenhuma câmera encontrada no dispositivo.");
        }
      } catch (err: any) {
        console.error("Erro ao inicializar scanner:", err);
        if (active) {
          setHasPermission(false);
          setError("Erro ao acessar a câmera. Verifique as permissões de privacidade.");
        }
      }
    };

    startScanner();

    return () => {
      active = false;
      if (html5QrcodeInstance && html5QrcodeInstance.isScanning) {
        html5QrcodeInstance.stop().then(() => {
          console.log("Câmera desligada com sucesso.");
        }).catch((err: any) => {
          console.error("Erro ao parar a câmera:", err);
        });
      }
    };
  }, [onScanSuccess]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      color: '#fff'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--card)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: 'var(--shadow-xl)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera size={20} style={{ color: 'var(--primary)' }} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--foreground)' }}>Escanear Nota Fiscal</span>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              display: 'flex',
              padding: '0.25rem'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Video Scanner Container */}
        <div 
          id={elementId} 
          style={{ 
            width: '100%', 
            borderRadius: '12px', 
            overflow: 'hidden',
            backgroundColor: '#000',
            aspectRatio: '1',
            border: '1px solid var(--border)',
            position: 'relative'
          }} 
        />

        {/* Info/Error Messages */}
        <div style={{ marginTop: '1.25rem', width: '100%', textAlign: 'center' }}>
          {error ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', color: 'var(--danger)', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          ) : hasPermission === null ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Solicitando acesso à câmera...</span>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Aponte a câmera para o QR Code da Nota Fiscal (NFC-e)
            </p>
          )}
        </div>

        {/* Close Button */}
        <button 
          type="button"
          onClick={onClose} 
          className="btn btn-outline" 
          style={{ width: '100%', marginTop: '1.25rem', padding: '0.6rem' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
