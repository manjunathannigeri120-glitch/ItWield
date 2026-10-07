import re

with open('backend/src/api/payments.ts', 'r', encoding='utf-8') as f:
    data = f.read()

data = data.replace(
    "const razorpay = new Razorpay({",
    "const razorpay = new Razorpay({"
)
data = data.replace(
    "key_id: process.env.RAZORPAY_KEY_ID as string,",
    "key_id: process.env.RAZORPAY_KEY_ID || 'dummy_key_id',"
)
data = data.replace(
    "key_secret: process.env.RAZORPAY_KEY_SECRET as string,",
    "key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',"
)

with open('backend/src/api/payments.ts', 'w', encoding='utf-8') as f:
    f.write(data)
