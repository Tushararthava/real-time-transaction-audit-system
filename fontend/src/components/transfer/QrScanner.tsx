import { QRCodeSVG } from 'qrcode.react';
import { useUserStore } from '@/store/user.store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { QrCode, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { User } from '@/types/transaction';

interface QrScannerProps {
    onUserScanned?: (user: User) => void;
}

export function QrScanner({ onUserScanned }: QrScannerProps) {
    const { user } = useUserStore();
    const [showMyQr, setShowMyQr] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

    if (!user) return null;

    const qrData = JSON.stringify({
        userId: user.id,
        name: user.name,
    });

    // Start QR scanning
    const startScanning = async () => {
        setError(null);
        setScanning(true);

        try {
            if (!codeReaderRef.current) {
                codeReaderRef.current = new BrowserMultiFormatReader();
            }

            const videoInputDevices = await codeReaderRef.current.listVideoInputDevices();

            if (videoInputDevices.length === 0) {
                setError('No camera found on this device');
                setScanning(false);
                return;
            }

            // Use the first available camera (usually back camera on mobile, webcam on desktop)
            const selectedDeviceId = videoInputDevices[0].deviceId;

            if (videoRef.current) {
                await codeReaderRef.current.decodeFromVideoDevice(
                    selectedDeviceId,
                    videoRef.current,
                    (result, error) => {
                        if (result) {
                            try {
                                const scannedData = JSON.parse(result.getText());

                                if (scannedData.userId && scannedData.name) {
                                    // Successfully scanned a valid QR code
                                    const scannedUser: User = {
                                        id: scannedData.userId,
                                        name: scannedData.name,
                                        email: '', // Will be fetched/populated by parent
                                        avatar: null,
                                    };

                                    // Stop scanning and notify parent
                                    stopScanning();
                                    onUserScanned?.(scannedUser);
                                } else {
                                    setError('Invalid QR code format');
                                }
                            } catch (e) {
                                setError('Invalid QR code. Please scan a valid payment QR code.');
                            }
                        }

                        if (error && !(error instanceof NotFoundException)) {
                            console.error('QR Scanner error:', error);
                        }
                    }
                );
            }
        } catch (err: any) {
            console.error('Camera error:', err);
            if (err.name === 'NotAllowedError') {
                setError('Camera permission denied. Please allow camera access to scan QR codes.');
            } else if (err.name === 'NotFoundError') {
                setError('No camera found on this device.');
            } else {
                setError('Failed to access camera. Please try again.');
            }
            setScanning(false);
        }
    };

    // Stop QR scanning
    const stopScanning = () => {
        if (codeReaderRef.current) {
            codeReaderRef.current.reset();
        }
        setScanning(false);
        setError(null);
    };

    // Switch between modes
    const handleModeSwitch = (showQr: boolean) => {
        if (!showQr && scanning) {
            stopScanning();
        }
        setShowMyQr(showQr);
        setError(null);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (codeReaderRef.current) {
                codeReaderRef.current.reset();
            }
        };
    }, []);

    return (
        <Card className="bg-white shadow-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                    <QrCode className="w-5 h-5 text-primary" />
                    QR Code Payment
                </CardTitle>
                <CardDescription className="text-gray-600">Scan or show QR to transfer money</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Button
                        variant={showMyQr ? 'default' : 'outline'}
                        onClick={() => handleModeSwitch(true)}
                        className="flex-1"
                    >
                        <QrCode className="w-4 h-4 mr-2" />
                        My QR Code
                    </Button>
                    <Button
                        variant={!showMyQr ? 'default' : 'outline'}
                        onClick={() => handleModeSwitch(false)}
                        className="flex-1"
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Scan QR
                    </Button>
                </div>

                {showMyQr ? (
                    <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-xl border-2 border-gray-100">
                        <QRCodeSVG
                            value={qrData}
                            size={220}
                            level="H"
                            includeMargin
                            bgColor="#ffffff"
                            fgColor="#000000"
                        />
                        <div className="text-center">
                            <p className="font-semibold text-lg text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-600 mt-1">
                                Scan to send me money
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        {!scanning ? (
                            <div className="flex flex-col items-center gap-4 p-8 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 w-full">
                                <Camera className="w-16 h-16 text-gray-400" />
                                <div className="text-center">
                                    <p className="font-medium text-gray-900 mb-2">Ready to Scan</p>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Point your camera at a QR code to scan
                                    </p>
                                    <Button onClick={startScanning} className="gap-2">
                                        <Camera className="w-4 h-4" />
                                        Start Camera
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full">
                                <video
                                    ref={videoRef}
                                    className="w-full h-80 object-cover rounded-xl border-2 border-primary"
                                    autoPlay
                                    playsInline
                                />
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute inset-0 border-4 border-primary/30 rounded-xl" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-4 border-primary rounded-xl" />
                                </div>
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Scanning for QR code...
                                </div>
                            </div>
                        )}

                        {scanning && (
                            <Button
                                onClick={stopScanning}
                                variant="outline"
                                className="w-full"
                            >
                                Stop Scanning
                            </Button>
                        )}

                        {error && (
                            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-red-900">Scan Error</p>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
