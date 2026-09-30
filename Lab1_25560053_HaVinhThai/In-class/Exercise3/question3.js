const { mongoose, connectDB, closeDB, createUserSchema } = require('./db');

const userSchema = createUserSchema();

// Active users with the given role, sorted by name A-Z
userSchema.statics.findActiveByRole = function(roleName) {
  return this.find({ role: roleName, isActive: true }).sort({ fullName: 1 });
};

const User = mongoose.model('User', userSchema);

async function main() {
  try {
    await connectDB();
    await User.deleteMany({});

    await User.create([
      { fullName: 'Tran Thi Mai', email: 'mai.tran@example.com', age: 25, role: 'admin' },
      { fullName: 'Nguyen Van Hung', email: 'hung.nguyen@example.com', age: 22, role: 'admin' },
      { fullName: 'Le Van An', email: 'an.le@example.com', age: 30, role: 'admin', isActive: false },
      { fullName: 'Pham Thi Lan', email: 'lan.pham@example.com', age: 28, role: 'user' }
    ]);

    const admins = await User.findActiveByRole('admin');
    console.table(admins.map(({ fullName, email, role, isActive }) => ({ fullName, email, role, isActive })));
  } catch (error) {
    console.error('Mongoose validation/operation error:', error.message);
  } finally {
    await closeDB();
  }
}

main();
