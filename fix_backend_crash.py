import re

# 1. Fix Razorpay crash
with open('backend/src/api/payments.ts', 'r', encoding='utf-8') as f:
    pay_data = f.read()

# Replace instantiation to be conditional or use dummy keys
pay_data = pay_data.replace(
    "export const razorpay = new Razorpay({",
    "export const razorpay = process.env.RAZORPAY_KEY_ID ? new Razorpay({"
)
pay_data = pay_data.replace(
    "key_id: process.env.RAZORPAY_KEY_ID!,",
    "key_id: process.env.RAZORPAY_KEY_ID!,"
)
pay_data = pay_data.replace(
    "key_secret: process.env.RAZORPAY_KEY_SECRET!,",
    "key_secret: process.env.RAZORPAY_KEY_SECRET!,"
)
pay_data = pay_data.replace(
    "});",
    "}) : null;"
)

with open('backend/src/api/payments.ts', 'w', encoding='utf-8') as f:
    f.write(pay_data)

# 2. Fix Rate Limiter warnings
with open('backend/src/middleware/rateLimiters.ts', 'r', encoding='utf-8') as f:
    rl_data = f.read()

# Remove custom keyGenerator since it throws IPv6 validation error
rl_data = re.sub(r"keyGenerator: [^,]+,\n", "", rl_data)

with open('backend/src/middleware/rateLimiters.ts', 'w', encoding='utf-8') as f:
    f.write(rl_data)

