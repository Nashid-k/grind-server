import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: true },
    role: { type: String, required: true },
    status: { 
        type: String, 
        default: 'applied', 
        enum: ['applied', 'shortlisted', 'interview_scheduled', 'interview_completed', 'offer_received', 'rejected', 'on_hold'] 
    },
    date: { type: String, required: true }, // YYYY-MM-DD
    link: { type: String },
    portal: { type: String },
    notes: { type: String },
    interviewDate: { type: String },
    interviewRound: { type: String }, // HR, Tech, Manager, etc.
    interviewMode: { type: String }, // Online, Onsite
    jd: { type: String },
    salary: { type: String },
    followUps: [{
        date: String,
        type: String, // email, linkedin, call
        notes: String,
        completed: { type: Boolean, default: false }
    }],
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Job', jobSchema);
