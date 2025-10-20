# LearnFlow MVP - Active Recall Engine

LearnFlow is a web-based learning application that transforms passive note-taking into active learning through AI-powered question generation. The MVP focuses on helping students improve memory retention using active recall techniques.

## Features

### Core Functionality
- **User Authentication**: Secure sign-up and login system
- **AI-Powered Question Generation**: Converts study notes into practice questions using OpenAI
- **Practice Interface**: Interactive question-answer sessions with immediate feedback
- **Basic Analytics**: Progress tracking and performance insights

### Tech Stack
- **Frontend**: React.js with TypeScript, Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **AI Integration**: OpenAI API
- **Authentication**: JWT tokens

## Project Structure

```
learnflow/
├── backend/
│   ├── server.js              # Express server
│   ├── models/               # MongoDB schemas
│   │   ├── User.js
│   │   ├── Question.js
│   │   └── PracticeSession.js
│   ├── routes/               # API routes
│   │   ├── auth.js
│   │   ├── questions.js
│   │   └── practice.js
│   ├── middleware/
│   │   └── auth.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   ├── context/         # React context
│   │   └── App.tsx
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- OpenAI API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   ```
   MONGODB_URI=mongodb://localhost:27017/learnflow
   JWT_SECRET=your_secure_jwt_secret
   OPENAI_API_KEY=your_openai_api_key
   PORT=5000
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

## User Flow

1. **Sign Up/Login**: Create an account or log in
2. **Paste Text**: Input lecture notes, articles, or study material
3. **Generate Questions**: AI creates practice questions from the content
4. **Practice**: Answer questions and receive immediate feedback
5. **Analytics**: Track progress and performance over time

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Questions
- `POST /api/questions/generate` - Generate questions from text
- `GET /api/questions/my-questions` - Get user's question sets
- `GET /api/questions/:id` - Get specific question set

### Practice
- `POST /api/practice/submit` - Submit practice session
- `GET /api/practice/history` - Get practice history
- `GET /api/practice/analytics` - Get performance analytics

## Development Notes

### Environment Variables
Make sure to set up the following environment variables:

**Backend (.env)**
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `OPENAI_API_KEY`: OpenAI API key for question generation
- `PORT`: Server port (default: 5000)

**Frontend (.env)**
- `REACT_APP_API_URL`: Backend API URL

### MongoDB Setup
You can use either:
- Local MongoDB installation
- MongoDB Atlas (cloud database)

### OpenAI API Key
1. Sign up for an OpenAI account
2. Generate an API key
3. Add it to your backend `.env` file

## Deployment

### Backend Deployment (Heroku/Render)
1. Set environment variables in your hosting platform
2. Deploy the backend directory
3. Ensure MongoDB is accessible from your hosting platform

### Frontend Deployment (Vercel/Netlify)
1. Set `REACT_APP_API_URL` to your backend URL
2. Build and deploy the frontend directory

## Future Enhancements (Post-MVP)

- **Spaced Repetition Algorithm**: Intelligent scheduling of question reviews
- **University LMS Integration**: Connect with Canvas, Blackboard, etc.
- **Mobile App**: Native iOS and Android applications
- **Advanced Question Types**: Multiple choice, drag-and-drop, etc.
- **Collaborative Study Groups**: Share question sets with classmates
- **Performance Analytics**: Detailed learning insights and recommendations

## Contributing

This is an MVP (Minimum Viable Product) focused on validating the core concept of AI-powered active recall. The codebase prioritizes functionality over optimization.

## License

This project is for educational purposes and MVP validation.
