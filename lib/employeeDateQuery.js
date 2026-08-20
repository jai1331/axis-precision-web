const moment = require('moment');

/**
 * Parse DD-MM-YYYY (formatDate helper output) to JS Date boundaries.
 */
function parseDashboardDate(value, boundary) {
  const parsed = moment(value, 'DD-MM-YYYY', true);
  if (!parsed.isValid()) return null;
  return boundary === 'start' ? parsed.startOf('day').toDate() : parsed.endOf('day').toDate();
}

/**
 * Build a MongoDB filter that matches both string and Date `date` fields via $toDate.
 * Returns {} when no bounds → all records.
 */
function buildEmployeeDateFilter(startDate, endDate) {
  if (!startDate && !endDate) return {};

  if (!startDate && endDate) {
    const end = parseDashboardDate(endDate, 'end');
    if (!end) return {};
    return {
      $expr: { $lte: [{ $toDate: '$date' }, end] },
    };
  }

  const start = parseDashboardDate(startDate, 'start');
  const end = endDate ? parseDashboardDate(endDate, 'end') : null;

  if (startDate === endDate && end) {
    return {
      $expr: { $lte: [{ $toDate: '$date' }, end] },
    };
  }

  if (start && end) {
    return {
      $expr: {
        $and: [
          { $gte: [{ $toDate: '$date' }, start] },
          { $lte: [{ $toDate: '$date' }, end] },
        ],
      },
    };
  }

  if (start) {
    return {
      $expr: { $gte: [{ $toDate: '$date' }, start] },
    };
  }

  return {};
}

/**
 * Fetch employee records sorted newest-first, normalizing date for sort.
 */
async function fetchEmployeeRecords(EmployeeModel, startDate, endDate) {
  const filter = buildEmployeeDateFilter(startDate, endDate);

  return EmployeeModel.aggregate([
    { $match: filter },
    { $addFields: { _sortDate: { $toDate: '$date' } } },
    { $sort: { _sortDate: -1 } },
    { $project: { _sortDate: 0 } },
  ]);
}

module.exports = {
  buildEmployeeDateFilter,
  fetchEmployeeRecords,
  parseDashboardDate,
};
