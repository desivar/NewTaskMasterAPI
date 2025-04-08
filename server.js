// server.js
const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const taskRoutes = require('./routes/taskRoutes');
const authRoutesModule = require('./routes/authRoutes'); // Import the whole module
const authRoutes = authRoutesModule.router;
const ensureAuthenticated = authRoutesModule.ensureAuthenticated; // Access ensureAuthenticated from the module
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User'); // Import your User model

dotenv.config();
console.log('Environment Variables:', process.env);

const app = express();

// Enable JSON body parsing
app.use(express.json());

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Set to true in production for HTTPS only
}));

// Initialize Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport Google Strategy Configuration
passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
        passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            // Check if the user exists in your database by Google ID
            let user = await User.findOne({ googleId: profile.id });

            if (user) {
                // User found, return them
                return done(null, user);
            } else {
                // Create a new user in your database
                const newUser = new User({
                    googleId: profile.id,
                    // You might want to store other profile information here
                    // based on your User model (if you add more fields)
                });

                user = await newUser.save();
                return done(null, user);
            }
        } catch (error) {
            console.error('Error during Google authentication:', error);
            return done(error, null);
        }
    }
));

// Serialize user to session
passport.serializeUser((user, done) => {
    done(null, user._id); // Serialize based on the MongoDB _id
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            done(err, null);
        });
});

connectDB();

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Master API',
      version: '1.0.0',
      description: 'API documentation for Task Master',
    },
    components: {
      securitySchemes: {
        googleAuth: {
          type: 'oauth2',
          flows: {
            authorizationCode: {
              authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
              tokenUrl: 'https://oauth2.googleapis.com/token',
              scopes: {
                profile: 'View your basic profile info',
                email: 'View your email address',
              },
            },
          },
        },
      },
    },
    security: [
      {
        googleAuth: [],
      },
    ],
    schemas: {
      Task: {
        type: 'object',
        properties: {
          _id: { type: 'string', description: 'The task ID' },
          title: { type: 'string', description: 'The title of the task' },
          description: { type: 'string', description: 'The detailed description of the task' },
          status: { type: 'string', enum: ['To Do', 'In Progress', 'Blocked', 'Done'], description: 'The current status of the task' },
          priority: { type: 'string', enum: ['High', 'Medium', 'Low'], description: 'The priority level of the task' },
          dueDate: { type: 'string', format: 'date-time', description: 'The date and time when the task is due' },
          createdBy: { type: 'string', description: 'The ID of the user who created the task' },
          createdAt: { type: 'string', format: 'date-time', description: 'The timestamp when the task was created' },
          updatedAt: { type: 'string', format: 'date-time', description: 'The timestamp when the task was last updated' },
          category: { type: 'string', description: 'The category of the task' },
          isCompleted: { type: 'boolean', description: 'Indicates if the task is completed' },
        },
      },
      TaskInput: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'The title of the task to create/update' },
          description: { type: 'string', description: 'The detailed description of the task to create/update' },
          status: { type: 'string', enum: ['To Do', 'In Progress', 'Blocked', 'Done'], description: 'The initial/updated status of the task' },
          priority: { type: 'string', enum: ['High', 'Medium', 'Low'], description: 'The initial/updated priority level of the task' },
          dueDate: { type: 'string', format: 'date-time', description: 'The due date and time for the task' },
          category: { type: 'string', description: 'The category for the task' },
          isCompleted: { type: 'boolean', description: 'The initial/updated completion status of the task' },
        },
        required: ['title'],
      },
    },
  },
  apis: [path.join(__dirname, '/routes/*.js')],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
console.log('Swagger Spec:', JSON.stringify(swaggerSpec, null, 2)); // ADD IT RIGHT HERE
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ... rest of your code ...