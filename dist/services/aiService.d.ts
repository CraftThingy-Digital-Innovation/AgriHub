export declare const AI_MODELS: {
    readonly default: "gpt-4o-mini";
    readonly advanced: "claude-3-5-sonnet";
    readonly embedding: "text-embedding-3-small";
};
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export declare function chatWithAI(opts: {
    message: string;
    history: ChatMessage[];
    userId: string;
    useRag?: boolean;
    model?: string;
}): Promise<{
    reply: string;
    ragSources: string[];
    tokensUsed?: number;
}>;
export declare function checkGroupCredit(groupJid: string): Promise<{
    allowed: boolean;
    balance: number;
    reason?: string;
}>;
export declare function deductGroupCredit(groupJid: string, amount?: number): Promise<void>;
