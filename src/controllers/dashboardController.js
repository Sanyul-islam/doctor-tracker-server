import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalDoctors,
      totalPatients,
      activePatients,
      inTreatmentPatients,
      recoveredPatients,
      criticalPatients,
      recentPatients,
      patientsByCategory,
    ] = await Promise.all([
      Doctor.countDocuments(),

      Patient.countDocuments(),

      Patient.countDocuments({ status: "Active" }),

      Patient.countDocuments({ status: "In Treatment" }),

      Patient.countDocuments({ status: "Recovered" }),

      Patient.countDocuments({ status: "Critical" }),

      Patient.find()
        .populate("doctorId", "name specialization")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      Patient.aggregate([
        {
          $group: {
            _id: "$conditionCategory",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      stats: {
        totalDoctors,
        totalPatients,
        activePatients,
        inTreatmentPatients,
        recoveredPatients,
        criticalPatients,
      },
      patientsByCategory,
      recentPatients,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message,
    });
  }
};

// get patients by Doctor
export const getPatientsPerDoctor = async (req, res) => {
  try {
    const patientsPerDoctor = await Doctor.aggregate([
      {
        $lookup: {
          from: "patients",
          localField: "_id",
          foreignField: "doctorId",
          as: "patients",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          specialization: 1,
          hospital: 1,
          totalPatients: { $size: "$patients" },
        },
      },
      {
        $sort: {
          totalPatients: -1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Patients per doctor fetched successfully",
      patientsPerDoctor,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch patients per doctor",
      error: error.message,
    });
  }
};

// get new patients by month
export const getPatientsByMonth = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const patientsByMonth = await Patient.aggregate([
      {
        $match: {
          admissionDate: {
            $gte: sixMonthsAgo,
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m",
              date: "$admissionDate",
              timezone: "Asia/Dhaka",
            },
          },
          totalPatients: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id",
          totalPatients: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      message: "Monthly patient analytics fetched successfully",
      patientsByMonth,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch monthly patient analytics",
      error: error.message,
    });
  }
};