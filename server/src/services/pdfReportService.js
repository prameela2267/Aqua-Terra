const PDFDocument = require('pdfkit');
const User = require('../models/User');
const SoilReading = require('../models/SoilReading');
const WeatherLog = require('../models/WeatherLog');
const Recommendation = require('../models/Recommendation');
const PumpLog = require('../models/PumpLog');

/**
 * PDF Report Generator Service using PDFKit
 */
class PDFReportService {
  /**
   * Builds and streams a structured PDF report to an Express response or writable stream
   * @param {string|ObjectId} userId
   * @param {Date} fromDate
   * @param {Date} toDate
   * @param {WritableStream} outputStream
   */
  async generateReport(userId, fromDate, toDate, outputStream) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const dateFilter = {
      userId,
      timestamp: { $gte: fromDate, $lte: toDate }
    };

    // Fetch data concurrently
    const [soilReadings, weatherLogs, recommendations, pumpLogs] = await Promise.all([
      SoilReading.find(dateFilter).sort({ timestamp: 1 }),
      WeatherLog.find(dateFilter).sort({ timestamp: 1 }),
      Recommendation.find(dateFilter).sort({ timestamp: 1 }),
      PumpLog.find({
        userId,
        startedAt: { $gte: fromDate, $lte: toDate }
      }).sort({ startedAt: 1 })
    ]);

    // Calculate aggregated metrics
    const moistureValues = soilReadings.map(r => r.moisturePercent);
    const avgMoisture = moistureValues.length
      ? (moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length).toFixed(1)
      : 'N/A';
    const minMoisture = moistureValues.length ? Math.min(...moistureValues).toFixed(1) : 'N/A';
    const maxMoisture = moistureValues.length ? Math.max(...moistureValues).toFixed(1) : 'N/A';

    const tempValues = weatherLogs.map(w => w.temperature);
    const avgTemp = tempValues.length
      ? (tempValues.reduce((a, b) => a + b, 0) / tempValues.length).toFixed(1)
      : 'N/A';

    const irrigateRecommendations = recommendations.filter(r => r.decision === 'IRRIGATE_NOW').length;
    const noIrrigateRecommendations = recommendations.filter(r => r.decision === 'NO_IRRIGATION_NEEDED').length;

    // Pump stats
    const totalPumpSessions = pumpLogs.length;
    const totalRuntimeMinutes = pumpLogs.reduce((acc, log) => acc + (log.durationMinutes || 0), 0);
    const totalWaterUsedLiters = pumpLogs.reduce((acc, log) => acc + (log.estimatedWaterUsedLiters || (log.durationMinutes || 0) * 15), 0);
    // Estimated water saved by not irrigating when rain/moisture was sufficient (approx 450L per prevented cycle)
    const estimatedWaterSavedLiters = noIrrigateRecommendations * 450;

    // Create PDF Document
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(outputStream);

    // Color Palette
    const primaryColor = '#059669'; // Emerald
    const darkColor = '#0f172a';    // Slate 900
    const grayColor = '#475569';    // Slate 600
    const lightBg = '#f0fdf4';      // Emerald light tint

    // Header Branding Bar
    doc.rect(40, 40, 515, 60).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('SMART IRRIGATION SYSTEM', 60, 52);
    doc.fontSize(10).font('Helvetica').text('Agricultural Telemetry & Water Conservation Audit Report', 60, 78);

    doc.moveDown(3);

    // Metadata Section
    const startY = 120;
    doc.fillColor(darkColor).fontSize(14).font('Helvetica-Bold').text('Farmer & Field Details', 40, startY);
    doc.rect(40, startY + 18, 515, 64).fill('#f8fafc').stroke('#e2e8f0');

    doc.fillColor(darkColor).fontSize(10).font('Helvetica-Bold').text('Farmer Name:', 55, startY + 28);
    doc.font('Helvetica').text(user.name, 140, startY + 28);

    doc.font('Helvetica-Bold').text('Email Address:', 300, startY + 28);
    doc.font('Helvetica').text(user.email, 390, startY + 28);

    doc.font('Helvetica-Bold').text('Field City:', 55, startY + 48);
    doc.font('Helvetica').text(user.city || 'Bengaluru', 140, startY + 48);

    doc.font('Helvetica-Bold').text('Crop Type:', 300, startY + 48);
    doc.font('Helvetica').text(user.cropType || 'Vegetables', 390, startY + 48);

    doc.font('Helvetica-Bold').text('Date Range:', 55, startY + 68);
    doc.font('Helvetica').text(
      `${fromDate.toISOString().split('T')[0]}  to  ${toDate.toISOString().split('T')[0]}`,
      140,
      startY + 68
    );

    // Summary Metric Cards
    const cardY = 220;
    const cardWidth = 120;
    const cardHeight = 65;
    const cards = [
      { label: 'Avg Soil Moisture', val: `${avgMoisture}%`, sub: `Range: ${minMoisture}% - ${maxMoisture}%` },
      { label: 'Avg Ambient Temp', val: `${avgTemp}°C`, sub: `Readings: ${weatherLogs.length}` },
      { label: 'Total Water Used', val: `${Math.round(totalWaterUsedLiters)} L`, sub: `${totalRuntimeMinutes.toFixed(1)} mins pump` },
      { label: 'Water Conserved', val: `${Math.round(estimatedWaterSavedLiters)} L`, sub: `${noIrrigateRecommendations} cycles deferred` }
    ];

    cards.forEach((card, idx) => {
      const x = 40 + idx * (cardWidth + 11.5);
      doc.rect(x, cardY, cardWidth, cardHeight).fill(lightBg).stroke('#bbf7d0');
      doc.fillColor(grayColor).fontSize(8).font('Helvetica-Bold').text(card.label.toUpperCase(), x + 8, cardY + 10);
      doc.fillColor(primaryColor).fontSize(15).font('Helvetica-Bold').text(card.val, x + 8, cardY + 25);
      doc.fillColor(grayColor).fontSize(7).font('Helvetica').text(card.sub, x + 8, cardY + 46);
    });

    // Decision Breakdown
    const decisionY = 305;
    doc.fillColor(darkColor).fontSize(13).font('Helvetica-Bold').text('Irrigation Decision Engine Summary', 40, decisionY);
    doc.rect(40, decisionY + 16, 515, 55).fill('#ffffff').stroke('#e2e8f0');

    doc.fillColor('#047857').fontSize(11).font('Helvetica-Bold').text(`• IRRIGATE_NOW Recommendations: ${irrigateRecommendations}`, 55, decisionY + 26);
    doc.fillColor('#1e40af').text(`• NO_IRRIGATION_NEEDED Saved Decisions: ${noIrrigateRecommendations}`, 55, decisionY + 44);

    // Recent Pump Sessions Table
    const tableY = 390;
    doc.fillColor(darkColor).fontSize(13).font('Helvetica-Bold').text('Pump Activity Log (Recent Sessions)', 40, tableY);

    // Table Header
    const thY = tableY + 20;
    doc.rect(40, thY, 515, 20).fill('#0f172a');
    doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
    doc.text('Start Time', 50, thY + 5);
    doc.text('Stop Time', 170, thY + 5);
    doc.text('Duration (Min)', 290, thY + 5);
    doc.text('Water (Liters)', 380, thY + 5);
    doc.text('Trigger', 470, thY + 5);

    let rowY = thY + 20;
    const displayPumpLogs = pumpLogs.slice(0, 8); // top recent rows

    if (displayPumpLogs.length === 0) {
      doc.rect(40, rowY, 515, 25).fill('#f8fafc').stroke('#e2e8f0');
      doc.fillColor(grayColor).fontSize(9).font('Helvetica').text('No pump operations recorded within this date range.', 55, rowY + 8);
      rowY += 25;
    } else {
      displayPumpLogs.forEach((log, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, rowY, 515, 20).fill(bg).stroke('#f1f5f9');
        doc.fillColor(darkColor).fontSize(8).font('Helvetica');

        const startTime = log.startedAt ? new Date(log.startedAt).toLocaleString() : 'N/A';
        const stopTime = log.stoppedAt ? new Date(log.stoppedAt).toLocaleString() : 'In Progress';
        const dur = (log.durationMinutes || 0).toFixed(1);
        const water = Math.round(log.estimatedWaterUsedLiters || (log.durationMinutes || 0) * 15);

        doc.text(startTime, 50, rowY + 5);
        doc.text(stopTime, 170, rowY + 5);
        doc.text(`${dur} min`, 290, rowY + 5);
        doc.text(`${water} L`, 380, rowY + 5);
        doc.text(log.triggerType || 'MANUAL', 470, rowY + 5);

        rowY += 20;
      });
    }

    // Environmental Impact & Footer
    const footerY = 740;
    doc.rect(40, footerY - 45, 515, 40).fill('#ecfdf5').stroke('#6ee7b7');
    doc.fillColor('#065f46').fontSize(9).font('Helvetica-Bold')
      .text('Sustainability Insight:', 55, footerY - 37);
    doc.font('Helvetica').fontSize(8.5)
      .text(`Smart sensor scheduling avoided an estimated ${Math.round(estimatedWaterSavedLiters)} Liters of unnecessary watering, reducing root-rot hazard and conserving local groundwater.`, 55, footerY - 24, { width: 490 });

    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica')
      .text(`Generated on ${new Date().toLocaleString()} | Smart Irrigation System | Certified Report`, 40, footerY + 10, { align: 'center', width: 515 });

    doc.end();
  }
}

module.exports = new PDFReportService();
