import { z } from "zod";

export const orderSchema = z.object({
  hostelId: z.string().min(1),
  planId: z.string().min(1),
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  roomNumber: z.string().min(1),
  blockFloor: z.string().optional().default(""),
  paymentMethod: z.literal("bank_transfer")
});

export const bankTransferSchema = z.object({
  reference: z.string().min(1),
  bankTransferReference: z.string().optional().default(""),
  bankTransferProofUrl: z.string().optional().default("")
});

export const supportSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email().optional().or(z.literal("")),
  hostelId: z.string().optional().or(z.literal("")),
  roomNumber: z.string().optional().default(""),
  issueType: z.string().min(2),
  codeOrReference: z.string().optional().default(""),
  message: z.string().min(8),
  screenshotUrl: z.string().optional().default("")
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const customerSignupSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  email: z.string().email(),
  password: z.string().min(6),
  hostelId: z.string().min(1)
});

export const customerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const walletTopupSchema = z.object({
  amount: z.coerce.number().int().positive(),
  bankTransferReference: z.string().optional().default(""),
  bankTransferProofUrl: z.string().optional().default("")
});

export const walletOrderSchema = z.object({
  hostelId: z.string().min(1),
  planId: z.string().min(1),
  roomNumber: z.string().min(1),
  blockFloor: z.string().optional().default("")
});
