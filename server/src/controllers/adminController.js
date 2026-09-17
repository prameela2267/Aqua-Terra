const User = require('../models/User');
const SoilReading = require('../models/SoilReading');
const PumpLog = require('../models/PumpLog');
const Recommendation = require('../models/Recommendation');

// @desc    Get all registered users with summary metrics
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    // Attach quick stats per user
    const userStats = await Promise.all(
      users.map(async (u) => {
        const [readingsCount, pumpSessionsCount, latestReading] = await Promise.all([
          SoilReading.countDocuments({ userId: u._id }),
          PumpLog.countDocuments({ userId: u._id }),
          SoilReading.findOne({ userId: u._id }).sort({ timestamp: -1 })
        ]);

        return {
          ...u.toObject(),
          stats: {
            readingsCount,
            pumpSessionsCount,
            latestMoisture: latestReading ? latestReading.moisturePercent : null
          }
        };
      })
    );

    res.status(200).json({
      success: true,
      count: users.length,
      users: userStats
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user status (Active / Inactive)
// @route   PATCH /api/admin/users/:id/status
// @access  Private/Admin
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.role === 'admin' && user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own administrative account'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.name} has been ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user and associated records
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own administrative account'
      });
    }

    // Cascade delete telemetry logs
    await Promise.all([
      SoilReading.deleteMany({ userId: user._id }),
      PumpLog.deleteMany({ userId: user._id }),
      Recommendation.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id)
    ]);

    res.status(200).json({
      success: true,
      message: `User ${user.name} and related records deleted successfully`
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get detailed telemetry and pump history of any user
// @route   GET /api/admin/users/:id/history
// @access  Private/Admin
const getUserHistory = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const [soilReadings, pumpLogs, recommendations] = await Promise.all([
      SoilReading.find({ userId: user._id }).sort({ timestamp: -1 }).limit(30),
      PumpLog.find({ userId: user._id }).sort({ startedAt: -1 }).limit(20),
      Recommendation.find({ userId: user._id }).sort({ timestamp: -1 }).limit(20)
    ]);

    res.status(200).json({
      success: true,
      user,
      history: {
        soilReadings,
        pumpLogs,
        recommendations
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getUserHistory
};
