export declare function chunkText(text: string, chunkSize?: number, overlap?: number): string[];
export declare function storeDocument(opts: {
    userId: string;
    title: string;
    sourceType: 'pdf' | 'docx' | 'xlsx' | 'url' | 'youtube' | 'text';
    sourceUrl?: string;
    content: string;
    isGlobal?: boolean;
}): Promise<string>;
export declare function retrieveRelevantChunks(opts: {
    query: string;
    userId: string;
    topK?: number;
}): Promise<{
    content: string;
    score: number;
    docTitle: string;
}[]>;
export declare function getUserDocuments(userId: string): Promise<any[]>;
export declare function deleteDocument(docId: string, userId: string): Promise<boolean>;
