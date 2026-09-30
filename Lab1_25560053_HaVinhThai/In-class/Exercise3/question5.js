const { mongoose, connectDB, closeDB, createUserSchema } = require('./db');

const userSchema = createUserSchema();

userSchema.add({
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Pre-save hook: simulate hashing the password before it is written to the database
userSchema.pre('save', function() {
  if (!this.isModified('password')) return;
  this.password = `hashed_${Buffer.from(this.password).toString('base64')}`;
});

// Pre-find hook: every find query skips soft-deleted documents
userSchema.pre(/^find/, function() {
  this.where({ isDeleted: { $ne: true } });
});

const User = mongoose.model('User', userSchema);

async function main() {
  try {
    await connectDB();
    await User.deleteMany({});

    await User.create({
      fullName: 'Nguyen Van Hung',
      email: 'hung.nguyen@example.com',
      age: 22,
      password: 'secret123'
    });
    const mai = await User.create({
      fullName: 'Tran Thi Mai',
      email: 'mai.tran@example.com',
      age: 25,
      password: 'mypassword'
    });
    await User.updateOne({ _id: mai._id }, { isDeleted: true });

    // The native driver bypasses Mongoose middleware, so it shows every stored document
    const storedUsers = await User.collection.find().toArray();
    const foundIds = (await User.find()).map((user) => user.id);

    console.table(storedUsers.map(({ _id, fullName, password, isDeleted }) => ({
      fullName,
      storedPassword: password,
      isDeleted,
      returnedByFind: foundIds.includes(String(_id))
    })));
  } catch (error) {
    console.error('Mongoose validation/operation error:', error.message);
  } finally {
    await closeDB();
  }
}

main();
