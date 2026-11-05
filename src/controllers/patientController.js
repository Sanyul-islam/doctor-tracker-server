import mongoose from "mongoose";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";

// create Patient
export const createPatient = async (req, res) => {
  try {
    const {
      name,
      age,
      gender,
      doctorId,
      condition,
      conditionCategory,
      status,
      phone,
      email,
      admissionDate,
      notes,
    } = req.body;

    // Validate required fields
    if (!name || !condition) {
      return res.status(400).json({
        success: false,
        message: "Patient name and condition are required",
      });
    }

    // Validate Doctor ID if provided
    if (doctorId) {
      if (!mongoose.isValidObjectId(doctorId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor ID",
        });
      }

      const doctor = await Doctor.findById(doctorId);

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: "Doctor not found",
        });
      }
    }

    // Create Patient
    const patient = await Patient.create({
      name,
      age,
      gender,
      doctorId: doctorId || null,
      condition,
      conditionCategory,
      status,
      phone,
      email,
      admissionDate,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Patient created successfully",
      patient,
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create patient",
      error: error.message,
    });
  }
};

// all patients
export const getAllPatients = async (req, res) => {
  try {
    const {
      search,
      gender,
      status,
      conditionCategory,
      doctorId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Pagination
    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * perPage;

    // Build filter
    const filter = {};

    // Search by name, email, condition, or phone
    if (search?.trim()) {
      const escapedSearch = search
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      filter.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { email: { $regex: escapedSearch, $options: "i" } },
        { condition: { $regex: escapedSearch, $options: "i" } },
        { phone: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    // Exact filters
    if (gender) filter.gender = gender;
    if (status) filter.status = status;
    if (conditionCategory) filter.conditionCategory = conditionCategory;

    // Filter by Doctor
    if (doctorId) {
      if (!mongoose.isValidObjectId(doctorId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid doctor ID",
        });
      }

      filter.doctorId = doctorId;
    }

    // Admission date range filter
    if (startDate || endDate) {
      filter.admissionDate = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date",
          });
        }

        filter.admissionDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        filter.admissionDate.$lte = end;
      }

      if (
        startDate &&
        endDate &&
        filter.admissionDate.$gte > filter.admissionDate.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be later than end date",
        });
      }
    }

    // Fetch patients and total count
    const [patients, totalPatients] = await Promise.all([
      Patient.find(filter)
        .populate("doctorId", "name specialization hospital")
        .sort({ admissionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Patient.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalPatients / perPage);

    return res.status(200).json({
      success: true,
      message: "Patients fetched successfully",
      pagination: {
        currentPage,
        limit: perPage,
        totalPatients,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
      patients,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
    });
  }
};

// get single patient
export const getSinglePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Patient ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    // Find Patient and populate Doctor
    const patient = await Patient.findById(id)
      .populate("doctorId", "name specialization hospital phone email")
      .lean();

    // Check if Patient exists
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient details fetched successfully",
      patient,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patient details",
      error: error.message,
    });
  }
};

// update patient
export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Patient ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    // Allowed fields
    const allowedFields = [
      "name",
      "age",
      "gender",
      "doctorId",
      "condition",
      "conditionCategory",
      "status",
      "phone",
      "email",
      "admissionDate",
      "notes",
    ];

    const updateData = {};

    allowedFields.forEach((field) => {
      if (Object.hasOwn(req.body, field)) {
        updateData[field] = req.body[field];
      }
    });

    // Check empty request body
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one field to update",
      });
    }

    // Validate Doctor ID if provided
    if (Object.hasOwn(updateData, "doctorId")) {
      if (updateData.doctorId === null || updateData.doctorId === "") {
        updateData.doctorId = null;
      } else {
        if (!mongoose.isValidObjectId(updateData.doctorId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid doctor ID",
          });
        }

        const doctor = await Doctor.findById(updateData.doctorId);

        if (!doctor) {
          return res.status(404).json({
            success: false,
            message: "Doctor not found",
          });
        }
      }
    }

    // Normalize email
    if (typeof updateData.email === "string") {
      updateData.email = updateData.email.trim().toLowerCase();
    }

    // Update Patient
    const patient = await Patient.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    ).populate("doctorId", "name specialization hospital");

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Patient updated successfully",
      patient,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update patient",
      error: error.message,
    });
  }
};

// delete patient
export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Patient ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid patient ID",
      });
    }

    // Check if Patient exists
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Delete Patient
    await Patient.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete patient",
      error: error.message,
    });
  }
};