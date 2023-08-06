const fs = require("fs");
const Sequelize = require('sequelize');

var sequelize = new Sequelize('gkuqqssp', 'gkuqqssp', 'V8wV1_7t799JlvOjUjp2n2kwxgpedRRO', {
    host: 'stampy.db.elephantsql.com',
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
    ssl: { rejectUnauthorized: false }
    },
    query:{ raw: true }
});


var Student = sequelize.define('Student', {
    studentNum: {
        type: Sequelize.INTEGER,
        primaryKey: true, 
        autoIncrement: true
    },
    firstName: Sequelize.STRING,
    lastName: Sequelize.STRING,
    email: Sequelize.STRING,
    addressStreet: Sequelize.STRING,
    addressCity: Sequelize.STRING,
    addressProvince: Sequelize.STRING,
    status: Sequelize.STRING,
    TA: Sequelize.BOOLEAN
});

var Course = sequelize.define('Course', {
    courseId: {
        type: Sequelize.INTEGER,
        primaryKey: true, 
        autoIncrement: true
    },
    courseCode: Sequelize.STRING,
    courseDescription: Sequelize.STRING,
});

class Data{
    constructor(students, courses){
        this.students = students;
        this.courses = courses;
    }
}

let dataCollection = null;

module.exports.initialize = function () {
    return new Promise( (resolve, reject) => {
        fs.readFile('./data/courses.json','utf8', (err, courseData) => {
            if (err) {
                reject("unable to load courses"); return;
            }

            fs.readFile('./data/students.json','utf8', (err, studentData) => {
                if (err) {
                    reject("unable to load students"); return;
                }

                dataCollection = new Data(JSON.parse(studentData), JSON.parse(courseData));
                resolve();
            });
        });
    });
}

module.exports.getAllStudents = function(){
    return new Promise((resolve,reject)=>{
        if (dataCollection.students.length == 0) {
            reject("query returned 0 results"); return;
        }

        resolve(dataCollection.students);
    })
}

module.exports.getAllCourses = function(){
    return new Promise((resolve,reject)=>{
        if (dataCollection.courses.length == 0) {
            reject("query returned 0 results"); return;
        }

        resolve(dataCollection.courses);
    })
}

module.exports.getCourses = function(){
    return Course.findAll({
        attributes: ['courseId', 'courseCode', 'courseDescription']
    })
    .catch((err) => {
        console.error('Error while fetching courses:', err);
        throw err;
    });
}

module.exports.getStudentByNum = function (num) {
    return new Promise(function (resolve, reject) {
        var foundStudent = null;

        for (let i = 0; i < dataCollection.students.length; i++) {
            if (dataCollection.students[i].studentNum == num) {
                foundStudent = dataCollection.students[i];
            }
        }

        if (!foundStudent) {
            reject("query returned 0 results"); return;
        }

        resolve(foundStudent);
    });
};

module.exports.getStudentsByCourse = function (course) {
    return new Promise(function (resolve, reject) {
        var filteredStudents = [];

        for (let i = 0; i < dataCollection.students.length; i++) {
            if (dataCollection.students[i].course == course) {
                filteredStudents.push(dataCollection.students[i]);
            }
        }

        if (filteredStudents.length == 0) {
            reject("query returned 0 results"); return;
        }

        resolve(filteredStudents);
    });
};

module.exports.getCourseById = function (id) {
    return new Promise(function (resolve, reject) {
        var foundCourse = null;

        for (let i = 0; i < dataCollection.courses.length; i++) {
            if (dataCollection.courses[i].courseId == id) {
                foundCourse = dataCollection.courses[i];
            }
        }

        if (!foundCourse) {
            reject("query returned 0 results"); return;
        }

        resolve(foundCourse);
    });
};

module.exports.addStudent = function (studentData) {
    return new Promise(function (resolve, reject) {

        studentData.TA = (studentData.TA) ? true : false;
        for (const key in studentData) {
            if (studentData[key] === "") {
                studentData[key] = null;
            }
        }
        return new Promise(function (resolve, reject) { 
            Student.create(studentData)
            .then(() => resolve("student created successfully"))
            .catch(() => reject("unable to create student"));
        });
    });

};

module.exports.updateStudent = function (studentData) {
    return new Promise(function (resolve, reject) {

        studentData.TA = (studentData.TA) ? true : false;

        for (const key in studentData) {
            if (studentData[key] === "") {
                studentData[key] = null;
            }
        }
        return Student.update(studentData, {
            where: { studentNum: studentData.studentNum }
        })
        .then(() => {
            console.log(`Student ${studentData.studentNum} updated successfully`);
        })
        .catch((err) => {
            console.error('Error while updating student:', err);
            throw err;
        });
    });
};

exports.deleteStudentByNum = stdNum => {
    return Student.destroy({
        where: {
            studentNum: stdNum
        }
    })
    .then(() => {
        console.log('Student deleted successfully');
    })
    .catch((err) => {
        console.error('Error while deleting student:', err);
        throw err;
    });
};

exports.addCourse = courseData => {
    for (const key in courseData) {
        if (courseData[key] === "") {
            courseData[key] = null;
        }
    }
    return Course.create(courseData)
        .then(() => {
            console.log('Course created successfully');
        })
        .catch((err) => {
            console.error('Error while adding course:', err);
            throw err;
        });
};

exports.updateCourse = courseData => {
    for (const key in courseData) {
        if (courseData[key] === "") {
            courseData[key] = null;
        }
    }
    return Course.update(courseData, {
        where: { courseId: courseData.courseId }
    })
    .then(() => {
        console.log(`Course ${courseData.courseId} updated successfully`);
    })
    .catch((err) => {
        console.error('Error while updating course:', err);
        throw err;
    });
};

exports.deleteCourseById = id => {
    return Course.destroy({
        where: {
            courseId: id
        }
    })
    .then(() => {
        console.log('Course deleted successfully');
    })
    .catch((err) => {
        console.error('Error while deleting course:', err);
        throw err;
    });
};

