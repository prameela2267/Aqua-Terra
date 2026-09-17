const pdfReportService = require('../services/pdfReportService');

// @desc    Generate and download PDF report for farmer
// @route   GET /api/reports/:userId
// @access  Private
const generatePdfReport = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Authorization check: User can only access own report unless user is admin
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to download reports for other users.'
      });
    }

    const from = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    to.setHours(23, 59, 59, 999);

    const filename = `Smart_Irrigation_Report_${userId}_${new Date().toISOString().split('T')[0]}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await pdfReportService.generateReport(userId, from, to, res);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generatePdfReport
};
