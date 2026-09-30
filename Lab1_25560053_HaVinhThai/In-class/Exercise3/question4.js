const { mongoose, connectDB, closeDB, createUserSchema } = require('./db');

const userSchema = createUserSchema();

userSchema.add({
  isDeleted: {
    type: Boolean,
    default: false
  }
});

// Mark the document as deleted instead of removing it from the collection
userSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.isActive = false;
  return this.save();
};

const User = mongoose.model('User', userSchema);

async function main() {
  try {
    await connectDB();
    await User.deleteMany({});

    const user = await User.create({
      fullName: 'Nguyen Van Hung',
      email: 'hung.nguyen@example.com',
      age: 22
    });

    const before = { state: 'before softDelete()', isDeleted: user.isDeleted, isActive: user.isActive };

    await user.softDelete();

    const stored = await User.findById(user._id);
    console.table([
      before,
      { state: 'after softDelete()', isDeleted: stored.isDeleted, isActive: stored.isActive }
    ]);
  } catch (error) {
    console.error('Mongoose validation/operation error:', error.message);
  } finally {
    await closeDB();
  }
}

main();
