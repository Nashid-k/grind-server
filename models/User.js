import mongoose from 'mongoose';

// Generate a random 6-character friend code
const generateFriendCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
};

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true }, // Email for Google Users
    email: { type: String, unique: true }, // Redundant but good for queries
    password: { type: String }, // Optional for Google Users
    name: { type: String },
    avatar: { type: String },
    googleId: { type: String },
    createdAt: { type: Date, default: Date.now },
    hasSeenWelcome: { type: Boolean, default: false },
    xp: { type: Number, default: 0 },
    badges: [{ type: String }], // Array of Badge IDs
    streak: { 
        count: { type: Number, default: 0 },
        lastDate: { type: String } // YYYY-MM-DD
    },
    settings: {
        dailyTarget: { type: Number, default: 5 }
    },
    // Friends System
    friendCode: { type: String, unique: true, default: generateFriendCode },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Incoming requests
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // Outgoing requests
});

// Ensure friendCode uniqueness on save
userSchema.pre('save', async function(next) {
    if (this.isNew && !this.friendCode) {
        let code = generateFriendCode();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await mongoose.model('User').findOne({ friendCode: code });
            if (!existing) {
                this.friendCode = code;
                break;
            }
            code = generateFriendCode();
            attempts++;
        }
    }
    next();
});

export default mongoose.model('User', userSchema);

