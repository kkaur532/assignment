/*********************************************************************************
* WEB322 – Assignment 06
* I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part of this
* assignment has been copied manually or electronically from any other source (including web sites) or 
* distributed to other students.
* 
* Name: Kiranpreet Kaur   Student ID: 166165217    Date: 05-08-2023
*
* Online (Cyclic) Link: ________________________________________________________
*
********************************************************************************/
const express = require("express");
const path = require("path");

const fs = require('fs');
const bodyParser = require('body-parser');
const exphbs = require("express-handlebars");
const data = require("./modules/collegeData.js");
const Sequelize = require('sequelize');
const clientSessions = require("client-sessions");
const collegeData = require('./modules/collegeData.js');
const { resolve } = require("path");


const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.engine('.hbs', exphbs.engine({ 
    defaultLayout: 'main',
    extname: '.hbs',
    helpers: {
        navLink: function(url, options){
            return '<li' + 
                ((url == app.locals.activeRoute) ? ' class="nav-item active" ' : ' class="nav-item" ') + 
                '><a class="nav-link" href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        equal: function (lvalue, rvalue, options) {
            if (arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 parameters");
            if (lvalue != rvalue) {
                return options.inverse(this);
            } else {
                return options.fn(this);
            }
        }        
    }
}));

app.set('view engine', '.hbs');

app.use(express.static("public"));


app.use(clientSessions({
    cookieName: "session", 
    secret: "assignment6_web322",
    duration: 2 * 60 * 1000, 
    activeDuration: 1000 * 60 
  }));

app.use(express.urlencoded({extended: true}));

app.use(function(req,res,next){
    let route = req.baseUrl + req.path;
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");
    next();
});

// set up sequelize to point to our postgres database
var sequelize = new Sequelize('gkuqqssp', 'gkuqqssp', 'V8wV1_7t799JlvOjUjp2n2kwxgpedRRO', {
    host: 'stampy.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

sequelize
    .authenticate()
    .then(function() {
        console.log('Connection has been established successfully.');
    })
    .catch(function(err) {
        console.log('Unable to connect to the database:', err);
    });


ensureLogin = (req, res, next) => {
        if (!req.session.user) {
          res.redirect("/login");
        } else {
          next();
        }
};

app.get("/",ensureLogin, (req,res) => {
    // res.render("home");
    res.render("home");
});

app.get('/home', (req, res) => {
    res.render("home");
});

app.get('/about', (req, res) => {
    res.render("about");
});

app.get("/htmlDemo", (req,res) => {
    res.render("htmlDemo");
});

app.get("/students", (req, res) => {
    if (req.query.course) {
        data.getStudentsByCourse(req.query.course)
            .then((data) => {
                if (data.length > 0) {
                    res.render("students", { students: data });
                } else {
                    res.render("students", { message: "No results" });
                }
            })
            .catch((err) => {
                res.render("students", { message: "Error fetching students" });
            });
    } else {
        data.getAllStudents()
            .then((data) => {
                if (data.length > 0) {
                    res.render("students", { students: data });
                } else {
                    res.render("students", { message: "No results" });
                }
            })
            .catch((err) => {
                res.render("students", { message: "Error fetching students" });
            });
    }
});


app.get("/students/add", (req, res) => {
    data.getCourses()
    .then(data => res.render("addStudent", {courses: data}))    
    .catch((err) => {
        res.render("addStudent", {courses: []});
    });
});

app.post("/students/add",(req,res) => {
    data.getCourses()
    .then(data => res.render("addStudent", {courses: data}))    
    .catch((err) => {
        res.render("addStudent", {courses: []});
    });
});

app.get("/students/:studentNum", (req, res) => {
    // initialize an empty object to store the values 
    let viewData = {};
    data.getStudentByNum(req.params.studentNum)
    .then((data) => { 
        if (data) {
            viewData.student = data; //store student data in the "viewData" object as "student" 
        } else {
            viewData.student = null; // set student to null if none were returned 
        }
    })
    .catch(() => {
        viewData.student = null; // set student to null if there was an error
    })
    .then(data.getCourses)
    .then((data) => {
        viewData.courses = data; // store course data in the "viewData" object as "courses"
        // loop through viewData.courses and once we have found the courseId that matches
        // the student's "course" value, add a "selected" property to the matching viewData.courses object
        for (let i = 0; i < viewData.courses.length; i++) {
            if (viewData.courses[i].courseId == viewData.student.course) {
                viewData.courses[i].selected = true;
            }
        }
    })
    .catch(() => {
        viewData.courses = []; // set courses to empty if there was an error
    })
    .then(() => {
        if (viewData.student == null) { // if no student - return an error
            res.status(404).send("Student Not Found"); 
        } else {
            res.render("student", { viewData: viewData }); // render the "student" view 
        }
    });
});

app.post("/student/update", (req, res) => {
    data.updateStudent(req.body)
    .then(() => {
        res.redirect("/students");
    });
});

app.get("/students/delete/:studentNum", (req, res) => {
    data.deleteStudentByNum(req.params.studentNum)
    .then(() => res.redirect("/students")) 
    .catch(err => res.status(500).send("Unable to Remove Student / Student not found"));
});

///////courses///////

app.get("/courses", (req, res) => {
    if (req.query.course) {
        data.getCourses(req.query.course)
            .then((data) => {
                if (data.length > 0) {
                    res.render("courses", { courses: data });
                } else {
                    res.render("courses", { message: "No results" });
                }
            })
            .catch((err) => {
                res.render("courses", { message: "Error fetching students" });
            });
    } else {
        data.getAllCourses()
            .then((data) => {
                if (data.length > 0) {
                    res.render("courses", { courses: data });
                } else {
                    res.render("courses", { message: "No results" });
                }
            })
            .catch((err) => {
                res.render("courses", { message: "Error fetching students" });
            });
    }
});


app.get("/courses/add", (req,res) => {
    res.render("addCourse");
});


app.post('/courses/add', (req, res) => {
    const courseData = {
      courseCode: req.body.courseCode,
      courseDescription: req.body.courseDescription
    };
  
    collegeData.addCourse(courseData)
      .then(() => {
        res.redirect('/courses');
      })
      .catch((err) => {
        res.status(500).send('Unable to Add Course');
      });
  });
  

  app.get('/course/update/:id', (req, res) => {
    const courseId = parseInt(req.params.id);
  
    collegeData.getCourseById(courseId)
      .then((course) => {
        if (!course) {
          res.status(404).send('Course Not Found');
        } else {
          res.render('updateCourse', { course: course });
        }
      })
      .catch((err) => {
        res.status(500).send('Error while fetching course');
      });
  });
  
  // New route to handle the form submission and update a course
  app.post('/course/update/:id', (req, res) => {
    const courseId = parseInt(req.params.id);
  
    const courseData = {
      courseId: courseId,
      courseCode: req.body.courseCode,
      courseDescription: req.body.courseDescription
    };
  
    collegeData.updateCourse(courseData)
      .then(() => {
        res.redirect('/courses');
      })
      .catch((err) => {
        res.status(500).send('Unable to Update Course');
      });
  });
  
  // New route to delete a course
  app.get('/courses/delete/:courseId', (req, res) => {
    collegeData.deleteCourseById(req.params.courseId)
    .then(() => {
        res.redirect('/courses');
    })
    .catch(err => {
        res.status(500).send('Unable to Remove Course / Course not found');
    });
});

/////login///
const user = {
    username: "sampleuser",
    password: "samplepassword",
    email: "sampleuser@example.com"
  };

app.get("/login", function(req, res) {
    res.render("login");
  });

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
  
    if(username === "" || password === "") {
      // Render 'missing credentials'
      return res.render("login", { errorMsg: "Missing credentials."});
    }
  
    // use sample "user" (declared above)
    if(username === user.username && password === user.password){
  
      // Add the user on the session and redirect them to the dashboard page.
      req.session.user = {
        username: user.username,
        email: user.email
      };
  
      res.redirect("/dashboard");
    } else {
      // render 'invalid username or password'
      res.render("login", { errorMsg: "invalid username or password!"});
    }
  });
app.get("/dashboard", ensureLogin, (req, res) => {
    res.render("dashboard", {user: req.session.user});
  });

app.get("/logout", function(req, res) {
    req.session.reset();
    res.redirect("/login");
  });


////

app.use((req,res)=>{
    res.status(404).send("Page Not Found");
});


data.initialize().then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});