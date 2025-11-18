import type { NextFunction, Request, Response } from "express";
interface AuthRequest extends Request {
    user?: {
        id: string;
    };
}
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Response<any, Record<string, any>> | undefined;
export {};
//# sourceMappingURL=requireAuth.d.ts.map