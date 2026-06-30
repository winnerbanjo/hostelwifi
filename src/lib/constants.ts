export const business = {
  name: "Jendor The Plug 🔌",
  phone: "09033959493",
  phoneAlt: "09038264264",
  whatsapp: "09038264264",
  email: "Cooltake4@gmail.com",
  address: "No 5, back of Yemkem, Iworoko Ekiti, Ekiti State",
  bank: {
    accountNumber: process.env.BANK_ACCOUNT_NUMBER || "6141688034",
    bankName: process.env.BANK_NAME || "OPay",
    accountName: process.env.BANK_ACCOUNT_NAME || "OLADIMEJI FEMI ARIYO"
  }
};

export const whatsappLink = (message: string) =>
  `https://wa.me/234${business.whatsapp.slice(1)}?text=${encodeURIComponent(message)}`;

export const money = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);
