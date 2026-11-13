# rana.fr — তাৎক্ষণিক ডিসপোজেবল ইমেইল (`@rana.fr`)

`@rana.fr` ডোমেইনের জন্য তৈরি টেম্পোরারি ইমেইল, OTP শনাক্তকরণ এবং ইনবাউন্ড ওয়েবহুক কনসোল।

## ফ্রি-তে GitHub Pages-এ হোস্ট করার নিয়ম

এই প্রোজেক্টটি **GitHub Pages** (সম্পূর্ণ ফ্রি স্ট্যাটিক হোস্টিং)-এ সরাসরি চলার জন্য প্রস্তুত করা হয়েছে। কোনো ব্যাকএন্ড না থাকলেও ব্রাউজারের নিজস্ব `localStorage` + `BroadcastChannel` দিয়ে সব ফিচার (র‍্যান্ডম/কাস্টম `@rana.fr` ঠিকানা, টেস্ট মেইল, OTP কপি, `.eml` ডাউনলোড, বাংলা/ইংরেজি ও ডার্ক মোড) কাজ করবে।

### ৩টি সহজ ধাপে GitHub-এ হোস্ট করুন:

1. আপনার GitHub অ্যাকাউন্টে একটি নতুন পাবলিক রিপোজিটরি তৈরি করুন (যেমন: `rana-fr-tempmail`)।
2. প্রোজেক্ট ফোল্ডার থেকে নিচের কমান্ডগুলো চালিয়ে কোড পুশ করুন:

```bash
git init
git add .
git commit -m "Initial commit: rana.fr temp mail"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/rana-fr-tempmail.git
git push -u origin main
```

3. GitHub রিপোজিটরিতে গিয়ে **Settings → Pages → Build and deployment → Source** থেকে **GitHub Actions** নির্বাচন করুন।
   - প্রোজেক্টে থাকা `.github/workflows/deploy-pages.yml` স্বয়ংক্রিয়ভাবে `npm run build` চালিয়ে সাইটটি `https://<YOUR_USERNAME>.github.io/rana-fr-tempmail/` লিংকে লাইভ করে দেবে।

## আসল ইন্টারনেট ইমেইল (`@rana.fr` MX) রিসিভ করতে চাইলে

GitHub Pages শুধু স্ট্যাটিক ফ্রন্টএন্ড হোস্ট করে; বাইরের সার্ভিস (যেমন Gmail) থেকে আসল ইমেইল রিসিভ করতে একটি Node.js সার্ভার প্রয়োজন হয়। এই প্রোজেক্টে থাকা `server.ts` ফাইলটি **Render**, **Railway** বা **Fly.io**-এর ফ্রি টিয়ারে হোস্ট করে Cloudflare Email Routing Worker-এর সাথে যুক্ত করলে `@rana.fr` ডোমেইনের আসল ইমেইল সরাসরি ইনবক্সে আসবে।
