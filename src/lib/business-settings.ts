import { business } from "@/lib/constants";
import { db } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/demo-data";

export type BankDetails = {
  accountNumber: string;
  bankName: string;
  accountName: string;
};

export const defaultBankDetails: BankDetails = {
  accountNumber: business.bank.accountNumber,
  bankName: business.bank.bankName,
  accountName: business.bank.accountName
};

export async function getBankDetails(): Promise<BankDetails> {
  if (!hasDatabaseUrl) return defaultBankDetails;

  const settings = await db.businessSettings.findUnique({
    where: { id: "default" }
  });

  if (!settings) return defaultBankDetails;

  return {
    accountNumber: settings.bankAccountNumber,
    bankName: settings.bankName,
    accountName: settings.bankAccountName
  };
}

export type SupportContact = {
  id: string;
  name: string;
  phone: string;
};

export const defaultSupportContacts: SupportContact[] = [
  { id: "1", name: "WhatsApp Support 1", phone: business.phone },
  { id: "2", name: "WhatsApp Support 2", phone: business.phoneAlt || business.whatsapp }
];

export async function getSupportContacts(): Promise<SupportContact[]> {
  if (!hasDatabaseUrl) return defaultSupportContacts;
  const settings = await db.businessSettings.findUnique({
    where: { id: "default" }
  });
  return settings?.supportContacts || defaultSupportContacts;
}
