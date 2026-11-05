import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Doctor name is required"],
      trim: true,
      index: true,
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
      trim: true,
      index: true,
    },
    hospital: {
      type: String,
      required: [true, "Hospital affiliation is required"],
      trim: true,
      index: true,
    },
    experience: {
      type: Number,
      default: 0,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email address is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound index for optimized search + filter + pagination
doctorSchema.index({ specialization: 1, hospital: 1, createdAt: -1 });

// Virtual for linking patients
doctorSchema.virtual("patients", {
  ref: "Patient",
  localField: "_id",
  foreignField: "doctorId",
});

export default mongoose.model("Doctor", doctorSchema);