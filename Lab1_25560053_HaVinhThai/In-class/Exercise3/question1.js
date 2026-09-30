const { mongoose, connectDB, closeDB, createUserSchema } = require('./db');

const userSchema = createUserSchema();

// Vietnamese phone number: 10 digits, starting with 03, 05, 07, 08 or 09
userSchema.add({
  phone: {
    type: String,
    validate: {
      validator: (value) => /^(03|05|07|08|09)\d{8}$/.test(value),
      message: (props) => `${props.value} is not a valid Vietnamese phone number`
    }
  }
});

const User = mongoose.model('User', userSchema);

async function main() {
  try {
    await connectDB();
    await User.deleteMany({});

    const candidates = [
      { fullName: 'Nguyen Van Hung', email: 'hung.nguyen@example.com', age: 22, phone: '0912345678' },
      { fullName: 'Tran Thi Mai', email: 'mai.tran@example.com', age: 25, phone: '12345' }
    ];

    const results = [];
    for (const candidate of candidates) {
      try {
        await User.create(candidate);
        results.push({ phone: candidate.phone, result: 'saved' });
      } catch (error) {
        results.push({ phone: candidate.phone, result: error.errors.phone.message });
      }
    }
    console.table(results);
  } catch (error) {
    console.error('Mongoose validation/operation error:', error.message);
  } finally {
    await closeDB();
  }
}

main();
