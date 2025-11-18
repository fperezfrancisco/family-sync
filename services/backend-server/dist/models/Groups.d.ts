import { Schema, type InferSchemaType } from "mongoose";
declare const GroupSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    type: "other" | "family" | "friends" | "work";
    name: string;
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    type: "other" | "family" | "friends" | "work";
    name: string;
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    type: "other" | "family" | "friends" | "work";
    name: string;
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export type GroupDoc = InferSchemaType<typeof GroupSchema>;
declare const _default: import("mongoose").Model<{
    type: "other" | "family" | "friends" | "work";
    name: string;
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    type: "other" | "family" | "friends" | "work";
    name: string;
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
}, {}, {}> & {
    type: "other" | "family" | "friends" | "work";
    name: string;
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            user: import("mongoose").Types.ObjectId;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Groups.d.ts.map