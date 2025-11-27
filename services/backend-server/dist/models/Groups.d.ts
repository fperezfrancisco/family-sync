import { Schema, type InferSchemaType } from "mongoose";
declare const GroupSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    type: "other" | "family" | "friends" | "work";
    name: string;
    pendingInvitations: import("mongoose").Types.ObjectId[];
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
    inviteSettings?: {
        allowMemberInvites: boolean;
        requireApproval: boolean;
        maxMembers: number;
    } | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    type: "other" | "family" | "friends" | "work";
    name: string;
    pendingInvitations: import("mongoose").Types.ObjectId[];
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
    inviteSettings?: {
        allowMemberInvites: boolean;
        requireApproval: boolean;
        maxMembers: number;
    } | null;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    type: "other" | "family" | "friends" | "work";
    name: string;
    pendingInvitations: import("mongoose").Types.ObjectId[];
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
    inviteSettings?: {
        allowMemberInvites: boolean;
        requireApproval: boolean;
        maxMembers: number;
    } | null;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export type GroupDoc = InferSchemaType<typeof GroupSchema>;
declare const _default: import("mongoose").Model<{
    type: "other" | "family" | "friends" | "work";
    name: string;
    pendingInvitations: import("mongoose").Types.ObjectId[];
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
    inviteSettings?: {
        allowMemberInvites: boolean;
        requireApproval: boolean;
        maxMembers: number;
    } | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    type: "other" | "family" | "friends" | "work";
    name: string;
    pendingInvitations: import("mongoose").Types.ObjectId[];
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
    inviteSettings?: {
        allowMemberInvites: boolean;
        requireApproval: boolean;
        maxMembers: number;
    } | null;
}, {}, {}> & {
    type: "other" | "family" | "friends" | "work";
    name: string;
    pendingInvitations: import("mongoose").Types.ObjectId[];
    createdAt: NativeDate;
    owner: import("mongoose").Types.ObjectId;
    members: import("mongoose").Types.DocumentArray<{
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }> & {
        type?: {
            id: import("mongoose").Types.ObjectId;
            name: string;
            email: string;
            role: "owner" | "admin" | "member" | "guest";
        } | null;
        required?: unknown;
    }>;
    description?: string | null;
    inviteSettings?: {
        allowMemberInvites: boolean;
        requireApproval: boolean;
        maxMembers: number;
    } | null;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Groups.d.ts.map