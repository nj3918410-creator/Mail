import type { Language } from '../types/mail';

export interface Translations {
  nav: {
    inbox: string;
    custom: string;
    api: string;
    guide: string;
    newAddress: string;
  };
  addressBar: {
    label: string;
    copy: string;
    copied: string;
    random: string;
    customEdit: string;
    save: string;
    cancel: string;
    extend: string;
    burn: string;
    expiresIn: string;
    liveStream: string;
    reconnecting: string;
    unread: string;
    total: string;
    activeInboxes: string;
    invalidAlias: string;
  };
  toolbar: {
    all: string;
    unread: string;
    otpOnly: string;
    searchPlaceholder: string;
    sendTest: string;
    refresh: string;
    lightMode: string;
    darkMode: string;
  };
  mailbox: {
    inboxTitle: string;
    emptyTitle: string;
    emptyDesc: string;
    emptyAction: string;
    noFilterMatch: string;
    selectPrompt: string;
    from: string;
    to: string;
    received: string;
    otpDetected: string;
    copyCode: string;
    codeCopied: string;
    openLink: string;
    tabHtml: string;
    tabText: string;
    tabRaw: string;
    downloadEml: string;
    deleteMail: string;
    attachments: string;
    noSubject: string;
  };
  customView: {
    title: string;
    subtitle: string;
    inputLabel: string;
    inputPlaceholder: string;
    createBtn: string;
    suggestions: string;
    savedTitle: string;
    savedEmpty: string;
    switchBtn: string;
    activeLabel: string;
    deleteBtn: string;
    rulesNote: string;
  };
  apiView: {
    title: string;
    subtitle: string;
    endpointLabel: string;
    copyEndpoint: string;
    testerTitle: string;
    toLabel: string;
    fromLabel: string;
    subjectLabel: string;
    bodyLabel: string;
    sendBtn: string;
    sending: string;
    sentSuccess: string;
    curlTitle: string;
    cloudflareTitle: string;
    cloudflareDesc: string;
  };
  guideView: {
    title: string;
    subtitle: string;
    faqs: Array<{ q: string; a: string }>;
  };
  modal: {
    title: string;
    subtitle: string;
    presetOtp: string;
    presetOtp5: string;
    presetWelcome: string;
    presetInvoice: string;
    presetCustom: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    messageBody: string;
    sendNow: string;
    close: string;
  };
  footer: {
    note: string;
    domain: string;
  };
}

export const translations: Record<Language, Translations> = {
  bn: {
    nav: {
      inbox: 'ইনবক্স',
      custom: 'কাস্টম ঠিকানা',
      api: 'ইনবাউন্ড API',
      guide: 'নির্দেশিকা',
      newAddress: 'নতুন ঠিকানা',
    },
    addressBar: {
      label: 'আপনার অস্থায়ী @rana.fr ঠিকানা',
      copy: 'কপি করুন',
      copied: 'কপি হয়েছে',
      random: 'র‍্যান্ডম',
      customEdit: 'কাস্টম নাম',
      save: 'সেভ',
      cancel: 'বাতিল',
      extend: 'মেয়াদ বাড়ান',
      burn: 'ইনবক্স মুছুন',
      expiresIn: 'মেয়াদ',
      liveStream: 'লাইভ সংযোগ সক্রিয়',
      reconnecting: 'পুনঃসংযোগ হচ্ছে',
      unread: 'অপঠিত',
      total: 'মোট মেইল',
      activeInboxes: 'সক্রিয় ঠিকানা',
      invalidAlias: 'শুধু ছোট হাতের অক্ষর, সংখ্যা, ডট (.) বা হাইফেন (-) ব্যবহার করুন (৩-৩২ অক্ষর)।',
    },
    toolbar: {
      all: 'সব মেইল',
      unread: 'অপঠিত',
      otpOnly: 'OTP কোড',
      searchPlaceholder: 'বিষয় বা প্রেরক খুঁজুন...',
      sendTest: 'টেস্ট মেইল পাঠান',
      refresh: 'রিফ্রেশ',
      lightMode: 'লাইট',
      darkMode: 'ডার্ক',
    },
    mailbox: {
      inboxTitle: 'ইনবক্স বার্তা',
      emptyTitle: 'এখনো কোনো ইমেইল আসেনি',
      emptyDesc: 'উপরের @rana.fr ঠিকানাটি কপি করে যেকোনো ওয়েবসাইটে ব্যবহার করুন অথবা নিচের বাটনে ক্লিক করে তাৎক্ষণিক টেস্ট মেইল ও OTP যাচাই করুন।',
      emptyAction: 'টেস্ট ভেরিফিকেশন মেইল পাঠান',
      noFilterMatch: 'এই ফিল্টারে কোনো ইমেইল পাওয়া যায়নি।',
      selectPrompt: 'পড়ার জন্য বাম পাশের তালিকা থেকে একটি ইমেইল নির্বাচন করুন।',
      from: 'প্রেরক',
      to: 'প্রাপক',
      received: 'সময়',
      otpDetected: 'ভেরিফিকেশন কোড শনাক্ত হয়েছে',
      copyCode: 'কোড কপি করুন',
      codeCopied: 'কোড কপি হয়েছে',
      openLink: 'ভেরিফিকেশন লিংক',
      tabHtml: 'প্রিভিউ',
      tabText: 'সাধারণ টেক্সট',
      tabRaw: 'হেডার ও সোর্স',
      downloadEml: '.eml ডাউনলোড',
      deleteMail: 'মুছে ফেলুন',
      attachments: 'সংযুক্ত ফাইল',
      noSubject: '(বিষয়হীন)',
    },
    customView: {
      title: 'কাস্টম @rana.fr ঠিকানা তৈরি করুন',
      subtitle: 'যেকোনো পছন্দসই ইউজারনেম দিয়ে তাৎক্ষণিক ডিসপোজেবল ইনবক্স চালু করুন এবং একাধিক ইনবক্সের মধ্যে সহজে সুইচ করুন।',
      inputLabel: 'পছন্দের ইউজারনেম',
      inputPlaceholder: 'যেমন: shop.alex বা dev.test',
      createBtn: 'ঠিকানা তৈরি করুন',
      suggestions: 'দ্রুত পরামর্শ',
      savedTitle: 'আপনার সক্রিয় ও সাম্প্রতিক @rana.fr ইনবক্স',
      savedEmpty: 'এখনো কোনো অতিরিক্ত ইনবক্স সংরক্ষিত নেই।',
      switchBtn: 'ইনবক্সে যান',
      activeLabel: 'বর্তমানে সক্রিয়',
      deleteBtn: 'মুছুন',
      rulesNote: '৩ থেকে ৩২ অক্ষর · ছোট হাতের ইংরেজি অক্ষর, সংখ্যা, ডট (.), হাইফেন (-) বা আন্ডারস্কোর (_) অনুমোদিত।',
    },
    apiView: {
      title: 'ইনবাউন্ড ইমেইল API ও DNS ওয়েবহুক',
      subtitle: 'সরাসরি HTTP POST অনুরোধ পাঠিয়ে যেকোনো @rana.fr ঠিকানায় ইমেইল ডেলিভারি করুন অথবা Cloudflare Email Routing যুক্ত করে আসল বাইরের ইমেইল গ্রহণ করুন।',
      endpointLabel: 'ইনবাউন্ড ওয়েবহুক এন্ডপয়েন্ট',
      copyEndpoint: 'URL কপি করুন',
      testerTitle: 'লাইভ ওয়েবহুক টেস্ট কনসোল',
      toLabel: 'প্রাপক (@rana.fr)',
      fromLabel: 'প্রেরক ইমেইল',
      subjectLabel: 'বিষয়',
      bodyLabel: 'বার্তার টেক্সট',
      sendBtn: 'এখনই ইনবক্সে পাঠান',
      sending: 'পাঠানো হচ্ছে...',
      sentSuccess: 'ইমেইল সফলভাবে @rana.fr ইনবক্সে পৌঁছেছে!',
      curlTitle: 'cURL উদাহরণ',
      cloudflareTitle: 'আসল ইন্টারনেট ইমেইল রিসিভ সেটআপ (Cloudflare Email Routing)',
      cloudflareDesc: 'আপনি যদি rana.fr ডোমেইনের মালিক হন, তাহলে Cloudflare DNS-এ Email Routing চালু করে নিচের Worker কোডটি বসালে Gmail বা যেকোনো সার্ভিস থেকে আসা আসল ইমেইল সরাসরি এই অ্যাপের ইনবক্সে চলে আসবে।',
    },
    guideView: {
      title: 'ব্যবহার নির্দেশিকা ও গোপনীয়তা',
      subtitle: '@rana.fr টেমমেইল কীভাবে কাজ করে এবং আপনার নিরাপত্তা কীভাবে নিশ্চিত হয়।',
      faqs: [
        {
          q: 'ডিসপোজেবল @rana.fr ইমেইল কেন ব্যবহার করবেন?',
          a: 'বিভিন্ন ওয়েবসাইটে সাইনআপ, ফ্রি ট্রায়াল, ডাউনলোড বা ডেভেলপমেন্ট টেস্টিংয়ের সময় আপনার আসল ব্যক্তিগত ইমেইল স্প্যাম এবং ট্র্যাকিং থেকে নিরাপদ রাখতে এটি সাহায্য করে।',
        },
        {
          q: 'প্রতিটি ইনবক্সের মেয়াদ কতক্ষণ থাকে?',
          a: 'প্রতিটি নতুন @rana.fr ঠিকানা তৈরি হওয়ার পর ৬০ মিনিট সক্রিয় থাকে। প্রয়োজন হলে এক ক্লিকেই আপনি মেয়াদ আরও ৬০ মিনিট বাড়াতে পারবেন অথবা কাজ শেষে সাথে সাথে মুছে ফেলতে পারবেন।',
        },
        {
          q: 'Facebook বা বাইরের সাইটের ৫-ডিজিট কোড কীভাবে রিসিভ হবে?',
          a: 'অ্যাপের ভেতরে ৪ থেকে ৮ ডিজিটের (৫-ডিজিটসহ) সব OTP কোড শনাক্ত ও রিসিভ করা হয়। তবে বাইরের আসল ওয়েবসাইট (যেমন Facebook) থেকে @rana.fr ঠিকানায় ইমেইল আসতে হলে ডোমেইনের মালিককে rana.fr-এর DNS MX রেকর্ড Cloudflare Email Routing-এ যুক্ত করে /api/inbound ওয়েবহুকে ফরোয়ার্ড করতে হবে (বর্তমানে ডোমেইনটির MX mx186.m2bp.com-এ পয়েন্ট করা)।',
        },
        {
          q: 'HTML ইমেইল কি নিরাপদ স্যান্ডবক্সে প্রদর্শিত হয়?',
          a: 'সকল HTML ইমেইল স্ক্রিপ্ট মুক্ত করে স্যান্ডবক্সড ফ্রেমে রেন্ডার করা হয়, ফলে ক্ষতিকর জাভাস্ক্রিপ্ট বা ইভেন্ট হ্যান্ডলার আপনার ব্রাউজারে চলতে পারে না।',
        },
      ],
    },
    modal: {
      title: 'টেস্ট ইমেইল পাঠান',
      subtitle: 'আপনার সক্রিয় @rana.fr ইনবক্সে সাথে সাথে একটি নমুনা ইমেইল পাঠিয়ে রিডার ও ৫/৬-ডিজিট OTP শনাক্তকরণ যাচাই করুন।',
      presetOtp: '৬-ডিজিট OTP',
      presetOtp5: '৫-ডিজিট কোড (FB)',
      presetWelcome: 'সাইনআপ কনফার্মেশন',
      presetInvoice: 'পেমেন্ট রিসিট',
      presetCustom: 'নিজের মতো লিখুন',
      senderName: 'প্রেরকের নাম',
      senderEmail: 'প্রেরকের ইমেইল',
      subject: 'ইমেইলের বিষয়',
      messageBody: 'ইমেইলের মূল বার্তা',
      sendNow: 'ইনবক্সে পাঠান',
      close: 'বন্ধ করুন',
    },
    footer: {
      note: 'অস্থায়ী ইনবক্সগুলো মেয়াদ শেষে স্বয়ংক্রিয়ভাবে মুছে যায়। সংবেদনশীল ব্যাংকিং বা স্থায়ী অ্যাকাউন্টের জন্য ব্যবহার করবেন না।',
      domain: '@rana.fr অস্থায়ী মেইল সেবা',
    },
  },
  en: {
    nav: {
      inbox: 'Inbox',
      custom: 'Custom Alias',
      api: 'Inbound API',
      guide: 'Guide',
      newAddress: 'New Address',
    },
    addressBar: {
      label: 'Your disposable @rana.fr address',
      copy: 'Copy',
      copied: 'Copied',
      random: 'Randomize',
      customEdit: 'Custom',
      save: 'Save',
      cancel: 'Cancel',
      extend: 'Extend 60m',
      burn: 'Burn Inbox',
      expiresIn: 'Expires',
      liveStream: 'Live stream connected',
      reconnecting: 'Reconnecting',
      unread: 'Unread',
      total: 'Messages',
      activeInboxes: 'Active aliases',
      invalidAlias: 'Use 3–32 lowercase letters, numbers, dots (.), or hyphens (-).',
    },
    toolbar: {
      all: 'All Mail',
      unread: 'Unread',
      otpOnly: 'OTP Codes',
      searchPlaceholder: 'Search subject or sender...',
      sendTest: 'Send Test Mail',
      refresh: 'Refresh',
      lightMode: 'Light',
      darkMode: 'Dark',
    },
    mailbox: {
      inboxTitle: 'Inbox Messages',
      emptyTitle: 'No messages yet',
      emptyDesc: 'Copy your @rana.fr address above to sign up anywhere, or send an instant test email to verify live delivery and OTP extraction.',
      emptyAction: 'Send Test Verification Email',
      noFilterMatch: 'No messages match this filter.',
      selectPrompt: 'Select a message from the list to read its contents.',
      from: 'From',
      to: 'To',
      received: 'Received',
      otpDetected: 'Verification code detected',
      copyCode: 'Copy Code',
      codeCopied: 'Code Copied',
      openLink: 'Verification Link',
      tabHtml: 'Preview',
      tabText: 'Plain Text',
      tabRaw: 'Raw Headers',
      downloadEml: 'Download .eml',
      deleteMail: 'Delete',
      attachments: 'Attachments',
      noSubject: '(No subject)',
    },
    customView: {
      title: 'Create a Custom @rana.fr Address',
      subtitle: 'Launch a memorable disposable inbox instantly and switch between multiple active @rana.fr addresses in one session.',
      inputLabel: 'Preferred username',
      inputPlaceholder: 'e.g. shop.alex or dev.test',
      createBtn: 'Create Address',
      suggestions: 'Quick suggestions',
      savedTitle: 'Your Active & Recent @rana.fr Inboxes',
      savedEmpty: 'No additional inboxes saved yet.',
      switchBtn: 'Open Inbox',
      activeLabel: 'Active',
      deleteBtn: 'Delete',
      rulesNote: '3–32 characters · lowercase letters, numbers, dots (.), hyphens (-), or underscores (_).',
    },
    apiView: {
      title: 'Inbound Email API & DNS Webhook',
      subtitle: 'Deliver messages programmatically to any @rana.fr address via HTTP POST, or connect Cloudflare Email Routing to ingest real external mail.',
      endpointLabel: 'Inbound Webhook Endpoint',
      copyEndpoint: 'Copy URL',
      testerTitle: 'Live Webhook Test Console',
      toLabel: 'Recipient (@rana.fr)',
      fromLabel: 'Sender Email',
      subjectLabel: 'Subject',
      bodyLabel: 'Message Body',
      sendBtn: 'Deliver to Inbox',
      sending: 'Sending...',
      sentSuccess: 'Email delivered to the @rana.fr inbox!',
      curlTitle: 'cURL Example',
      cloudflareTitle: 'Real Internet Email Routing (Cloudflare Email Worker)',
      cloudflareDesc: 'If you control the DNS for rana.fr, enable Cloudflare Email Routing and attach this Worker script to forward real external emails directly into this server.',
    },
    guideView: {
      title: 'How @rana.fr Temp Mail Works',
      subtitle: 'Disposable address lifecycle, privacy isolation, and security sandbox details.',
      faqs: [
        {
          q: 'Why use a disposable @rana.fr email?',
          a: 'Use it for signups, QA testing, newsletters, or downloads to keep your primary personal inbox free of spam and tracking pixels.',
        },
        {
          q: 'How long does each inbox stay active?',
          a: 'Each @rana.fr address remains active for 60 minutes. You can extend its timer by another 60 minutes anytime or burn it immediately.',
        },
        {
          q: 'Why aren’t external 5-digit codes (like Facebook) arriving automatically?',
          a: 'The inbox and OTP detector support 4–8 digit codes (including 5-digit codes like FB-12345). However, receiving real external internet emails to @rana.fr requires pointing the domain’s DNS MX records to Cloudflare Email Routing and forwarding to /api/inbound (currently rana.fr MX points to mx186.m2bp.com).',
        },
        {
          q: 'Is HTML email rendering safe?',
          a: 'Yes. Scripts and inline event handlers are stripped and rendered inside a locked sandboxed iframe.',
        },
      ],
    },
    modal: {
      title: 'Send Test Email',
      subtitle: 'Deliver a realistic sample email to your active @rana.fr inbox to test real-time arrival and 5/6-digit OTP detection.',
      presetOtp: '6-Digit OTP',
      presetOtp5: '5-Digit Code (FB)',
      presetWelcome: 'Account Confirmation',
      presetInvoice: 'Payment Receipt',
      presetCustom: 'Custom Message',
      senderName: 'Sender Name',
      senderEmail: 'Sender Email',
      subject: 'Subject',
      messageBody: 'Message Body',
      sendNow: 'Send to Inbox',
      close: 'Close',
    },
    footer: {
      note: 'Temporary @rana.fr inboxes expire automatically. Do not use for banking or permanent recovery accounts.',
      domain: '@rana.fr Disposable Mail Service',
    },
  },
};
