const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'tr',
    },
    date: {
      type: Date,
      default: Date.now,
    },
    image: {
      filename: String,
      originalname: String,
      mimetype: String,
      size: Number,
      url: String,
      uploadedAt: Date,
    },
    projectType: {
      type: String,
      trim: true,
      lowercase: true,
      default: 'workplace',
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Content', contentSchema);
