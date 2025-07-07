const reportingServiceBackend = require('../services/reportingServiceBackend');

const getReport = async (req, res, next) => {
  const { reportKey } = req.params;
  const filters = req.query; // e.g., ?category=Widgets&location=A1
  try {
    const reportData = await reportingServiceBackend.getReportData(reportKey, filters);
    if (reportData === null || (Array.isArray(reportData) && reportData.length === 0 && reportKey !== 'some_report_that_can_be_empty')) {
        // Decide if empty data is a 404 or just an empty result based on report type
        // For now, just return empty array if service gives it.
    }
    res.json(reportData);
  } catch (error) {
    // Handle specific error from service e.g. reportKey not found
    if (error.message.includes("not implemented or recognized")) {
        res.status(404);
    }
    next(error);
  }
};

module.exports = { getReport };
