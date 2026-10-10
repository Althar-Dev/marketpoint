import {
  doc,
  setDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  getDoc,
  getDocs,
  updateDoc,
  Firestore,
  increment,
  limit,
  where,
} from "firebase/firestore";

export interface ChatProductPreview {
  id: string;
  title: string;
  price: number;
  imageUrl?: string;
  slug?: string;
  category?: string;
}

export interface ChatReplyPreview {
  messageId: string;
  senderName: string;
  senderRole: "BUYER" | "SELLER";
  text: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderRole: "BUYER" | "SELLER";
  senderName: string;
  senderAvatar?: string;
  text: string;
  productPreview?: ChatProductPreview | null;
  replyTo?: ChatReplyPreview | null;
  isRead?: boolean;
  createdAt: any;
}

export interface ChatThread {
  id: string;
  shopId: string;
  shopSlug: string;
  shopName: string;
  shopLogo?: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar?: string;
  lastMessage: string;
  lastMessageAt?: any;
  unreadByShop?: number;
  unreadByBuyer?: number;
  createdAt?: any;
}

export const QUICK_TEMPLATES = [
  "Halo, apakah stok ini masih tersedia?",
  "Bisa diproses dan dikirim hari ini?",
  "Apakah produk ini bergaransi?",
  "Apakah support konsultasi cara pakai?",
];

export function getChatId(shopId: string, buyerId: string): string {
  // Sanitize IDs to avoid path issues
  const s = String(shopId || "shop").replace(/[^a-zA-Z0-9_-]/g, "_");
  const b = String(buyerId || "buyer").replace(/[^a-zA-Z0-9_-]/g, "_");
  return `${s}__${b}`;
}

export async function sendChatMessage(
  db: Firestore,
  params: {
    shopId: string;
    shopSlug: string;
    shopName: string;
    shopLogo?: string;
    buyerId: string;
    buyerName: string;
    buyerAvatar?: string;
    senderId: string;
    senderRole: "BUYER" | "SELLER";
    senderName: string;
    senderAvatar?: string;
    text: string;
    productPreview?: ChatProductPreview | null;
    replyTo?: ChatReplyPreview | null;
  }
) {
  const chatId = getChatId(params.shopId, params.buyerId);
  const chatRef = doc(db, "chats", chatId);
  const messagesRef = collection(db, "chats", chatId, "messages");

  // 1. Create or update chat thread metadata
  await setDoc(
    chatRef,
    {
      id: chatId,
      shopId: params.shopId,
      shopSlug: params.shopSlug,
      shopName: params.shopName,
      shopLogo: params.shopLogo || "",
      buyerId: params.buyerId,
      buyerName: params.buyerName,
      buyerAvatar: params.buyerAvatar || "",
      lastMessage: params.text,
      lastMessageAt: serverTimestamp(),
      unreadByShop: params.senderRole === "BUYER" ? increment(1) : 0,
      unreadByBuyer: params.senderRole === "SELLER" ? increment(1) : 0,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

    const sanitizedReplyTo = params.replyTo
      ? {
          messageId: String(params.replyTo.messageId || ""),
          senderName: String(params.replyTo.senderName || "Pengguna"),
          senderRole: (params.replyTo.senderRole || "BUYER") as "BUYER" | "SELLER",
          text: String(params.replyTo.text || ""),
        }
      : null;

    // 2. Add message to messages subcollection
    const msgDoc = await addDoc(messagesRef, {
      chatId,
      senderId: params.senderId,
      senderRole: params.senderRole,
      senderName: params.senderName,
      senderAvatar: params.senderAvatar || "",
      text: params.text,
      productPreview: params.productPreview || null,
      replyTo: sanitizedReplyTo,
      isRead: false,
      createdAt: serverTimestamp(),
    });

    return { chatId, messageId: msgDoc.id };
}

export function subscribeToChatMessages(
  db: Firestore,
  chatId: string,
  onUpdate: (messages: ChatMessage[]) => void
) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));

  return onSnapshot(q, (snapshot) => {
    const list: ChatMessage[] = [];
    snapshot.forEach((d) => {
      list.push({ id: d.id, ...d.data() } as ChatMessage);
    });
    onUpdate(list);
  });
}

export function subscribeToShopChats(
  db: Firestore,
  shopId: string,
  onUpdate: (threads: ChatThread[]) => void
) {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("shopId", "==", shopId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ChatThread[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ChatThread);
      });
      list.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : (a.lastMessageAt?.seconds ? a.lastMessageAt.seconds * 1000 : 0);
        const timeB = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : (b.lastMessageAt?.seconds ? b.lastMessageAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      onUpdate(list);
    },
    (err) => {
      console.warn("subscribeToShopChats error:", err);
    }
  );
}

export async function markChatReadByShop(db: Firestore, chatId: string) {
  try {
    const chatRef = doc(db, "chats", chatId);
    await setDoc(chatRef, { unreadByShop: 0 }, { merge: true });

    // Mark unread messages sent by BUYER as read
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, where("senderRole", "==", "BUYER"), where("isRead", "==", false));
    const snap = await getDocs(q);
    const batchUpdates = snap.docs.map((d) => updateDoc(d.ref, { isRead: true }));
    await Promise.all(batchUpdates);
  } catch (err) {
    console.warn("markChatReadByShop error:", err);
  }
}

export function subscribeToBuyerChats(
  db: Firestore,
  buyerId: string,
  onUpdate: (threads: ChatThread[]) => void
) {
  const chatsRef = collection(db, "chats");
  const q = query(chatsRef, where("buyerId", "==", buyerId));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ChatThread[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as ChatThread);
      });
      list.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : (a.lastMessageAt?.seconds ? a.lastMessageAt.seconds * 1000 : 0);
        const timeB = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : (b.lastMessageAt?.seconds ? b.lastMessageAt.seconds * 1000 : 0);
        return timeB - timeA;
      });
      onUpdate(list);
    },
    (err) => {
      console.warn("subscribeToBuyerChats error:", err);
    }
  );
}

export async function markChatReadByBuyer(db: Firestore, chatId: string) {
  try {
    const chatRef = doc(db, "chats", chatId);
    await setDoc(chatRef, { unreadByBuyer: 0 }, { merge: true });

    // Mark unread messages sent by SELLER as read
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, where("senderRole", "==", "SELLER"), where("isRead", "==", false));
    const snap = await getDocs(q);
    const batchUpdates = snap.docs.map((d) => updateDoc(d.ref, { isRead: true }));
    await Promise.all(batchUpdates);
  } catch (err) {
    console.warn("markChatReadByBuyer error:", err);
  }
}



