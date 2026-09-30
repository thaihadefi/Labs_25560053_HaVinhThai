const { mongoose, connectDB, closeDB, createUserSchema } = require('./db');

const userSchema = createUserSchema();

// Computed on read, never stored in MongoDB
userSchema.virtual('displayInfo').get(function() {
  return `${this.fullName} <${this.email}> [${this.role.toUpperCase()}]`;
});

// Include virtual fields when the document is serialized to JSON
userSchema.set('toJSON', { virtuals: true });

const User = mongoose.model('User', userSchema);

async function main() {
  try {
    await connectDB();
    await User.deleteMany({});

    const user = await User.create({
      fullName: 'Nguyen Van Hung',
      email: 'hung.nguyen@example.com',
      age: 22,
      role: 'admin'
    });

    // Read displayInfo from the serialized JSON to show the virtual is included
    const { fullName, email, role, displayInfo } = user.toJSON();
    console.table([{ fullName, email, role, displayInfo }]);
  } catch (error) {
    console.error('Mongoose validation/operation error:', error.message);
  } finally {
    await closeDB();
  }
}

main();
