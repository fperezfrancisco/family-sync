import { Schema, type InferSchemaType } from "mongoose";
declare const UserSchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, {
    timestamps: true;
}, {
    name: string;
    email: string;
    passwordHash: string;
    gender: "" | "male" | "female" | "other";
    groups: import("mongoose").Types.ObjectId[];
    dob?: NativeDate | null;
    phone?: {
        number: string;
        countryCode: string;
    } | null;
} & import("mongoose").DefaultTimestampProps, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<{
    name: string;
    email: string;
    passwordHash: string;
    gender: "" | "male" | "female" | "other";
    groups: import("mongoose").Types.ObjectId[];
    dob?: NativeDate | null;
    phone?: {
        number: string;
        countryCode: string;
    } | null;
} & import("mongoose").DefaultTimestampProps>, {}, import("mongoose").ResolveSchemaOptions<{
    timestamps: true;
}>> & import("mongoose").FlatRecord<{
    name: string;
    email: string;
    passwordHash: string;
    gender: "" | "male" | "female" | "other";
    groups: import("mongoose").Types.ObjectId[];
    dob?: NativeDate | null;
    phone?: {
        number: string;
        countryCode: string;
    } | null;
} & import("mongoose").DefaultTimestampProps> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export type UserDoc = InferSchemaType<typeof UserSchema>;
declare const _default: import("mongoose").Model<{
    name: string;
    email: string;
    passwordHash: string;
    gender: "" | "male" | "female" | "other";
    groups: import("mongoose").Types.ObjectId[];
    dob?: NativeDate | null;
    phone?: {
        number: string;
        countryCode: string;
    } | null;
} & import("mongoose").DefaultTimestampProps, {}, {}, {}, import("mongoose").Document<unknown, {}, {
    name: string;
    email: string;
    passwordHash: string;
    gender: "" | "male" | "female" | "other";
    groups: import("mongoose").Types.ObjectId[];
    dob?: NativeDate | null;
    phone?: {
        number: string;
        countryCode: string;
    } | null;
} & import("mongoose").DefaultTimestampProps, {}, {}> & {
    name: string;
    email: string;
    passwordHash: string;
    gender: "" | "male" | "female" | "other";
    groups: import("mongoose").Types.ObjectId[];
    dob?: NativeDate | null;
    phone?: {
        number: string;
        countryCode: string;
    } | null;
} & import("mongoose").DefaultTimestampProps & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>;
export default _default;
//# sourceMappingURL=User.d.ts.map