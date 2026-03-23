export declare function connectWhatsApp(): Promise<void>;
export declare function getWAStatus(): {
    isConnected: boolean;
    hasQR: boolean;
    qrCode: string;
};
export declare function sendWAMessage(jid: string, text: string): Promise<void>;
