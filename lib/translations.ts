export type InvitationLanguage = "EN" | "AR";

export type Translation = {
  EN: string;
  AR: string;
};

export function getTranslation(
  translation: Translation,
  language: InvitationLanguage,
) {
  return translation[language];
}

export function formatInvitationNumber(
  value: number,
  language: InvitationLanguage,
) {
  return new Intl.NumberFormat(language === "AR" ? "ar-EG" : "en-US", {
    useGrouping: false,
  }).format(value);
}

export const invitationTranslations = {
  topText: {
    personalized: {
      EN: "Mohamed & Habiba, together with their families, invite",
      AR: "محمد وحبيبة برفقة عائلتيهما يدعوان",
    },
    generic: {
      EN: "Together with their families with hearts full of love",
      AR: "برفقة عائلتيهما وبقلوب ممتلئة بالحب",
    },
  },
  bottomText: {
    personalized: {
      EN: "to celebrate the beginning of their forever.",
      AR: "للاحتفال ببداية حكايتهما للأبد.",
    },
    generic: {
      EN: "Invite you to witness the beginning of their forever",
      AR: "يدعوانكم لتشهدوا بداية حكايتهما للأبد",
    },
  },
  date: {
    day: {
      EN: "Saturday",
      AR: "السبت",
    },
    month: {
      EN: "April",
      AR: "أبريل",
    },
    time: {
      EN: "6 PM",
      AR: "٦ مساءً",
    },
  },
  location: {
    venue: {
      EN: "Aurora Lounge",
      AR: "أورورا لاونج",
    },
  },
  actions: {
    moreDetails: {
      EN: "More Details",
      AR: "المزيد من التفاصيل",
    },
    needHelp: {
      EN: "Need help?",
      AR: "تحتاج مساعدة؟",
    },
    helpMessage: {
      EN: "Hi I need some help",
      AR: "مرحبًا، أحتاج بعض المساعدة",
    },
    back: {
      EN: "Back",
      AR: "رجوع",
    },
    close: {
      EN: "Close",
      AR: "إغلاق",
    },
  },
  details: {
    title: {
      EN: "Details",
      AR: "التفاصيل",
    },
    photoGalleryTitle: {
      EN: "Photo Gallery",
      AR: "معرض الصور",
    },
    photoGalleryBody: {
      EN: "Upload & view photos on Google Drive",
      AR: "ارفعوا الصور وشاهدوها على Google Drive",
    },
    adultsOnlyTitle: {
      EN: "Adults-Only Celebration",
      AR: "حفل للبالغين فقط",
    },
    adultsOnlyBody: {
      EN: "We love your little ones, but our wedding will be adults-only. We appreciate your understanding.",
      AR: "نحب أطفالكم كثيرًا، لكن حفل زفافنا سيقتصر على البالغين فقط. نقدّر تفهّمكم.",
    },
    invitationNoteTitle: {
      EN: "Invitation Note",
      AR: "ملاحظة الدعوة",
    },
    invitationNoteBody: {
      EN: "This invitation is reserved especially for you. Please do not share it.",
      AR: "هذه الدعوة مخصصة لكم خصيصًا. نرجو عدم مشاركتها.",
    },
  },
  rsvp: {
    cta: {
      EN: "RSVP",
      AR: "تأكيد الحضور",
    },
    title: {
      EN: "RSVP",
      AR: "تأكيد الحضور",
    },
    description: {
      EN: "Please confirm attendance for each guest.",
      AR: "يرجى تأكيد حضور كل ضيف.",
    },
    thankYou: {
      EN: "Thank you for responding!",
      AR: "شكرًا لتأكيدكم.",
    },
    confirmGuest: {
      EN: "Confirm",
      AR: "تأكيد",
    },
    declineGuest: {
      EN: "Decline",
      AR: "اعتذار",
    },
  },
} as const;
