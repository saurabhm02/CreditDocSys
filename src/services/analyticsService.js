const ScanHistory = require('../models/ScanHistory.model');
const { User } = require('../models/index');
const Document = require('../models/Document.model');
const moment = require('moment');
const logger = require('../utils/logger');

const getAnalytics = async (req, res) => {
  try {
    logger.info('Generating analytics data');
    
    const scansByDay = await ScanHistory.aggregate([
      {
        $match: {
          createdAt: { $gte: moment().subtract(7, 'days').toDate() }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    logger.debug(`Generated scans by day data for the last 7 days`);

    const topUsers = await ScanHistory.aggregate([
      {
        $group: {
          _id: '$user',
          scanCount: { $sum: 1 }
        }
      },
      { $sort: { scanCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $project: {
          _id: 1,
          scanCount: 1,
          username: { $arrayElemAt: ['$userInfo.username', 0] },
          email: { $arrayElemAt: ['$userInfo.email', 0] }
        }
      }
    ]);
    const totalUsers = await User.countDocuments();
    const totalDocuments = await Document.countDocuments();
    logger.isInfoEnabled(`Total documents count: ${totalDocuments}`);
    
    const totalScans = await ScanHistory.countDocuments();
    logger.info(`Total scans count: ${totalScans}`);

    const aiUsageStats = await ScanHistory.aggregate([
      {
        $group: {
          _id: '$usedAI',
          count: { $sum: 1 }
        }
      }
    ]);
    logger.debug(`Generated AI usage statistics`);

    logger.info('Analytics data generated successfully');
    res.json({
      scansByDay,
      topUsers,
      totalUsers,
      totalDocuments,
      totalScans,
      aiUsageStats
    });
  } catch (error) {
    logger.error(`Error generating analytics data: ${error.message}`);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAnalytics }; 