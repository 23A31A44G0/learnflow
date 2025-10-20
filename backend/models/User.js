const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isAlphaTester: {
    type: Boolean,
    default: false
  },
  alphaTesterType: {
    type: String,
    enum: ['power_user', 'casual_user'],
    default: 'casual_user'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  stats: {
    totalQuestions: {
      type: Number,
      default: 0
    },
    correctAnswers: {
      type: Number,
      default: 0
    },
    masteryScore: {
      type: Number,
      default: 0
    }
  },
  gamification: {
    points: {
      type: Number,
      default: 0
    },
    level: {
      type: Number,
      default: 1
    },
    streakCount: {
      type: Number,
      default: 0
    },
    lastActivityDate: {
      type: Date,
      default: null
    },
    badges: [{
      id: String,
      name: String,
      description: String,
      icon: String,
      category: String,
      unlockedAt: {
        type: Date,
        default: Date.now
      }
    }],
    achievements: [{
      type: {
        type: String,
        required: true
      },
      value: {
        type: Number,
        required: true
      },
      unlockedAt: {
        type: Date,
        default: Date.now
      }
    }],
    dailyGoals: {
      questionsTarget: {
        type: Number,
        default: 5
      },
      studyTimeTarget: {
        type: Number,
        default: 30 // minutes
      },
      reflectionsTarget: {
        type: Number,
        default: 1
      }
    },
    todayProgress: {
      date: {
        type: Date,
        default: Date.now
      },
      questionsAnswered: {
        type: Number,
        default: 0
      },
      studyTimeMinutes: {
        type: Number,
        default: 0
      },
      reflectionsCompleted: {
        type: Number,
        default: 0
      }
    }
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
