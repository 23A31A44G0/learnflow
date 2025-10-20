# LearnFlow Frontend

The frontend for LearnFlow - an AI-powered active recall learning platform. This React application provides user authentication, question generation, practice interfaces, and analytics for learners.

## Features

- User authentication (login/register)
- AI-powered question generation from study materials
- Interactive practice sessions
- Performance analytics dashboard
- Spaced repetition practice
- Gamification elements

## Tech Stack

- React.js with TypeScript
- React Router for navigation
- Tailwind CSS for styling
- Axios for API communication
- Recharts for data visualization

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Environment Configuration

Create a `.env` file with:

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENVIRONMENT=development
```

For production deployment, set these environment variables on your hosting platform:

```
REACT_APP_API_URL=https://your-backend-url/api
REACT_APP_ENVIRONMENT=production
```

## Deployment

This project can be deployed to Render, Vercel, Netlify, or any static hosting service:

### Render Deployment:
- Create a new Static Site in Render
- Connect to this GitHub repository
- Set build command: `npm ci && npm run build`
- Set publish directory: `build`
- Add environment variables
- Enable SPA routing in Redirects/Rewrites: Source `/*`, Destination `/index.html`, Action `Rewrite`

### Vercel Deployment:
- Import the repository into Vercel
- Vercel will automatically detect React and configure the build settings
- Set environment variables in the project settings

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
