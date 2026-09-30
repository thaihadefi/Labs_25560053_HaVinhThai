require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

const { Schema } = mongoose;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_mongoose_db';

const studentSchema = new Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }]
}, {
  timestamps: true
});

const courseSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true
  },
  students: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  maxStudents: {
    type: Number,
    required: [true, 'Max students is required'],
    min: [1, 'A course must allow at least 1 student']
  },
  availableSlots: {
    type: Number,
    min: [0, 'Available slots cannot be negative'],
    // A new course starts with every slot free
    default: function() { return this.maxStudents; }
  }
}, {
  timestamps: true
});

const Student = mongoose.model('Student', studentSchema);
const Course = mongoose.model('Course', courseSchema);

async function enrollCourse(studentId, courseId) {
  const student = await Student.findById(studentId);
  if (!student) throw new Error('Student not found');
  const course = await Course.findById(courseId);
  if (!course) throw new Error('Course not found');

  if (student.courses.some((id) => id.equals(courseId))) {
    throw new Error(`${student.fullName} is already enrolled in "${course.title}"`);
  }
  if (course.availableSlots <= 0) {
    throw new Error(`"${course.title}" has no available slots`);
  }

  // The filter repeats both checks so the slot is taken atomically:
  // two students enrolling at the same time cannot both get the last slot
  const updatedCourse = await Course.findOneAndUpdate(
    { _id: courseId, availableSlots: { $gt: 0 }, students: { $ne: studentId } },
    { $addToSet: { students: studentId }, $inc: { availableSlots: -1 } },
    { returnDocument: 'after' }
  );
  if (!updatedCourse) throw new Error(`"${course.title}" has no available slots`);

  await Student.updateOne({ _id: studentId }, { $addToSet: { courses: courseId } });

  console.log(`-> [ENROLL] ${student.fullName} enrolled in "${updatedCourse.title}" ` +
    `(${updatedCourse.availableSlots}/${updatedCourse.maxStudents} slots left)`);
}

async function dropCourse(studentId, courseId) {
  const student = await Student.findById(studentId);
  if (!student) throw new Error('Student not found');

  // Matching on students: studentId ensures the slot is only returned if the student was enrolled
  const updatedCourse = await Course.findOneAndUpdate(
    { _id: courseId, students: studentId },
    { $pull: { students: studentId }, $inc: { availableSlots: 1 } },
    { returnDocument: 'after' }
  );
  if (!updatedCourse) throw new Error(`${student.fullName} is not enrolled in this course`);

  await Student.updateOne({ _id: studentId }, { $pull: { courses: courseId } });

  console.log(`-> [DROP] ${student.fullName} dropped "${updatedCourse.title}" ` +
    `(${updatedCourse.availableSlots}/${updatedCourse.maxStudents} slots left)`);
}

// Runs an action and prints the error instead of stopping the demo
async function attempt(action) {
  try {
    await action();
  } catch (error) {
    console.log(`-> [REJECTED] ${error.message}`);
  }
}

async function printState(title) {
  console.log(`\n=== ${title} ===`);
  const courses = await Course.find().populate('students', 'fullName').sort({ title: 1 });
  console.table(courses.map((course) => ({
    course: course.title,
    maxStudents: course.maxStudents,
    availableSlots: course.availableSlots,
    students: course.students.map((student) => student.fullName).join(', ')
  })));

  const students = await Student.find().populate('courses', 'title').sort({ fullName: 1 });
  console.table(students.map((student) => ({
    student: student.fullName,
    courses: student.courses.map((course) => course.title).join(', ')
  })));
}

async function main() {
  try {
    await mongoose.connect(MONGO_URI);
    await Student.deleteMany({});
    await Course.deleteMany({});

    const [hung, mai, an] = await Student.create([
      { fullName: 'Nguyen Van Hung', email: 'hung.nguyen@example.com' },
      { fullName: 'Tran Thi Mai', email: 'mai.tran@example.com' },
      { fullName: 'Le Van An', email: 'an.le@example.com' }
    ]);
    const [nodeCourse, dbCourse] = await Course.create([
      { title: 'Node.js Backend', maxStudents: 2 },
      { title: 'Database Design', maxStudents: 30 }
    ]);

    await printState('INITIAL STATE');

    console.log('\n--- Enroll ---');
    await attempt(() => enrollCourse(hung._id, nodeCourse._id));
    await attempt(() => enrollCourse(hung._id, dbCourse._id));
    await attempt(() => enrollCourse(mai._id, nodeCourse._id));
    // Already enrolled
    await attempt(() => enrollCourse(hung._id, nodeCourse._id));
    // Course is full
    await attempt(() => enrollCourse(an._id, nodeCourse._id));

    await printState('AFTER ENROLLING');

    console.log('\n--- Drop ---');
    await attempt(() => dropCourse(hung._id, nodeCourse._id));
    // Not enrolled any more
    await attempt(() => dropCourse(hung._id, nodeCourse._id));
    // The returned slot is available again
    await attempt(() => enrollCourse(an._id, nodeCourse._id));

    await printState('AFTER DROPPING');
  } catch (error) {
    console.error('Mongoose validation/operation error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

main();
