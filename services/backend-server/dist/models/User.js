import { Schema, model } from "mongoose";
const PhoneSchema = new Schema({
    countryCode: { type: String, required: true },
    number: { type: String, required: true },
});
const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    dob: { type: Date, required: false },
    gender: {
        type: String,
        enum: ["male", "female", "other", ""],
        default: null,
    },
    phone: { type: PhoneSchema, required: false },
    groups: [{ type: Schema.Types.ObjectId, ref: "Group" }],
}, { timestamps: true });
export default model("User", UserSchema);
//# sourceMappingURL=User.js.map