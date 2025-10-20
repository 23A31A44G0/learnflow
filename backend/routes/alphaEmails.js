const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const User = require('../models/User');

// Email transporter setup (configure based on your email service)
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    // For Gmail
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS // Use app-specific password for Gmail
    }
    
    // For other services, uncomment and configure:
    /*
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
    */
  });
};

// Alpha tester onboarding email templates
const emailTemplates = {
  welcome: (user) => ({
    subject: '🚀 Welcome to LearnFlow Alpha Testing!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 2rem; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 2rem;">🎉 You're In!</h1>
          <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">Welcome to LearnFlow Alpha Testing</p>
        </div>
        
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #333; margin-bottom: 1rem;">Hey ${user.name}! 👋</h2>
          
          <p style="line-height: 1.6; color: #555;">
            You're officially part of our exclusive Alpha Testing squad! You're about to help shape the future of AI-powered studying.
          </p>
          
          <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
            <h3 style="margin-top: 0; color: #3b82f6;">🎯 Your Mission (If You Choose to Accept It):</h3>
            <ul style="color: #555; line-height: 1.6;">
              <li>Use LearnFlow for your actual studying over the next week</li>
              <li>Generate questions from your real notes and textbooks</li>
              <li>Try the practice mode at least 3 times</li>
              <li>Test the spaced repetition feature for 3+ days</li>
              <li>Share honest feedback (we love brutal honesty! 😅)</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.FRONTEND_URL}/login" style="background: #3b82f6; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              🚀 Start Testing Now
            </a>
          </div>
          
          <div style="background: #eff6ff; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
            <h3 style="margin-top: 0; color: #1e40af;">💬 Join Our Alpha Squad Chat</h3>
            <p style="margin-bottom: 1rem; color: #555;">
              Connect with fellow testers, report bugs, and get help instantly:
            </p>
            <a href="https://chat.whatsapp.com/your-alpha-group" style="color: #25d366; font-weight: 600;">
              📱 WhatsApp Alpha Group
            </a>
          </div>
          
          <div style="border-left: 4px solid #fbbf24; padding: 1rem; margin: 1.5rem 0; background: #fffbeb;">
            <h4 style="margin-top: 0; color: #d97706;">🏆 Alpha Tester Perks:</h4>
            <ul style="margin-bottom: 0; color: #555;">
              <li>Free lifetime access when we launch</li>
              <li>Direct influence on feature development</li>
              <li>Recognition as a founding user</li>
              <li>Exclusive updates and early access to new features</li>
            </ul>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Questions? Just reply to this email or message the Alpha Group. We're here to help!
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Ready to revolutionize studying? Let's do this! 💪
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Cheers,<br>
            The LearnFlow Team
          </p>
        </div>
        
        <div style="padding: 1rem; text-align: center; background: #f8fafc; color: #64748b; font-size: 0.875rem;">
          <p>You're receiving this because you joined LearnFlow Alpha Testing.</p>
          <p>LearnFlow - AI-Powered Active Recall Learning</p>
        </div>
      </div>
    `
  }),
  
  dayOne: (user) => ({
    subject: '🔥 Day 1 Check-in: How\'s LearnFlow treating you?',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="background: #3b82f6; padding: 2rem; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 1.8rem;">Day 1 Check-in! 🔥</h1>
        </div>
        
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #333;">Hey ${user.name}! 👋</h2>
          
          <p style="line-height: 1.6; color: #555;">
            How did your first day with LearnFlow go? We're excited to hear about your experience!
          </p>
          
          <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1e40af;">💡 Pro Tips for Day 2:</h3>
            <ul style="color: #555; line-height: 1.6; margin-bottom: 0;">
              <li>Try uploading a PDF of your textbook or notes</li>
              <li>Generate at least 5 questions from different topics</li>
              <li>Test yourself immediately after generating questions</li>
              <li>Don't worry if the AI isn't perfect - we want to know!</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.FRONTEND_URL}/practice" style="background: #10b981; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; margin-right: 1rem;">
              📚 Continue Practicing
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Any bugs, confusion, or "wow" moments? Drop them in our 
            <a href="https://chat.whatsapp.com/your-alpha-group" style="color: #3b82f6;">Alpha Group</a>!
          </p>
        </div>
      </div>
    `
  }),
  
  engagement: (user, data) => ({
    subject: `🎯 ${user.name}, you're crushing it! ${data.questionsGenerated} questions generated!`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 2rem; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 1.8rem;">You're Crushing It! 🎯</h1>
        </div>
        
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #333;">Amazing progress, ${user.name}! 🚀</h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin: 2rem 0;">
            <div style="text-align: center; padding: 1rem; background: #f0f9ff; border-radius: 8px;">
              <div style="font-size: 2rem; font-weight: bold; color: #3b82f6;">${data.questionsGenerated}</div>
              <div style="color: #64748b; font-size: 0.875rem;">Questions</div>
            </div>
            <div style="text-align: center; padding: 1rem; background: #ecfdf5; border-radius: 8px;">
              <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${data.practiceSessionsCompleted}</div>
              <div style="color: #64748b; font-size: 0.875rem;">Sessions</div>
            </div>
            <div style="text-align: center; padding: 1rem; background: #fef3c7; border-radius: 8px;">
              <div style="font-size: 2rem; font-weight: bold; color: #d97706;">${data.streak}</div>
              <div style="color: #64748b; font-size: 0.875rem;">Day Streak</div>
            </div>
          </div>
          
          <p style="line-height: 1.6; color: #555;">
            Your dedication to testing LearnFlow is incredible! You're exactly the kind of feedback we need to build something amazing.
          </p>
          
          <div style="background: #fffbeb; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #d97706;">🏆 Alpha Tester Badge Unlocked:</h3>
            <p style="color: #555; margin-bottom: 0;">
              <strong>"Study Warrior"</strong> - You've generated 10+ practice questions! 
              You'll be recognized as a founding user when we launch. 🎉
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Keep the feedback coming - every bug report and suggestion makes LearnFlow better for students everywhere!
          </p>
        </div>
      </div>
    `
  }),
  
  feedback: (user) => ({
    subject: '🎤 15-minute feedback chat? Your insights are pure gold!',
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="background: #8b5cf6; padding: 2rem; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 1.8rem;">Your Insights = Pure Gold 🎤</h1>
        </div>
        
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #333;">Hey ${user.name}! 👋</h2>
          
          <p style="line-height: 1.6; color: #555;">
            You've been crushing it with LearnFlow this week! Your usage patterns tell an incredible story, 
            and we'd love to hear the full narrative from you.
          </p>
          
          <div style="background: #faf5ff; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #8b5cf6;">
            <h3 style="margin-top: 0; color: #7c3aed;">What we want to learn from YOU:</h3>
            <ul style="color: #555; line-height: 1.6; margin-bottom: 0;">
              <li>What made you go "wow!" while using LearnFlow?</li>
              <li>What almost made you stop using it?</li>
              <li>How does it compare to your usual study methods?</li>
              <li>What would make this a must-have tool for you?</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="https://calendly.com/your-calendar/alpha-feedback" style="background: #8b5cf6; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              📅 Schedule 15-min Chat
            </a>
          </div>
          
          <div style="background: #ecfef3; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
            <h4 style="margin-top: 0; color: #047857;">🎁 Thank You Gift:</h4>
            <p style="color: #555; margin-bottom: 0;">
              Complete the feedback interview and get a $20 gift card of your choice 
              (Amazon, Starbucks, DoorDash - you pick!). It's our way of saying thanks for your time. ☕
            </p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            Can't do a video call? No problem! You can also fill out our 
            <a href="${process.env.FRONTEND_URL}/feedback" style="color: #8b5cf6;">quick feedback form</a> 
            in the app.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Your insights will literally shape how thousands of students study in the future. Pretty cool, right? 😎
          </p>
        </div>
      </div>
    `
  }),
  
  weeklyDigest: (user, weeklyData) => ({
    subject: `📊 Your LearnFlow Week: ${weeklyData.questionsGenerated} questions, ${weeklyData.studyTime} min studied`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 2rem; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 1.8rem;">Your Study Week 📊</h1>
          <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">Alpha Testing Week ${weeklyData.weekNumber}</p>
        </div>
        
        <div style="padding: 2rem; background: white;">
          <h2 style="color: #333;">Week ${weeklyData.weekNumber} Highlights 🌟</h2>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin: 2rem 0;">
            <div style="text-align: center; padding: 1.5rem; background: #f0f9ff; border-radius: 12px;">
              <div style="font-size: 2.5rem; font-weight: bold; color: #3b82f6; margin-bottom: 0.5rem;">${weeklyData.questionsGenerated}</div>
              <div style="color: #64748b;">Questions Generated</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: #ecfdf5; border-radius: 12px;">
              <div style="font-size: 2.5rem; font-weight: bold; color: #10b981; margin-bottom: 0.5rem;">${weeklyData.studyTime}</div>
              <div style="color: #64748b;">Minutes Studied</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: #fef3c7; border-radius: 12px;">
              <div style="font-size: 2.5rem; font-weight: bold; color: #d97706; margin-bottom: 0.5rem;">${weeklyData.accuracy}%</div>
              <div style="color: #64748b;">Accuracy Rate</div>
            </div>
            <div style="text-align: center; padding: 1.5rem; background: #fce7f3; border-radius: 12px;">
              <div style="font-size: 2.5rem; font-weight: bold; color: #ec4899; margin-bottom: 0.5rem;">${weeklyData.streak}</div>
              <div style="color: #64748b;">Study Streak</div>
            </div>
          </div>
          
          <div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0;">
            <h3 style="margin-top: 0; color: #475569;">📈 How You Compare to Other Alpha Testers:</h3>
            <div style="margin: 1rem 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <span style="color: #64748b;">Questions Generated</span>
                <span style="color: #3b82f6; font-weight: 600;">${weeklyData.percentile}th percentile</span>
              </div>
              <div style="background: #e2e8f0; border-radius: 10px; height: 8px; overflow: hidden;">
                <div style="background: #3b82f6; height: 100%; width: ${weeklyData.percentile}%; transition: width 0.3s ease;"></div>
              </div>
            </div>
            <p style="color: #64748b; font-size: 0.875rem; margin-bottom: 0;">
              You're ${weeklyData.percentile > 80 ? 'crushing it! 🔥' : weeklyData.percentile > 50 ? 'doing great! 👍' : 'off to a good start! 🌱'}
            </p>
          </div>
          
          <div style="background: #fffbeb; padding: 1.5rem; border-radius: 8px; margin: 1.5rem 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0; color: #d97706;">🎯 Challenge for Next Week:</h3>
            <p style="color: #555; margin-bottom: 0;">
              Try the spaced repetition feature for 5 consecutive days. 
              See if you can beat your current accuracy rate of ${weeklyData.accuracy}%!
            </p>
          </div>
          
          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.FRONTEND_URL}/practice" style="background: #f59e0b; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
              📚 Continue Your Streak
            </a>
          </div>
          
          <p style="color: #555; line-height: 1.6; font-size: 0.875rem;">
            Keep up the amazing work! Your testing is helping us build something incredible for students everywhere. 🚀
          </p>
        </div>
      </div>
    `
  })
};

// Send welcome email to new alpha tester
router.post('/send-welcome/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transporter = createEmailTransporter();
    const emailContent = emailTemplates.welcome(user);

    await transporter.sendMail({
      from: `"LearnFlow Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    res.json({ message: 'Welcome email sent successfully' });
  } catch (error) {
    console.error('Error sending welcome email:', error);
    res.status(500).json({ message: 'Failed to send welcome email' });
  }
});

// Send day one check-in email
router.post('/send-day-one/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transporter = createEmailTransporter();
    const emailContent = emailTemplates.dayOne(user);

    await transporter.sendMail({
      from: `"LearnFlow Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    res.json({ message: 'Day one email sent successfully' });
  } catch (error) {
    console.error('Error sending day one email:', error);
    res.status(500).json({ message: 'Failed to send day one email' });
  }
});

// Send engagement email
router.post('/send-engagement/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's stats for the email
    const Question = require('../models/Question');
    const PracticeSession = require('../models/PracticeSession');
    
    const questionsGenerated = await Question.countDocuments({ userId: user._id });
    const practiceSessionsCompleted = await PracticeSession.countDocuments({ 
      userId: user._id, 
      completed: true 
    });
    
    // Calculate streak (simplified)
    const recentSessions = await PracticeSession.find({ 
      userId: user._id 
    }).sort({ startTime: -1 }).limit(7);
    
    const streak = calculateStreak(recentSessions);

    const data = {
      questionsGenerated,
      practiceSessionsCompleted,
      streak
    };

    const transporter = createEmailTransporter();
    const emailContent = emailTemplates.engagement(user, data);

    await transporter.sendMail({
      from: `"LearnFlow Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    res.json({ message: 'Engagement email sent successfully' });
  } catch (error) {
    console.error('Error sending engagement email:', error);
    res.status(500).json({ message: 'Failed to send engagement email' });
  }
});

// Send feedback request email
router.post('/send-feedback-request/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const transporter = createEmailTransporter();
    const emailContent = emailTemplates.feedback(user);

    await transporter.sendMail({
      from: `"LearnFlow Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    res.json({ message: 'Feedback request email sent successfully' });
  } catch (error) {
    console.error('Error sending feedback request email:', error);
    res.status(500).json({ message: 'Failed to send feedback request email' });
  }
});

// Send weekly digest email
router.post('/send-weekly-digest/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate weekly stats
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    const Question = require('../models/Question');
    const PracticeSession = require('../models/PracticeSession');

    const questionsThisWeek = await Question.countDocuments({
      userId: user._id,
      createdAt: { $gte: weekStart }
    });

    const sessionsThisWeek = await PracticeSession.find({
      userId: user._id,
      startTime: { $gte: weekStart },
      completed: true
    });

    const totalStudyTime = sessionsThisWeek.reduce((sum, session) => {
      if (session.endTime && session.startTime) {
        return sum + (session.endTime - session.startTime) / (1000 * 60);
      }
      return sum;
    }, 0);

    const accuracy = sessionsThisWeek.length > 0 
      ? (sessionsThisWeek.reduce((sum, s) => sum + (s.score || 0), 0) / sessionsThisWeek.length) * 100
      : 0;

    const streak = calculateStreak(sessionsThisWeek);
    const weekNumber = Math.ceil((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24 * 7));

    // Calculate percentile (simplified - compare with all users)
    const allUsers = await User.find({ isAlphaTester: true });
    const allUserQuestions = await Promise.all(
      allUsers.map(async (u) => {
        const count = await Question.countDocuments({
          userId: u._id,
          createdAt: { $gte: weekStart }
        });
        return count;
      })
    );

    const usersWithFewerQuestions = allUserQuestions.filter(count => count < questionsThisWeek).length;
    const percentile = Math.round((usersWithFewerQuestions / allUsers.length) * 100);

    const weeklyData = {
      weekNumber,
      questionsGenerated: questionsThisWeek,
      studyTime: Math.round(totalStudyTime),
      accuracy: Math.round(accuracy),
      streak,
      percentile
    };

    const transporter = createEmailTransporter();
    const emailContent = emailTemplates.weeklyDigest(user, weeklyData);

    await transporter.sendMail({
      from: `"LearnFlow Team" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: emailContent.subject,
      html: emailContent.html
    });

    res.json({ message: 'Weekly digest email sent successfully' });
  } catch (error) {
    console.error('Error sending weekly digest email:', error);
    res.status(500).json({ message: 'Failed to send weekly digest email' });
  }
});

// Bulk email sender for alpha testers
router.post('/send-bulk-email', async (req, res) => {
  try {
    const { subject, message, targetType, userIds } = req.body;

    let targetUsers;
    
    if (userIds && userIds.length > 0) {
      targetUsers = await User.find({ _id: { $in: userIds }, isAlphaTester: true });
    } else if (targetType) {
      targetUsers = await User.find({ isAlphaTester: true, alphaTesterType: targetType });
    } else {
      targetUsers = await User.find({ isAlphaTester: true });
    }

    const transporter = createEmailTransporter();
    const results = [];

    // Send emails with delay to avoid rate limiting
    for (let i = 0; i < targetUsers.length; i++) {
      const user = targetUsers[i];
      
      try {
        await transporter.sendMail({
          from: `"LearnFlow Team" <${process.env.EMAIL_USER}>`,
          to: user.email,
          subject: subject,
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
              <div style="background: #3b82f6; padding: 2rem; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 1.8rem;">LearnFlow Alpha Update</h1>
              </div>
              
              <div style="padding: 2rem; background: white;">
                <h2 style="color: #333;">Hey ${user.name}! 👋</h2>
                <div style="line-height: 1.6; color: #555;">${message}</div>
                
                <div style="text-align: center; margin: 2rem 0;">
                  <a href="${process.env.FRONTEND_URL}" style="background: #3b82f6; color: white; padding: 1rem 2rem; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                    Open LearnFlow
                  </a>
                </div>
                
                <p style="color: #555; line-height: 1.6;">
                  Thanks for being part of our Alpha Testing program! Your feedback is invaluable.
                </p>
                
                <p style="color: #555; line-height: 1.6;">
                  Best regards,<br>
                  The LearnFlow Team
                </p>
              </div>
            </div>
          `
        });

        results.push({ user: user.email, status: 'sent' });
        
        // Add delay between emails (1 second)
        if (i < targetUsers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
        results.push({ user: user.email, status: 'failed', error: error.message });
      }
    }

    res.json({ 
      message: 'Bulk email sending completed',
      results,
      totalSent: results.filter(r => r.status === 'sent').length,
      totalFailed: results.filter(r => r.status === 'failed').length
    });
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    res.status(500).json({ message: 'Failed to send bulk emails' });
  }
});

// Helper function to calculate study streak
function calculateStreak(sessions) {
  if (sessions.length === 0) return 0;

  const sessionDates = [...new Set(sessions.map(s => 
    s.startTime.toISOString().split('T')[0]
  ))].sort();

  let maxStreak = 0;
  let currentStreak = 1;

  for (let i = 1; i < sessionDates.length; i++) {
    const prevDate = new Date(sessionDates[i - 1]);
    const currDate = new Date(sessionDates[i]);
    const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
    }
  }

  return Math.max(maxStreak, currentStreak);
}

module.exports = router;
