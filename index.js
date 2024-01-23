const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const Teacher = require('./models/TeacherModel'); 
const Student = require('./models/StudentModel'); 
const Swal = require('sweetalert2');
const jwt = require('jsonwebtoken');
const MongoClient = require('mongodb').MongoClient;
const cookieParser = require('cookie-parser');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'Rcpit123',
    resave: false,
    saveUninitialized: true,
}));


// Middleware function to authenticate JWT token
function authenticateToken(req, res, next) {
   // const authHeader = req.headers['authorization'];
    const token = req.cookies.jwt;

    if (!token) {
        return res.sendStatus(401); // Unauthorized if token is missing
    }

    jwt.verify(token, 'Sayali123', (err, user) => {
        if (err) {
            return res.sendStatus(403); // Forbidden if token verification fails
        }
        req.user = user; // Set user data in the request object for further use
        console.log(user);
        next(); // Proceed to the next middleware
    });
}

app.set('view engine', 'ejs');
app.get('/dashboard', (req, res) => {
    res.render('dashboard', {
        title: 'Dashboard',
        TeachersCount: 67,
        StudentsCount: 88,
        ClassesCount: 99,
        Notifications: 78,
        Performers: [
            { Name: 'Emma Johnson', Percentage: '98%', Rank: 'Rank 1' },
            { Name: 'Sophia Wilson', Percentage: '95%', Rank: 'Rank 2' },
            
        ],
    });
});

app.get('/login', (req, res) => {
    const userType = req.query.type; // Get the userType from the query parameter
    req.session.userType = userType; // Set the userType in the session
    // console.log(req.session);
    res.render('login', { userType: userType });
});
const mongoURI = 'mongodb+srv://marathesayali2003:Sayali123@cluster1.mqlrftt.mongodb.net/School_Diary';
app.post('/login', async (req, res) => {
    console.log(req.body);
    const { name, password } = req.body;
    console.log(name);
    console.log(password);
    const userType = req.query.type;
    
    try {
        const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
        await client.connect();
        console.log("Database connected");
        const db = client.db('School_Diary');
        const users = userType === 'teacher' ? db.collection('teachers') : db.collection('students');

        const user = await users.findOne({ name, password });
        console.log("finded", name,password);
        if (user) {
            // Generate JWT token
            const token = jwt.sign({ username: name, userType }, 'Sayali123');
            console.log("The token is: " + token);
            const decodedToken = jwt.decode(token);
            const decodedTokenString = JSON.stringify(decodedToken); // Convert object to string
            console.log("Decoded Token:", decodedTokenString);
            res.cookie("jwt",token,{
                expires:new Date(Date.now()+6000),
                httpOnly:true
            });
            // Redirect after successful token generation
            if (userType === 'teacher') {
                res.redirect('/teacher');
            } else {
                res.redirect('/student');
            }
        } else {
            // User not found
            res.status(401).json({ success: false, message: 'User not found' });
        }

        client.close();
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    }
});

app.get('/teacher',authenticateToken,(req,res)=>{
    //console.log(`this is the cookie ${req.cookies.jwt}`);
    res.render('Teacher');  
})
app.get('/student',authenticateToken,(req,res)=>{
    res.render('Student');  
})
app.get('/result',authenticateToken,(req,res)=>{
    res.render('Result'); 
})
app.get('/sign_up', (req, res) => {
    let userType = req.session.userType;

    // Check if userType is not set in the session
    if (!userType) {
        userType = req.query.type === 'teacher' ? 'Teacher' : 'Student';
        req.session.userType = userType; // Set the userType in the session
    }

    res.render('sign_up', { userType: userType });
});
app.post('/signup', async (req, res) => {
    const { name,email, password } = req.body;
    const userType = req.query.type; // Assuming userType is retrieved from query parameter
    console.log(userType);
    try {
      const client = new MongoClient(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
      await client.connect();
  
      const db = client.db('School_Diary');
      const users = userType === 'teacher' ? db.collection('teachers') : db.collection('students');
  
      // Create a new user document
      const newUser = {
        name,
        email,
        password,
      };
      await users.insertOne(newUser);

    console.log('User data saved successfully:', newUser);
    req.session.userType = userType;
    console.log(userType);
    // Redirect to login page with the respective userType
    res.redirect(`/login?type=${userType}`);
    
    client.close();
  } catch (err) {
    console.error('Error saving user data:', err);
    res.status(500).json({ success: false, error: 'Error saving user data' });
  }
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
