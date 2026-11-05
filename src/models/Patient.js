import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Patient name is required"],
      trim: true,
      index: true,
    },
    age: {
      type: Number,
      required: false,
      min: 0,
      max: 130,
    },
    gender: {
      type: String,
      enum: ["Female", "Male", "Other"],
      default: "Other",
      index: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      default: null,
      index: true,
    },
    condition: {
      type: String,
      required: [true, "Medical diagnosis/condition is required"],
      trim: true,
      index: true,
    },
    conditionCategory: {
      type: String,
      enum: [
        "Cardiovascular",
        "Neurological",
        "Pediatrics",
        "Orthopedic",
        "Oncology",
        "Dermatology",
        "Endocrine",
        "Respiratory",
        "General",
      ],
      default: "General",
      index: true,
    },
    status: {
      type: String,
      enum: ["Active", "In Treatment", "Recovered", "Critical"],
      default: "Active",
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    admissionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for high-throughput queries & sorting
patientSchema.index({ doctorId: 1, status: 1 });
patientSchema.index({ conditionCategory: 1, admissionDate: -1 });

export default mongoose.model("Patient", patientSchema);