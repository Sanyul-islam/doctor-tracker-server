import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import mongoose from "mongoose";

// Create Doctor
export const createDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
      hospital,
      experience,
      joiningDate,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !specialization || !hospital) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, specialization and hospital are required",
      });
    }

    // Check duplicate email
    const existingDoctor = await Doctor.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: "A doctor with this email already exists",
      });
    }

    // Create doctor
    const doctor = await Doctor.create({
      name,
      email,
      phone,
      specialization,
      hospital,
      experience,
      joiningDate,
    });

    return res.status(201).json({
      success: true,
      message: "Doctor created successfully",
      doctor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create doctor",
      error: error.message,
    });
  }
};

// Get All Doctors with Search, Filtering and Pagination
export const getAllDoctors = async (req, res) => {
  try {
    const {
      search,
      specialization,
      hospital,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = req.query;

    // Pagination validation
    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(limit) || 10));

    // Build query filter
    const filter = {};

    // Search by name, email, specialization or hospital
    if (search?.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i",
      );

      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { specialization: searchRegex },
        { hospital: searchRegex },
      ];
    }

    // Filter by specialization
    if (specialization) {
      filter.specialization = specialization;
    }

    // Filter by hospital
    if (hospital) {
      filter.hospital = hospital;
    }

    // Date-wise filtering
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date",
          });
        }

        start.setHours(0, 0, 0, 0);
        filter.createdAt.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }

      if (
        filter.createdAt.$gte &&
        filter.createdAt.$lte &&
        filter.createdAt.$gte > filter.createdAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date cannot be after end date",
        });
      }
    }

    // Calculate pagination
    const skip = (currentPage - 1) * perPage;

    // Fetch doctors and total count
    const [doctors, totalDoctors] = await Promise.all([
      Doctor.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(perPage)
        .lean(),

      Doctor.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalDoctors / perPage);

    return res.status(200).json({
      success: true,
      message: "Doctors fetched successfully",
      pagination: {
        currentPage,
        limit: perPage,
        totalDoctors,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
      doctors,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctors",
      error: error.message,
    });
  }
};

// Get Single Doctor with Patients
export const getSingleDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const { page = 1, limit = 10 } = req.query;

    // Validate Doctor ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    // Validate pagination
    const currentPage = Math.max(1, Number(page) || 1);
    const perPage = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (currentPage - 1) * perPage;

    // Find doctor and populate patients
    const [doctor, totalPatients] = await Promise.all([
      Doctor.findById(id)
        .populate({
          path: "patients",
          select:
            "name age gender condition conditionCategory status phone email admissionDate",
          options: {
            sort: { admissionDate: -1 },
            skip,
            limit: perPage,
          },
        })
        .lean(),

      // Count patients belonging to this doctor
      mongoose.model("Patient").countDocuments({
        doctorId: id,
      }),
    ]);

    // Check doctor existence
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const totalPages = Math.ceil(totalPatients / perPage);

    return res.status(200).json({
      success: true,
      message: "Doctor details fetched successfully",
      doctor,
      patientPagination: {
        currentPage,
        limit: perPage,
        totalPatients,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch doctor details",
      error: error.message,
    });
  }
};

// Update Doctor
export const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Doctor ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    // Only allow these fields to be updated
    const allowedFields = [
      "name",
      "email",
      "phone",
      "specialization",
      "hospital",
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

    // Normalize email
    if (updateData.email) {
      updateData.email = updateData.email.trim().toLowerCase();
    }

    // Check duplicate email
    if (updateData.email) {
      const existingDoctor = await Doctor.findOne({
        email: updateData.email,
        _id: { $ne: id },
      });

      if (existingDoctor) {
        return res.status(409).json({
          success: false,
          message: "A doctor with this email already exists",
        });
      }
    }

    // Update Doctor
    const doctor = await Doctor.findByIdAndUpdate(
      id,
      { $set: updateData },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Doctor updated successfully",
      doctor,
    });
  } catch (error) {
    // Handle duplicate email error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A doctor with this email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update doctor",
      error: error.message,
    });
  }
};

// delete Doctor
export const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate Doctor ID
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid doctor ID",
      });
    }

    // Check if Doctor exists
    const doctor = await Doctor.findById(id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Check assigned patients
    const patientCount = await Patient.countDocuments({
      doctorId: id,
    });

    if (patientCount > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete doctor. Assigned patients exist.",
        patientCount,
      });
    }

    // Delete Doctor
    await Doctor.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete doctor",
      error: error.message,
    });
  }
};