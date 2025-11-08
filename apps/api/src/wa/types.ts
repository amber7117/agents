// WhatsApp Authentication & Session Types
export type QRPayload = { qr: string };
export type OutboundMsg = { to: string; text: string };

// Session state types
export type SessionState =
    | 'disconnected'
    | 'waiting_qr'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'logged_out';

// Message direction
export type MessageDirection = 'INCOMING' | 'OUTGOING';

// Message types
export interface MessagePayload {
    whatsappMessageId: string;
    contactWhatsappId: string;
    direction: MessageDirection;
    content: string;
    sentAt: Date;
}

// Contact types
export interface ContactInfo {
    id: string;
    name?: string;
    pushName?: string;
    verifiedName?: string;
    profilePictureUrl?: string;
}

// Chat types
export interface ChatInfo {
    id: string;
    name?: string;
    unreadCount?: number;
    lastMessageTimestamp?: number;
    archived?: boolean;
    pinned?: boolean;
    muted?: boolean;
}

// History sync payload
export interface HistorySyncPayload {
    chatsCount: number;
    contactsCount: number;
    messagesCount: number;
}

// WhatsApp event payloads
export interface WAEventPayloads {
    'wa.qr': QRPayload;
    'wa.ready': { phoneNumber?: string };
    'wa.message': { from: string; text: string; ts: number };
    'wa.status': { state: SessionState };
    'wa.error': { error: string };
    'wa.history-synced': HistorySyncPayload;
    'wa.stopped': Record<string, never>;
}

// Database auth store types
export interface DbAuthState {
    state: {
        creds: any; // Baileys AuthenticationCreds
        keys: {
            get: <T>(type: T, ids: string[]) => Promise<{ [id: string]: any }>;
            set: <T>(data: { [id: string]: any | null }, type: T) => Promise<void>;
        };
    };
    saveCreds: () => Promise<void>;
}

// Session configuration
export interface SessionConfig {
    channelId: string;
    userId: string;
    name?: string;
    useDatabase?: boolean;
}

// App state update types
export type ChatModifyAction =
    | { archive: boolean; lastMessages: any[] }
    | { delete: boolean; lastMessages: any[] }
    | { mute: number | null }
    | { markRead: boolean; lastMessages: any[] }
    | { pin: boolean };

// Message receipt types
export type ReceiptType = 'read' | 'read-self' | 'delivery-ack' | 'sender-ack' | 'inactive' | 'played';

// Presence types
export type PresenceType = 'available' | 'unavailable' | 'composing' | 'recording' | 'paused';