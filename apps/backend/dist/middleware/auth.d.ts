import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        phone: string;
        name: string;
        role: string;
    };
    file?: Express.Multer.File;
}
/**
 * Verifikasi JWT token dari header Authorization: Bearer <token>
 */
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
/**
 * Cek apakah user adalah admin
 */
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
