import { Schema, type InferSchemaType } from "mongoose";
declare const EventSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    date: NativeDate;
    name: string;
    createdAt: NativeDate;
    attendees: import("mongoose").Types.ObjectId[];
    createdBy: import("mongoose").Types.ObjectId;
    description?: string | null;
    time?: string | null;
    location?: string | null;
}, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    date: NativeDate;
    name: string;
    createdAt: NativeDate;
    attendees: import("mongoose").Types.ObjectId[];
    createdBy: import("mongoose").Types.ObjectId;
    description?: string | null;
    time?: string | null;
    location?: string | null;
}>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<{
    date: NativeDate;
    name: string;
    createdAt: NativeDate;
    attendees: import("mongoose").Types.ObjectId[];
    createdBy: import("mongoose").Types.ObjectId;
    description?: string | null;
    time?: string | null;
    location?: string | null;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export type EventDoc = InferSchemaType<typeof EventSchema>;
declare const _default: import("mongoose").Model<{
    date: NativeDate;
    name: string;
    createdAt: NativeDate;
    attendees: import("mongoose").Types.ObjectId[];
    createdBy: import("mongoose").Types.ObjectId;
    description?: string | null;
    time?: string | null;
    location?: string | null;
}, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    date: NativeDate;
    name: string;
    createdAt: NativeDate;
    attendees: import("mongoose").Types.ObjectId[];
    createdBy: import("mongoose").Types.ObjectId;
    description?: string | null;
    time?: string | null;
    location?: string | null;
}, {}, {}> & {
    date: NativeDate;
    name: string;
    createdAt: NativeDate;
    attendees: import("mongoose").Types.ObjectId[];
    createdBy: import("mongoose").Types.ObjectId;
    description?: string | null;
    time?: string | null;
    location?: string | null;
} & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=Events.d.ts.map