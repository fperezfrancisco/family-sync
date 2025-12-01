import { Schema, type InferSchemaType } from "mongoose";
/**
 * Event Schema
 * Represents an event that can be standalone or associated with a group
 */
declare const EventSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    status: "cancelled" | "draft" | "published" | "completed";
    startDate: NativeDate;
    isAllDay: boolean;
    timezone: string;
    isVirtual: boolean;
    isPrivate: boolean;
    allowGuestInvites: boolean;
    requireRSVP: boolean;
    attendees: import("mongoose").Types.DocumentArray<{
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }> & {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }>;
    isRecurring: boolean;
    description?: string | null;
    owner?: {
        id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
    } | null;
    endDate?: NativeDate | null;
    location?: string | null;
    locationUrl?: string | null;
    group?: {
        type: "other" | "family" | "friends" | "work";
        id?: import("mongoose").Types.ObjectId | null;
        name?: string | null;
    } | null;
    maxAttendees?: number | null;
    recurrenceRule?: string | null;
    parentEvent?: import("mongoose").Types.ObjectId | null;
} & import("mongoose").DefaultTimestampProps, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    status: "cancelled" | "draft" | "published" | "completed";
    startDate: NativeDate;
    isAllDay: boolean;
    timezone: string;
    isVirtual: boolean;
    isPrivate: boolean;
    allowGuestInvites: boolean;
    requireRSVP: boolean;
    attendees: import("mongoose").Types.DocumentArray<{
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }> & {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }>;
    isRecurring: boolean;
    description?: string | null;
    owner?: {
        id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
    } | null;
    endDate?: NativeDate | null;
    location?: string | null;
    locationUrl?: string | null;
    group?: {
        type: "other" | "family" | "friends" | "work";
        id?: import("mongoose").Types.ObjectId | null;
        name?: string | null;
    } | null;
    maxAttendees?: number | null;
    recurrenceRule?: string | null;
    parentEvent?: import("mongoose").Types.ObjectId | null;
} & import("mongoose").DefaultTimestampProps>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    status: "cancelled" | "draft" | "published" | "completed";
    startDate: NativeDate;
    isAllDay: boolean;
    timezone: string;
    isVirtual: boolean;
    isPrivate: boolean;
    allowGuestInvites: boolean;
    requireRSVP: boolean;
    attendees: import("mongoose").Types.DocumentArray<{
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }> & {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }>;
    isRecurring: boolean;
    description?: string | null;
    owner?: {
        id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
    } | null;
    endDate?: NativeDate | null;
    location?: string | null;
    locationUrl?: string | null;
    group?: {
        type: "other" | "family" | "friends" | "work";
        id?: import("mongoose").Types.ObjectId | null;
        name?: string | null;
    } | null;
    maxAttendees?: number | null;
    recurrenceRule?: string | null;
    parentEvent?: import("mongoose").Types.ObjectId | null;
} & import("mongoose").DefaultTimestampProps> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export type EventDoc = InferSchemaType<typeof EventSchema>;
declare const _default: import("mongoose").Model<{
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    status: "cancelled" | "draft" | "published" | "completed";
    startDate: NativeDate;
    isAllDay: boolean;
    timezone: string;
    isVirtual: boolean;
    isPrivate: boolean;
    allowGuestInvites: boolean;
    requireRSVP: boolean;
    attendees: import("mongoose").Types.DocumentArray<{
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }> & {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }>;
    isRecurring: boolean;
    description?: string | null;
    owner?: {
        id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
    } | null;
    endDate?: NativeDate | null;
    location?: string | null;
    locationUrl?: string | null;
    group?: {
        type: "other" | "family" | "friends" | "work";
        id?: import("mongoose").Types.ObjectId | null;
        name?: string | null;
    } | null;
    maxAttendees?: number | null;
    recurrenceRule?: string | null;
    parentEvent?: import("mongoose").Types.ObjectId | null;
} & import("mongoose").DefaultTimestampProps, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    status: "cancelled" | "draft" | "published" | "completed";
    startDate: NativeDate;
    isAllDay: boolean;
    timezone: string;
    isVirtual: boolean;
    isPrivate: boolean;
    allowGuestInvites: boolean;
    requireRSVP: boolean;
    attendees: import("mongoose").Types.DocumentArray<{
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }> & {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }>;
    isRecurring: boolean;
    description?: string | null;
    owner?: {
        id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
    } | null;
    endDate?: NativeDate | null;
    location?: string | null;
    locationUrl?: string | null;
    group?: {
        type: "other" | "family" | "friends" | "work";
        id?: import("mongoose").Types.ObjectId | null;
        name?: string | null;
    } | null;
    maxAttendees?: number | null;
    recurrenceRule?: string | null;
    parentEvent?: import("mongoose").Types.ObjectId | null;
} & import("mongoose").DefaultTimestampProps, {}, {}> & {
    name: string;
    createdAt: NativeDate;
    updatedAt: NativeDate;
    status: "cancelled" | "draft" | "published" | "completed";
    startDate: NativeDate;
    isAllDay: boolean;
    timezone: string;
    isVirtual: boolean;
    isPrivate: boolean;
    allowGuestInvites: boolean;
    requireRSVP: boolean;
    attendees: import("mongoose").Types.DocumentArray<{
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }, import("mongoose").Types.Subdocument<import("bson").ObjectId, any, {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }> & {
        status: "pending" | "attending" | "not_attending" | "maybe";
        user: import("mongoose").Types.ObjectId;
        invitedAt: NativeDate;
        respondedAt?: NativeDate | null;
    }>;
    isRecurring: boolean;
    description?: string | null;
    owner?: {
        id: import("mongoose").Types.ObjectId;
        name: string;
        email: string;
    } | null;
    endDate?: NativeDate | null;
    location?: string | null;
    locationUrl?: string | null;
    group?: {
        type: "other" | "family" | "friends" | "work";
        id?: import("mongoose").Types.ObjectId | null;
        name?: string | null;
    } | null;
    maxAttendees?: number | null;
    recurrenceRule?: string | null;
    parentEvent?: import("mongoose").Types.ObjectId | null;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Events.d.ts.map