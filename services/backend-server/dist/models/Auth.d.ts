import { Schema, type InferSchemaType } from "mongoose";
declare const RefreshSessionSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    userId: import("mongoose").Types.ObjectId;
    jti: string;
    isRevoked: boolean;
    expiresAt: NativeDate;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    userId: import("mongoose").Types.ObjectId;
    jti: string;
    isRevoked: boolean;
    expiresAt: NativeDate;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    userId: import("mongoose").Types.ObjectId;
    jti: string;
    isRevoked: boolean;
    expiresAt: NativeDate;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export type RefreshSessionDoc = InferSchemaType<typeof RefreshSessionSchema>;
declare const _default: import("mongoose").Model<{
    userId: import("mongoose").Types.ObjectId;
    jti: string;
    isRevoked: boolean;
    expiresAt: NativeDate;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    userId: import("mongoose").Types.ObjectId;
    jti: string;
    isRevoked: boolean;
    expiresAt: NativeDate;
}, {}, {}> & {
    userId: import("mongoose").Types.ObjectId;
    jti: string;
    isRevoked: boolean;
    expiresAt: NativeDate;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Auth.d.ts.map