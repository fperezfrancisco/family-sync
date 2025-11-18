import { time } from "console";
import { Schema, model } from "mongoose";
const EventSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: false },
    date: { type: Date, required: true },
    time: { type: String, required: false },
    location: { type: String, required: false },
    attendees: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
});
EventSchema.index({ date: 1 });
EventSchema.index({ createdBy: 1 });
export default model("Event", EventSchema);
//# sourceMappingURL=Events.js.map