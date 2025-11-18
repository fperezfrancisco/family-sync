export type JwtAccess = {
    sub: string;
    type: string;
};
export type JwtRefresh = {
    sub: string;
    type: string;
    jti: string;
};
export declare function signAccess(payload: JwtAccess): string;
export declare function signRefresh(payload: JwtRefresh): string;
export declare function verifyAccess(token: string): JwtAccess;
export declare function verifyRefresh(token: string): JwtRefresh;
//# sourceMappingURL=jwt.d.ts.map