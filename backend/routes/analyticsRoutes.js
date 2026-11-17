const express = require('express');
const Stone = require('../models/Stone');
const requireAdmin = require('../middleware/adminAuth');

const router = express.Router();

router.get(['/', '/dashboard-stats'], requireAdmin, async (req, res) => {
  try {
    const [stats, categoryStats] = await Promise.all([
      Stone.aggregate([
      {
        $facet: {
          totals: [{
            $group: {
              _id: null,
              totalStones: { $sum: 1 },
              totalQuantity: { $sum: { $ifNull: ['$quantity', 0] } },
              totalBlueSapphires: {
                $sum: {
                  $cond: [{ $regexMatch: { input: { $ifNull: ['$title', ''] }, regex: 'blue', options: 'i' } }, 1, 0]
                }
              }
            }
          }],
          weights: [
            {
              $match: {
                $expr: {
                  $regexMatch: {
                    input: { $toString: { $ifNull: ['$weight', ''] } },
                    regex: '^-?\\d+(\\.\\d+)?$'
                  }
                }
              }
            },
            { $addFields: { numericWeight: { $toDouble: '$weight' } } },
            {
              $group: {
                _id: null,
                avgCaratWeight: { $avg: '$numericWeight' },
                maxCaratWeight: { $max: '$numericWeight' },
                minCaratWeight: { $min: '$numericWeight' }
              }
            }
          ],
          byColor: [
            { $group: { _id: { $ifNull: ['$color', 'Unspecified'] }, value: { $sum: 1 } } },
            { $sort: { value: -1 } },
            { $limit: 8 },
            { $project: { _id: 0, name: '$_id', value: 1 } }
          ],
          byCategory: [
            { $group: { _id: { $ifNull: ['$categoryId', null] }, value: { $sum: 1 } } },
            { $sort: { value: -1 } },
            { $limit: 8 },
            { $lookup: { from: 'gemcategories', localField: '_id', foreignField: '_id', as: 'category' } },
            { $project: { _id: 0, categoryId: { $toString: '$_id' }, name: { $ifNull: [{ $arrayElemAt: ['$category.title', 0] }, 'Uncategorized'] }, value: 1 } }
          ]
        }
      }
      ]),
      Stone.aggregate([
        { $addFields: { numericWeight: { $cond: [{ $regexMatch: { input: { $toString: { $ifNull: ['$weight', ''] } }, regex: '^\\d+(\\.\\d+)?$' } }, { $toDouble: '$weight' }, null] } } },
        { $group: { _id: '$categoryId', stones: { $sum: 1 }, quantity: { $sum: { $ifNull: ['$quantity', 0] } }, averageWeight: { $avg: '$numericWeight' }, averagePrice: { $avg: '$price' }, minWeight: { $min: '$numericWeight' }, maxWeight: { $max: '$numericWeight' } } },
        { $lookup: { from: 'gemcategories', localField: '_id', foreignField: '_id', as: 'category' } },
        { $project: { _id: 0, categoryId: { $toString: '$_id' }, name: { $ifNull: [{ $arrayElemAt: ['$category.title', 0] }, 'Uncategorized'] }, stones: 1, quantity: 1, averageWeight: { $ifNull: ['$averageWeight', 0] }, averagePrice: { $ifNull: ['$averagePrice', 0] }, minWeight: { $ifNull: ['$minWeight', 0] }, maxWeight: { $ifNull: ['$maxWeight', 0] } } },
        { $sort: { stones: -1 } }
      ])
    ]);

    const facets = stats?.[0] || {};
    const totals = facets.totals?.[0] || {};
    const weights = facets.weights?.[0] || {};
    res.json({
      totalStones: totals.totalStones || 0,
      totalQuantity: totals.totalQuantity || 0,
      totalBlueSapphires: totals.totalBlueSapphires || 0,
      avgCaratWeight: weights.avgCaratWeight || 0,
      maxCaratWeight: weights.maxCaratWeight || 0,
      minCaratWeight: weights.minCaratWeight || 0,
      byColor: facets.byColor || [],
      colorDistribution: facets.byColor || [],
      categoryDistribution: facets.byCategory || [],
      categoryOverview: categoryStats || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load analytics', error: error.message });
  }
});

module.exports = router;
