const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'নাম দেওয়া বাধ্যতামূলক'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'ইমেইল দেওয়া বাধ্যতামূলক'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'পাসওয়ার্ড দেওয়া বাধ্যতামূলক'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'staff'],
      default: 'user',
    },
    profileImage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);