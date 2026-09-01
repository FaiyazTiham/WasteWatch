const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'শিরোনাম দিন'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'বিবরণ দিন'],
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Household',
        'Plastic',
        'Construction',
        'Industrial',
        'Drain/Sewer',
        'Roadside',
        'Water',
        'Other',
      ],
    },
    severity: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['reported', 'verified', 'assigned', 'in_progress', 'cleaned', 'closed'],
      default: 'reported',
    },
    // GeoJSON Point format for Map & Spatial Querying
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    address: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    beforeAfterImages: {
      before: { type: String, default: '' },
      after: { type: String, default: '' },
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// MongoDB 2dsphere index (ম্যাপে কাছাকাছি লোকেশন খোঁজার জন্য)
reportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Report', reportSchema);