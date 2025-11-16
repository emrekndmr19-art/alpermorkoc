const mongoose = require('mongoose');

const SiteCopySchema = new mongoose.Schema(
  {
    language: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    entries: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

module.exports = mongoose.model('SiteCopy', SiteCopySchema);
