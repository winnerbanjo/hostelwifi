import { randomUUID } from "crypto";
import { Collection, Db, Filter, MongoClient } from "mongodb";

type AnyRecord = Record<string, any>;
type ModelName =
  | "adminUser"
  | "hostel"
  | "plan"
  | "hostelPlan"
  | "customer"
  | "order"
  | "voucher"
  | "paymentLog"
  | "supportTicket"
  | "policyPage"
  | "walletTransaction"
  | "auditLog"
  | "businessSettings";

const collectionNames: Record<ModelName, string> = {
  adminUser: "adminUsers",
  hostel: "hostels",
  plan: "plans",
  hostelPlan: "hostelPlans",
  customer: "customers",
  order: "orders",
  voucher: "vouchers",
  paymentLog: "paymentLogs",
  supportTicket: "supportTickets",
  policyPage: "policyPages",
  walletTransaction: "walletTransactions",
  auditLog: "auditLogs",
  businessSettings: "businessSettings"
};

const globalForMongo = globalThis as unknown as { mongoClientPromise?: Promise<MongoClient> };

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required.");
  return uri;
}

function clientPromise() {
  if (!globalForMongo.mongoClientPromise) {
    globalForMongo.mongoClientPromise = new MongoClient(getMongoUri()).connect();
  }
  return globalForMongo.mongoClientPromise;
}

async function database() {
  const client = await clientPromise();
  return client.db();
}

function nowFields(isCreate: boolean) {
  const now = new Date();
  return isCreate ? { createdAt: now, updatedAt: now } : { updatedAt: now };
}

function cleanUndefined(input: AnyRecord) {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}

function toMongoWhere(where: AnyRecord = {}) {
  const filter: AnyRecord = {};
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined || typeof value === "object" && value !== null && !Array.isArray(value) && !("$in" in value) && !("in" in value) && !("gte" in value) && !("lte" in value)) {
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const clause: AnyRecord = {};
      if ("in" in value) clause.$in = value.in;
      if ("$in" in value) clause.$in = value.$in;
      if ("gte" in value && value.gte !== undefined) clause.$gte = value.gte;
      if ("lte" in value && value.lte !== undefined) clause.$lte = value.lte;
      filter[key] = clause;
    } else {
      filter[key] = value;
    }
  }
  return filter as Filter<AnyRecord>;
}

function primaryWhere(where: AnyRecord) {
  if (where.email_phone) return { email: where.email_phone.email, phone: where.email_phone.phone };
  if (where.hostelId_planId) return { hostelId: where.hostelId_planId.hostelId, planId: where.hostelId_planId.planId };
  return where;
}

function sortFrom(orderBy: AnyRecord = {}) {
  const [[field, direction] = []] = Object.entries(orderBy);
  if (!field || typeof direction !== "string") return undefined;
  return { [field]: direction === "desc" ? -1 : 1 } as AnyRecord;
}

class MongoModel {
  constructor(private name: ModelName) {}

  private async collection(): Promise<Collection<AnyRecord>> {
    const db = await database();
    return db.collection(collectionNames[this.name]);
  }

  async findMany(args: AnyRecord = {}): Promise<any[]> {
    const collection = await this.collection();
    const query = toMongoWhere(args.where);
    let rows: AnyRecord[] = await collection.find(query).sort(sortFrom(args.orderBy) || {}).limit(args.take || 0).toArray();
    rows = await this.applyRelationalWhere(rows, args.where || {});
    rows = await this.applyInclude(rows, args.include);
    rows = this.applyNestedSort(rows, args.orderBy);
    return rows.map(stripMongoId);
  }

  async findUnique(args: AnyRecord): Promise<any | null> {
    const collection = await this.collection();
    const row = await collection.findOne(toMongoWhere(primaryWhere(args.where)));
    if (!row) return null;
    const [included] = await this.applyInclude([row], args.include);
    return stripMongoId(included);
  }

  async findFirst(args: AnyRecord = {}): Promise<any | null> {
    const rows = await this.findMany({ ...args, take: 1 });
    return rows[0] || null;
  }

  async create(args: AnyRecord): Promise<any> {
    const collection = await this.collection();
    const row = { id: randomUUID(), ...cleanUndefined(args.data || {}), ...nowFields(true) };
    await collection.insertOne(row);
    return stripMongoId(row);
  }

  async createMany(args: AnyRecord) {
    const collection = await this.collection();
    const data = (args.data || []).map((item: AnyRecord) => ({ id: randomUUID(), ...cleanUndefined(item), ...nowFields(true) }));
    if (!data.length) return { count: 0 };
    if (!args.skipDuplicates) {
      const result = await collection.insertMany(data);
      return { count: result.insertedCount };
    }
    let count = 0;
    for (const item of data) {
      const duplicate = this.name === "hostelPlan"
        ? await collection.findOne({ hostelId: item.hostelId, planId: item.planId })
        : null;
      if (!duplicate) {
        await collection.insertOne(item);
        count += 1;
      }
    }
    return { count };
  }

  async update(args: AnyRecord): Promise<any> {
    const collection = await this.collection();
    const data = cleanUndefined({ ...(args.data || {}), ...nowFields(false) });
    const result = await collection.findOneAndUpdate(
      toMongoWhere(primaryWhere(args.where)),
      { $set: data },
      { returnDocument: "after" }
    );
    if (!result) throw new Error(`${this.name} not found.`);
    return stripMongoId(result);
  }

  async delete(args: AnyRecord): Promise<any> {
    const collection = await this.collection();
    const result = await collection.findOneAndDelete(toMongoWhere(primaryWhere(args.where)));
    if (!result) throw new Error(`${this.name} not found.`);
    return stripMongoId(result);
  }

  async upsert(args: AnyRecord): Promise<any> {
    const existing = await this.findUnique({ where: args.where });
    if (existing) {
      if (!args.update || !Object.keys(args.update).length) return existing;
      return this.update({ where: args.where, data: args.update });
    }
    return this.create({ data: { ...primaryWhere(args.where), ...(args.create || {}) } });
  }

  async count(args: AnyRecord = {}) {
    const rows = await this.findMany({ where: args.where });
    return rows.length;
  }

  async aggregate(args: AnyRecord = {}) {
    const rows = await this.findMany({ where: args.where });
    const amount = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return { _sum: { amount }, _count: rows.length };
  }

  async groupBy(args: AnyRecord = {}) {
    const by = Array.isArray(args.by) ? args.by[0] : args.by;
    const rows = await this.findMany({ where: args.where });
    const groups = new Map<string, AnyRecord>();
    for (const row of rows) {
      const key = row[by];
      if (!groups.has(key)) groups.set(key, { [by]: key, _sum: { amount: 0 }, _count: 0 });
      const group = groups.get(key)!;
      group._sum.amount += Number(row.amount || 0);
      group._count += 1;
    }
    let result = Array.from(groups.values());
    if (args.orderBy?._count) result = result.sort((a, b) => b._count - a._count);
    if (args.orderBy?._sum?.amount) result = result.sort((a, b) => b._sum.amount - a._sum.amount);
    if (args.take) result = result.slice(0, args.take);
    return result;
  }

  private async applyRelationalWhere(rows: AnyRecord[], where: AnyRecord) {
    if (this.name !== "hostelPlan" || !where?.plan?.status) return rows;
    const planIds = rows.map((row) => row.planId);
    const plans = await db.plan.findMany({ where: { status: where.plan.status } });
    const active = new Set(plans.filter((plan: AnyRecord) => planIds.includes(plan.id)).map((plan: AnyRecord) => plan.id));
    return rows.filter((row) => active.has(row.planId));
  }

  private applyNestedSort(rows: AnyRecord[], orderBy: AnyRecord = {}) {
    if (this.name === "hostelPlan" && orderBy?.plan?.price) {
      return [...rows].sort((a, b) => Number(a.plan?.price || 0) - Number(b.plan?.price || 0));
    }
    return rows;
  }

  private async applyInclude(rows: AnyRecord[], include?: AnyRecord) {
    if (!include || !rows.length) return rows;
    return Promise.all(rows.map((row) => includeRelations(this.name, row, include)));
  }
}

async function includeRelations(name: ModelName, row: AnyRecord, include: AnyRecord) {
  const result = { ...row };
  if ((name === "order" || name === "voucher" || name === "supportTicket") && include.hostel && row.hostelId) {
    result.hostel = await db.hostel.findUnique({ where: { id: row.hostelId } });
  }
  if ((name === "order" || name === "voucher") && include.plan && row.planId) {
    result.plan = await db.plan.findUnique({ where: { id: row.planId } });
  }
  if (name === "voucher" && include.customer && row.customerId) {
    result.customer = await db.customer.findUnique({ where: { id: row.customerId } });
  }
  if (name === "voucher" && include.order && row.orderId) {
    result.order = await db.order.findUnique({ where: { id: row.orderId } });
  }
  if (name === "order" && include.voucher) {
    result.voucher = await db.voucher.findUnique({ where: { orderId: row.id } });
    result.voucherId = result.voucher?.id || row.voucherId || null;
  }
  if (name === "order" && include.paymentLogs) {
    result.paymentLogs = await db.paymentLog.findMany({ where: { orderId: row.id }, orderBy: { createdAt: "desc" } });
  }
  if (name === "hostelPlan" && include.plan && row.planId) {
    result.plan = await db.plan.findUnique({ where: { id: row.planId } });
  }
  if (name === "hostelPlan" && include.hostel && row.hostelId) {
    result.hostel = await db.hostel.findUnique({ where: { id: row.hostelId } });
  }
  if (name === "customer" && include.orders) {
    result.orders = await db.order.findMany({ where: { customerId: row.id }, orderBy: { createdAt: "desc" } });
  }
  if (name === "customer" && include.walletTransactions) {
    result.walletTransactions = await db.walletTransaction.findMany({ where: { customerId: row.id }, orderBy: { createdAt: "desc" } });
  }
  if (name === "walletTransaction" && include.customer && row.customerId) {
    result.customer = await db.customer.findUnique({ where: { id: row.customerId } });
  }
  if (name === "supportTicket" && include.order && row.orderId) {
    result.order = await db.order.findUnique({ where: { id: row.orderId } });
  }
  if (name === "supportTicket" && include.voucher && row.voucherId) {
    result.voucher = await db.voucher.findUnique({ where: { id: row.voucherId } });
  }
  return result;
}

function stripMongoId<T extends AnyRecord | null>(row: T): T {
  if (!row) return row;
  const { _id, ...rest } = row;
  return rest as T;
}

export const db = {
  adminUser: new MongoModel("adminUser"),
  hostel: new MongoModel("hostel"),
  plan: new MongoModel("plan"),
  hostelPlan: new MongoModel("hostelPlan"),
  customer: new MongoModel("customer"),
  order: new MongoModel("order"),
  voucher: new MongoModel("voucher"),
  paymentLog: new MongoModel("paymentLog"),
  supportTicket: new MongoModel("supportTicket"),
  policyPage: new MongoModel("policyPage"),
  walletTransaction: new MongoModel("walletTransaction"),
  auditLog: new MongoModel("auditLog"),
  businessSettings: new MongoModel("businessSettings"),
  $transaction<T>(callback: (tx: any) => Promise<T>) {
    return callback(db);
  },
  async $disconnect() {
    const client = await globalForMongo.mongoClientPromise;
    await client?.close();
    globalForMongo.mongoClientPromise = undefined;
  },
  async $db(): Promise<Db> {
    return database();
  }
};
