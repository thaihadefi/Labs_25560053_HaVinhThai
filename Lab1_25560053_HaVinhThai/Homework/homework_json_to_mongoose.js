require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/shop_mongoose_db';
const INVOICES_PATH = path.join(__dirname, 'invoices.json');

const invoiceItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  }
}, {
  _id: false
});

const invoiceSchema = new mongoose.Schema({
  invoiceCode: {
    type: String,
    required: [true, 'Invoice code is required'],
    unique: true,
    trim: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    required: [true, 'Customer email is required'],
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format']
  },
  items: {
    type: [invoiceItemSchema],
    validate: {
      validator: (items) => items.length > 0,
      message: 'An invoice must have at least one item'
    }
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['Cash', 'CreditCard', 'BankTransfer', 'Momo', 'ZaloPay'],
      message: 'Payment method "{VALUE}" is not allowed'
    }
  }
}, {
  timestamps: true
});

const Invoice = mongoose.model('Invoice', invoiceSchema);

function readInvoices(jsonPath) {
  const invoices = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (!Array.isArray(invoices)) throw new Error('invoices.json must contain an array of invoices');
  return invoices;
}

// Validates every invoice against the schema and returns the list of problems found
async function validateInvoices(invoices) {
  const errors = [];
  for (const [index, data] of invoices.entries()) {
    try {
      await new Invoice(data).validate();
    } catch (error) {
      const label = data.invoiceCode || `invoice #${index + 1}`;
      for (const { message } of Object.values(error.errors)) {
        errors.push(`${label}: ${message}`);
      }
    }
  }
  return errors;
}

async function main() {
  try {
    const invoices = readInvoices(INVOICES_PATH);
    console.log(`-> Read ${invoices.length} invoices from ${path.basename(INVOICES_PATH)}`);

    await mongoose.connect(MONGO_URI);

    const errors = await validateInvoices(invoices);
    if (errors.length > 0) {
      console.error('-> Validation failed, nothing was inserted:');
      errors.forEach((message) => console.error(`   - ${message}`));
      return;
    }
    console.log('-> All invoices are valid.');

    // Clear old data so the collection always mirrors the JSON file
    await Invoice.deleteMany({});
    const inserted = await Invoice.insertMany(invoices);
    console.log(`-> Inserted ${inserted.length} invoices into the "${Invoice.collection.name}" collection.`);

    const stored = await Invoice.find().sort({ invoiceCode: 1 }).lean();
    console.table(stored.map((invoice) => ({
      invoiceCode: invoice.invoiceCode,
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      items: invoice.items.length,
      paymentMethod: invoice.paymentMethod
    })));
  } catch (error) {
    console.error('Mongoose validation/operation error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

main();
